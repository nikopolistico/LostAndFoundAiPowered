from flask import Flask, request, jsonify
from flask_cors import CORS
import os
from werkzeug.utils import secure_filename
import base64
import glob
import threading
import io
import cv2
import numpy as np
from PIL import Image
import torch
from ultralytics import YOLO

app = Flask(__name__)
CORS(app)  # Enable CORS for all routes

UPLOAD_FOLDER = os.path.join(os.getcwd(), 'uploads')
ALLOWED_EXTENSIONS = {'png', 'jpg', 'jpeg', 'gif'}

os.makedirs(UPLOAD_FOLDER, exist_ok=True)
app.config['UPLOAD_FOLDER'] = UPLOAD_FOLDER

def allowed_file(filename):
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

# Map class indices to class names (Define this globally or within the function)
CLASS_MAPPING = {
    0: "Airpods", 1: "Backpack", 2: "Calculator", 3: "Cap", 4: "Eyeglasses", 
    5: "Flash-drive", 6: "Handbag", 7: "Headphone", 8: "Helmet", 9: "Key", 
    10: "Laptop", 11: "Laptop Bag", 12: "Phone Charger", 13: "Powerbank", 
    14: "Sling bag", 15: "Smart Watch", 16: "Wallet", 17: "Smartphone", 
    18: "Tablet", 19: "Totebag", 20: "Tumbler", 21: "Umbrella", 22: "Wallet", 
    23: "Watch"
}

# Global model cache and lock to avoid re-loading the model on each request
MODEL_CACHE = {}
MODEL_CACHE_LOCK = threading.Lock()

# Configure cuDNN for performance when CUDA is available
if torch.cuda.is_available():
    torch.backends.cudnn.benchmark = True
    torch.backends.cudnn.deterministic = False


def get_model(model_path: str):
    """Load or return a cached YOLO model. Applies device and half precision when CUDA is available."""
    with MODEL_CACHE_LOCK:
        model = MODEL_CACHE.get(model_path)
        if model is not None:
            return model

        # Load model (this can be slow the first time)
        model = YOLO(model_path)

        # Move to GPU if available
        if torch.cuda.is_available():
            try:
                model.model.to('cuda')
                # Use half precision on GPU for faster inference and lower memory
                try:
                    model.model.half()
                except Exception:
                    # Some model components may not support half; ignore if so.
                    pass
            except Exception:
                # If moving to cuda fails, continue with CPU model
                pass

        # Cache and return
        MODEL_CACHE[model_path] = model
        return model


@app.route('/predict_yolo', methods=['POST'])
def predict_yolo():
    try:
        if 'file' not in request.files:
            return jsonify({"message": "No file part in the request"}), 400

        file = request.files['file']
        if file.filename == '':
            return jsonify({"message": "No selected file"}), 400
        if not allowed_file(file.filename):
            return jsonify({"message": "Invalid file type"}), 400

        # Save the file temporarily
        safe_name = secure_filename(file.filename)
        temp_image_path = os.path.join(UPLOAD_FOLDER, safe_name)
        file.save(temp_image_path)

        try:
            model = request.form.get("model", "lostfound.pt")
            # Minimum confidence threshold for returning detections (can be passed as form param "min_conf")
            # Default is 0.6 (only high-confidence detections will be returned)
            try:
                min_conf = float(request.form.get("min_conf", 0.6))
            except ValueError:
                min_conf = 0.6
            # Also pass the same threshold to the YOLO CLI so it doesn't waste effort on low-confidence boxes
            conf = min_conf

            # Use in-process YOLO model (cached) for faster inference
            model_obj = get_model(model)

            # Optional: allow client to request a smaller imgsz for speed (default 640)
            try:
                imgsz = int(request.form.get('imgsz', 640))
            except Exception:
                imgsz = 640

            # Run prediction (this returns a Results object list)
            results = model_obj.predict(source=temp_image_path, conf=conf, imgsz=imgsz, save=False)

            # NOTE: keep the temporary input file until we finish creating the
            # annotated image so we can compare channel ordering against the
            # original image and avoid color shifts when encoding.

            # Parse results (we only sent one image, so use results[0])
            if not results or len(results) == 0:
                return jsonify({
                    "message": "No results returned by model." 
                }), 500

            res = results[0]

            detected_class_names = []

            # r.boxes may be empty if no detections
            try:
                boxes = getattr(res, 'boxes', None)
                if boxes is None or len(boxes) == 0:
                    # No detections
                    return jsonify({
                        "message": "No objects detected in the image."
                    }), 400

                # boxes.cls and boxes.conf are tensors; iterate safely
                cls_tensor = getattr(boxes, 'cls', None)
                conf_tensor = getattr(boxes, 'conf', None)

                cls_vals = cls_tensor.cpu().numpy() if cls_tensor is not None else []
                conf_vals = conf_tensor.cpu().numpy() if conf_tensor is not None else []

                for idx, class_idx in enumerate(cls_vals):
                    try:
                        confidence = float(conf_vals[idx]) if idx < len(conf_vals) else 0.0
                        if confidence < min_conf:
                            continue
                        class_idx_int = int(class_idx)
                        class_name = CLASS_MAPPING.get(class_idx_int, 'Unknown')
                        if isinstance(class_name, (list, tuple)):
                            class_name = class_name[0] if len(class_name) > 0 else 'Unknown'

                        detected_class_names.append({
                            'classname': str(class_name),
                            'confidence': round(confidence, 2)
                        })
                    except Exception as e:
                        print(f"Error extracting box info: {e}")
                        continue

                # Create annotated image and encode to base64. We will read the
                # original image and compare channel means to determine whether
                # the annotated image returned by `res.plot()` needs a BGR/RGB
                # channel swap. This avoids color shifts in the final JPEG.
                try:
                    annotated = res.plot()

                    # annotated may be in BGR or RGB. Read the original image
                    # from disk (cv2.imread returns BGR). If shapes differ, resize
                    # the original for a fair comparison.
                    try:
                        orig = cv2.imread(temp_image_path)
                        if orig is not None and annotated is not None and annotated.ndim == 3:
                            # Resize original to annotated shape for comparison
                            if (orig.shape[0], orig.shape[1]) != (annotated.shape[0], annotated.shape[1]):
                                orig_rs = cv2.resize(orig, (annotated.shape[1], annotated.shape[0]), interpolation=cv2.INTER_AREA)
                            else:
                                orig_rs = orig

                            # compute channel means
                            orig_means = orig_rs.mean(axis=(0,1))  # BGR means
                            ann_means = annotated.mean(axis=(0,1))
                            ann_flipped_means = ann_means[::-1]

                            # Compare distances to decide if annotated needs channel swap
                            dist_no_flip = float(np.linalg.norm(orig_means - ann_means))
                            dist_flip = float(np.linalg.norm(orig_means - ann_flipped_means))

                            if dist_flip + 1e-6 < dist_no_flip:
                                # annotated appears to have reversed channels vs orig
                                annotated = annotated[:, :, ::-1]
                    except Exception as e:
                        # If any of the comparison steps fail, continue and
                        # attempt to encode the annotated image as-is.
                        print(f"Original/annotated comparison failed: {e}")

                    # Convert to RGB for PIL (PIL expects RGB order)
                    try:
                        if annotated is not None and annotated.ndim == 3:
                            img_rgb = cv2.cvtColor(annotated, cv2.COLOR_BGR2RGB)
                        else:
                            img_rgb = annotated

                        img_pil = Image.fromarray(img_rgb)
                        buf = io.BytesIO()
                        img_pil.save(buf, format='JPEG', quality=90)
                        img_b64 = base64.b64encode(buf.getvalue()).decode('utf-8')
                    except Exception:
                        # Fallback to OpenCV encoding if PIL fails
                        try:
                            # cv2.imencode expects BGR
                            if annotated is not None and annotated.ndim == 3:
                                ret, buf = cv2.imencode('.jpg', annotated)
                            else:
                                ret, buf = False, None
                            if ret:
                                img_b64 = base64.b64encode(buf.tobytes()).decode('utf-8')
                            else:
                                img_b64 = ''
                        except Exception as e:
                            print(f"Fallback encoding failed: {e}")
                            img_b64 = ''
                except Exception as e:
                    print(f"Error creating annotated image: {e}")
                    img_b64 = ''

                print('Detected objects:', detected_class_names)
                return jsonify({
                    'image': img_b64,
                    'detections': detected_class_names
                }), 200

            except Exception as e:
                print(f"Error parsing results: {e}")
                return jsonify({"message": "Error parsing model results", "error": str(e)}), 500

            finally:
                # Attempt to clean up any output files the YOLO run might have created.
                # We look for files under runs/detect/** that include the uploaded file's base name.
                output_image_path = None
                result_txt_path = None
                try:
                    base_name = os.path.splitext(safe_name)[0]
                    runs_dir = os.path.join(os.getcwd(), 'runs', 'detect')
                    matches = glob.glob(os.path.join(runs_dir, '**', f'*{base_name}*.*'), recursive=True)
                    for p in matches:
                        # prefer the txt as result txt, others as images
                        if p.lower().endswith('.txt'):
                            result_txt_path = p
                        else:
                            output_image_path = p

                    # Clean up the output files after reading
                    try:
                        if output_image_path and os.path.exists(output_image_path):
                            os.remove(output_image_path)
                        if result_txt_path and os.path.exists(result_txt_path):
                            os.remove(result_txt_path)
                    except Exception as e:
                        print(f"Error deleting output files: {e}")
                    # Also remove the temporary uploaded input image to avoid
                    # filling up storage in the `uploads/` folder.
                    try:
                        if temp_image_path and os.path.exists(temp_image_path):
                            os.remove(temp_image_path)
                    except Exception as e:
                        print(f"Error deleting temp input file: {e}")
                except Exception:
                    # If runs dir doesn't exist or glob fails, nothing to clean.
                    pass

        except Exception as e:
            return jsonify({"message": "Error processing the image", "error": str(e)}), 500

    except Exception as e:
        return jsonify({"message": "An error occurred", "error": str(e)}), 500

if __name__ == '__main__':
    app.run(debug=True, port=8080)