<template>
  <div
    class="min-h-screen flex flex-col items-center justify-center p-6 bg-gradient-to-b from-gray-950 via-gray-900 to-gray-950"
  >
    <h2 class="text-3xl font-bold mb-8 text-center text-white">Report an Item</h2>

    <!-- Back Button -->
    <div
      v-if="!submitted"
      class="w-full max-w-md sm:max-w-lg lg:max-w-xl flex justify-end mb-6"
    >
      <button
        @click="goBack"
        class="px-5 py-2.5 rounded-lg bg-gray-800 text-white text-sm font-medium hover:bg-gray-700 transition-all duration-200 shadow-lg hover:shadow-xl border border-gray-700"
      >
        ← Back
      </button>
    </div>

    <!-- Lost or Found Buttons -->
    <div
      v-if="step === 1 && !submitted && !reviewing"
      class="space-y-5 mb-6 w-full max-w-md sm:max-w-lg lg:max-w-xl"
    >
      <button
        @click="selectType('lost')"
        class="w-full py-5 rounded-xl bg-green-500 text-black font-semibold text-lg hover:bg-green-600 hover:scale-[1.02] transition-all duration-200 shadow-lg hover:shadow-2xl"
      >
        Report Lost Item
      </button>
      <button
        @click="selectType('found')"
        class="w-full py-5 rounded-xl bg-green-500 text-black font-semibold text-lg hover:bg-green-600 hover:scale-[1.02] transition-all duration-200 shadow-lg hover:shadow-2xl"
      >
        Report Found Item
      </button>
    </div>

    <!-- ID or General Buttons -->
    <div
      v-if="step === 2 && !submitted && !reviewing"
      class="space-y-5 mb-6 w-full max-w-md sm:max-w-lg lg:max-w-xl"
    >
      <button
        @click="selectCategory('id')"
        class="w-full py-5 rounded-xl bg-yellow-500 text-black font-semibold text-lg hover:bg-yellow-600 hover:scale-[1.02] transition-all duration-200 shadow-lg hover:shadow-2xl"
      >
        {{ reportType === "lost" ? "Lost ID" : "Found ID" }}
      </button>
      <button
        @click="selectCategory('general')"
        class="w-full py-5 rounded-xl bg-yellow-500 text-black font-semibold text-lg hover:bg-yellow-600 hover:scale-[1.02] transition-all duration-200 shadow-lg hover:shadow-2xl"
      >
        {{ reportType === "lost" ? "Lost General Item" : "Found General Item" }}
      </button>
    </div>

    <!-- ID Form -->
    <form
      v-if="step === 3 && itemCategory === 'id' && !reviewing && !submitted"
      @submit.prevent="prepareReview"
      class="bg-gray-800 p-8 rounded-2xl space-y-5 w-full max-w-md sm:max-w-lg lg:max-w-xl shadow-2xl border border-gray-700"
    >
      <h3 class="text-xl font-bold mb-4 text-white">
        {{ reportType === "lost" ? "Lost ID Report" : "Found ID Report" }}
      </h3>

      <div>
        <label class="block text-gray-300 text-sm font-medium mb-2">Upload Photo:</label>
        <input
          type="file"
          accept="image/*"
          capture="environment"
          @change="handleImage($event, 'id')"
          class="w-full text-sm text-gray-400 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-gray-700 file:text-white hover:file:bg-gray-600 file:cursor-pointer"
        />
        
        <!-- QR Detection Status Messages -->
        <div v-if="isExtractingQR" class="mt-2 text-blue-400 text-sm">
          🔍 Analyzing image for QR code...
        </div>
        <div v-else-if="qrDetected" class="mt-2 text-green-400 text-sm">
          ✅ QR code detected! Student ID auto-filled.
        </div>
        <div v-else-if="qrDetectionFailed" class="mt-2 text-yellow-400 text-sm">
          ⚠️ No QR code found. Please enter details manually.
        </div>
        
        <!-- Contextual Guidance -->
        <div v-if="reportType === 'lost'" class="mt-2 text-gray-400 text-xs">
          💡 You can upload a photo of your ID (if you have one saved) — but it’s optional. Description alone is enough.
        </div>
        <div v-if="reportType === 'found'" class="mt-2 text-yellow-400 text-xs">
          ⚠️ Please upload a clear photo of the ID you found — this helps verify authenticity.
        </div>
        
        <div v-if="idForm.preview" class="mt-4 space-y-3">
          <img
            :src="idForm.preview"
            alt="Preview"
            class="w-32 h-32 object-cover rounded-xl border-2 border-gray-600 shadow-lg"
          />
          <button
            type="button"
            @click="removeImage('id')"
            class="px-4 py-2 text-sm bg-red-500 text-white rounded-lg hover:bg-red-600 transition-all duration-200 font-medium shadow-md"
          >
            Remove Photo
          </button>
        </div>
      </div>

      <div>
        <label class="block text-gray-300 text-sm font-medium mb-2">Student Name:</label>
        <input 
          v-model="idForm.name" 
          type="text" 
          class="w-full px-4 py-3 bg-gray-900 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all duration-200" 
          required 
        />
      </div>

      <div>
        <label class="block text-gray-300 text-sm font-medium mb-2">Student ID (123-45678):</label>
        <input
          v-model="idForm.studentId"
          type="text"
          @input="formatStudentId"
          class="w-full px-4 py-3 bg-gray-900 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all duration-200"
          required
        />
      </div>

      <div>
        <label class="block text-gray-300 text-sm font-medium mb-2">Course / Program:</label>
        <input 
          v-model="idForm.course" 
          type="text" 
          class="w-full px-4 py-3 bg-gray-900 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all duration-200" 
          required 
        />
      </div>

      <div>
        <label class="block text-gray-300 text-sm font-medium mb-2">
          {{ reportType === "lost" ? "Date & Time Lost:" : "Date & Time Found:" }}
        </label>
        <input
          v-model="idForm.dateTime"
          type="datetime-local"
          class="w-full px-4 py-3 bg-gray-900 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all duration-200"
          required
        />
      </div>

      <div>
        <label class="block text-gray-300 text-sm font-medium mb-2">
          {{ reportType === "lost" ? "Location Lost:" : "Location Found:" }}
        </label>
        <input 
          v-model="idForm.location" 
          type="text" 
          class="w-full px-4 py-3 bg-gray-900 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all duration-200" 
          required 
        />
      </div>

      <div>
        <label class="block text-gray-300 text-sm font-medium mb-2">Description (optional):</label>
        <textarea 
          v-model="idForm.description" 
          rows="3"
          class="w-full px-4 py-3 bg-gray-900 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all duration-200 resize-none"
        ></textarea>
      </div>

      <button
        type="submit"
        class="w-full py-3.5 rounded-lg bg-yellow-500 text-black font-bold text-lg hover:bg-yellow-600 hover:scale-[1.02] transition-all duration-200 shadow-lg hover:shadow-xl mt-6"
      >
        Submit Report
      </button>
    </form>

    <!-- General Form -->
    <form
      v-if="step === 3 && itemCategory === 'general' && !reviewing && !submitted"
      @submit.prevent="prepareReview"
      class="bg-gray-800 p-8 rounded-2xl space-y-5 w-full max-w-md sm:max-w-lg lg:max-w-xl shadow-2xl border border-gray-700"
    >
      <h3 class="text-xl font-bold mb-4 text-white">
        {{ reportType === "lost" ? "Lost Item Report" : "Found Item Report" }}
      </h3>

      <div>
        <label class="block text-gray-300 text-sm font-medium mb-2">Upload Photo:</label>
        <input
          type="file"
          accept="image/*"
          capture="environment"
          @change="handleImage($event, 'general')"
          class="w-full text-sm text-gray-400 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-gray-700 file:text-white hover:file:bg-gray-600 file:cursor-pointer"
        />
        
        <!-- Contextual Guidance -->
        <div v-if="reportType === 'lost'" class="mt-2 text-gray-400 text-xs">
          💡 You can upload a photo of the item (if available) — but description alone is enough.
        </div>
        <div v-if="reportType === 'found'" class="mt-2 text-yellow-400 text-xs">
          ⚠️ A photo of the item you found is strongly recommended for verification.
        </div>
        
        <div v-if="generalForm.preview" class="mt-4 space-y-3">
          <img
            :src="generalForm.preview"
            alt="Preview"
            class="w-32 h-32 object-cover rounded-xl border-2 border-gray-600 shadow-lg"
          />
          <button
            type="button"
            @click="removeImage('general')"
            class="px-4 py-2 text-sm bg-red-500 text-white rounded-lg hover:bg-red-600 transition-all duration-200 font-medium shadow-md"
          >
            Remove Photo
          </button>
        </div>
        <!-- YOLO Analysis Status -->
        <div v-if="isAnalyzing" class="mt-2 text-yellow-400 text-sm">
          🔍 Analyzing image...
        </div>
        <div v-if="detectedObjects.length > 0" class="mt-2 p-3 bg-gray-700 rounded-lg">
          <p class="text-green-400 text-sm font-medium mb-2">Detected Objects:</p>
          <div class="flex flex-wrap gap-2">
            <span 
              v-for="obj in detectedObjects" 
              :key="obj.class_name"
              class="px-2 py-1 bg-green-600 text-white text-xs rounded-full"
            >
              {{ obj.class_name }} ({{ Math.round(obj.confidence * 100) }}%)
            </span>
          </div>
        </div>
      </div>

      <div>
        <label class="block text-gray-300 text-sm font-medium mb-2">Item Name:</label>
        <input
          v-model="generalForm.name"
          type="text"
          class="w-full px-4 py-3 bg-gray-900 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all duration-200"
          @input="filterSuggestions"
          list="item-suggestions"
          required
        />
        <datalist id="item-suggestions">
          <option v-for="item in filteredSuggestions" :key="item" :value="item" />
        </datalist>
      </div>

      <div>
        <label class="block text-gray-300 text-sm font-medium mb-2">Brand (optional):</label>
        <input 
          v-model="generalForm.brand" 
          type="text" 
          class="w-full px-4 py-3 bg-gray-900 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all duration-200" 
        />
      </div>

      <div>
        <label class="block text-gray-300 text-sm font-medium mb-2">Color:</label>
        <input 
          v-model="generalForm.color" 
          type="text" 
          class="w-full px-4 py-3 bg-gray-900 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all duration-200" 
        />
      </div>

      <div v-if="showSmartphoneCover">
        <label class="block text-gray-300 text-sm font-medium mb-2">
          Does the smartphone have a cover?
        </label>
        <select 
          v-model="generalForm.cover" 
          class="w-full px-4 py-3 bg-gray-900 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all duration-200"
        >
          <option value="">Select</option>
          <option value="No Cover">No Cover</option>
          <option value="Color: Black">Black</option>
          <option value="Color: White">White</option>
          <option value="Color: Red">Red</option>
          <option value="Color: Blue">Blue</option>
          <option value="Other">Other</option>
        </select>
      </div>

      <div>
        <label class="block text-gray-300 text-sm font-medium mb-2">
          {{ reportType === "lost" ? "Date & Time Lost:" : "Date & Time Found:" }}
        </label>
        <input
          v-model="generalForm.dateTime"
          type="datetime-local"
          class="w-full px-4 py-3 bg-gray-900 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all duration-200"
          required
        />
      </div>

      <div>
        <label class="block text-gray-300 text-sm font-medium mb-2">
          {{ reportType === "lost" ? "Location Lost:" : "Location Found:" }}
        </label>
        <input 
          v-model="generalForm.location" 
          type="text" 
          class="w-full px-4 py-3 bg-gray-900 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all duration-200" 
          required 
        />
      </div>

      <div>
        <label class="block text-gray-300 text-sm font-medium mb-2">Description (optional):</label>
        <textarea 
          v-model="generalForm.description" 
          rows="3"
          class="w-full px-4 py-3 bg-gray-900 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all duration-200 resize-none"
        ></textarea>
      </div>

      <button
        type="submit"
        class="w-full py-3.5 rounded-lg bg-yellow-500 text-black font-bold text-lg hover:bg-yellow-600 hover:scale-[1.02] transition-all duration-200 shadow-lg hover:shadow-xl mt-6"
      >
        Submit Report
      </button>
    </form>

    <!-- Review Step -->
    <div
      v-if="reviewing && !submitted"
      class="bg-gray-800 p-8 rounded-2xl w-full max-w-md sm:max-w-lg lg:max-w-xl shadow-2xl border border-gray-700"
    >
      <h3 class="text-2xl font-bold text-yellow-400 mb-6 text-center">
        Review Your Report
      </h3>
      <div
        class="bg-gray-900 p-6 rounded-xl space-y-4 text-left max-h-[500px] overflow-auto border border-gray-700"
      >
        <div v-if="reviewData.preview" class="flex justify-center mb-4">
          <img
            :src="reviewData.preview"
            alt="Item Preview"
            class="w-48 h-48 object-cover rounded-xl border-2 border-gray-600 shadow-lg"
          />
        </div>
        <div class="space-y-3">
          <div class="flex justify-between py-2 border-b border-gray-700">
            <span class="text-gray-400 font-medium">Type:</span>
            <span class="text-white font-semibold capitalize">{{ reviewData.type }}</span>
          </div>
          <div class="flex justify-between py-2 border-b border-gray-700">
            <span class="text-gray-400 font-medium">Category:</span>
            <span class="text-white font-semibold">{{ reviewData.category }}</span>
          </div>
          <div class="flex justify-between py-2 border-b border-gray-700">
            <span class="text-gray-400 font-medium">Name:</span>
            <span class="text-white font-semibold">{{ reviewData.name }}</span>
          </div>
          <div v-if="reviewData.studentId" class="flex justify-between py-2 border-b border-gray-700">
            <span class="text-gray-400 font-medium">Student ID:</span>
            <span class="text-white font-semibold">{{ reviewData.studentId }}</span>
          </div>
          <div v-if="reviewData.course" class="flex justify-between py-2 border-b border-gray-700">
            <span class="text-gray-400 font-medium">Course/Program:</span>
            <span class="text-white font-semibold">{{ reviewData.course }}</span>
          </div>
          <div v-if="reviewData.brand" class="flex justify-between py-2 border-b border-gray-700">
            <span class="text-gray-400 font-medium">Brand:</span>
            <span class="text-white font-semibold">{{ reviewData.brand }}</span>
          </div>
          <div v-if="reviewData.color" class="flex justify-between py-2 border-b border-gray-700">
            <span class="text-gray-400 font-medium">Color:</span>
            <span class="text-white font-semibold">{{ reviewData.color }}</span>
          </div>
          <div v-if="reviewData.cover" class="flex justify-between py-2 border-b border-gray-700">
            <span class="text-gray-400 font-medium">Cover:</span>
            <span class="text-white font-semibold">{{ reviewData.cover }}</span>
          </div>
          <div class="flex justify-between py-2 border-b border-gray-700">
            <span class="text-gray-400 font-medium">Date & Time:</span>
            <span class="text-white font-semibold">{{ formatDateTime(reviewData.dateTime) }}</span>
          </div>
          <div class="flex justify-between py-2 border-b border-gray-700">
            <span class="text-gray-400 font-medium">Location:</span>
            <span class="text-white font-semibold">{{ reviewData.location }}</span>
          </div>
          <div v-if="reviewData.description" class="py-2">
            <span class="text-gray-400 font-medium block mb-2">Description:</span>
            <span class="text-white">{{ reviewData.description }}</span>
          </div>
        </div>
      </div>
      <div class="mt-8 flex justify-center gap-4">
        <button
          @click="confirmSubmit"
          class="px-8 py-3 rounded-lg bg-green-500 text-black font-bold hover:bg-green-600 hover:scale-[1.02] transition-all duration-200 shadow-lg hover:shadow-xl"
        >
          Confirm
        </button>
        <button
          @click="editReport"
          class="px-8 py-3 rounded-lg bg-red-500 text-black font-bold hover:bg-red-600 hover:scale-[1.02] transition-all duration-200 shadow-lg hover:shadow-xl"
        >
          Edit
        </button>
      </div>
    </div>

    <!-- Success -->
    <div
      v-if="submitted"
      class="bg-gray-800 p-8 rounded-2xl text-center w-full max-w-md sm:max-w-lg lg:max-w-xl shadow-2xl border border-gray-700"
    >
      <h3 class="text-2xl font-bold text-green-400 mb-4">Report Submitted!</h3>
      <p class="text-gray-300 mb-6">Your report has been successfully submitted.</p>
      <button
        @click="resetForm"
        class="px-6 py-3 rounded-lg bg-yellow-500 text-black font-bold hover:bg-yellow-600 hover:scale-[1.02] transition-all duration-200 shadow-lg hover:shadow-xl"
      >
        File Another Report
      </button>
    </div>
  </div>
</template>

<script setup>
import { reactive, ref, computed, onMounted, watch } from "vue";
import { useRouter } from "vue-router";
import jsQR from 'jsqr';

const router = useRouter();

// Core report state (will be auto-saved)
const step = ref(1);
const reportType = ref("");
const itemCategory = ref("");
const reviewing = ref(false);
const submitted = ref(false);
const reporterId = ref(null);

// Transient states (NOT saved to localStorage)
const isExtractingQR = ref(false);
const qrDetected = ref(false);
const qrDetectionFailed = ref(false);
const isAnalyzing = ref(false);
const detectedObjects = ref([]);

const yoloApiUrl = "http://localhost:8000";
const backendUrl = "http://localhost:5000/api";

const idForm = reactive({
  name: "",
  studentId: "",
  course: "",
  dateTime: "",
  location: "",
  description: "",
  file: null,
  preview: null,
});

const generalForm = reactive({
  name: "",
  brand: "",
  color: "",
  cover: "",
  dateTime: "",
  location: "",
  description: "",
  file: null,
  preview: null,
});

const reviewData = reactive({});
const suggestions = ["Phone", "Wallet", "Keys", "ID", "Bag", "Laptop", "Charger", "Earphones"];
const filteredSuggestions = ref([]);

// ✅ Automatically save progress (only core state)
const saveProgress = () => {
  localStorage.setItem(
    "report-progress",
    JSON.stringify({
      step: step.value,
      reportType: reportType.value,
      itemCategory: itemCategory.value,
      reviewing: reviewing.value,
      submitted: submitted.value,
    })
  );
};

// 🔄 Watch for changes and save automatically
watch([step, reportType, itemCategory, reviewing, submitted], saveProgress);

// 🚀 Restore progress on page load
onMounted(() => {
  const user = JSON.parse(localStorage.getItem("user"));
  if (user?.id) {
    reporterId.value = user.id;
  } else {
    console.warn("⚠️ No authenticated user found. Redirecting to login...");
    router.push("/login");
  }

  const savedProgress = JSON.parse(localStorage.getItem("report-progress"));
  if (savedProgress) {
    step.value = savedProgress.step || 1;
    reportType.value = savedProgress.reportType || "";
    itemCategory.value = savedProgress.itemCategory || "";
    reviewing.value = savedProgress.reviewing || false;
    submitted.value = savedProgress.submitted || false;
  }
});

// 🧼 Optional: clear saved progress when done
const clearProgress = () => {
  localStorage.removeItem("report-progress");
};

// Existing logic below remains unchanged

const selectType = (type) => {
  reportType.value = type;
  step.value = 2;
};

const selectCategory = (category) => {
  itemCategory.value = category;
  step.value = 3;
};

const handleImage = async (event, formType) => {
  const file = event.target.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = async (e) => {
    const imageDataUrl = e.target.result;
    
    if (formType === "id") {
      qrDetected.value = false;
      qrDetectionFailed.value = false;
      idForm.preview = imageDataUrl;
      idForm.file = file;
      await extractQRFromImage(imageDataUrl);
    } else {
      generalForm.preview = imageDataUrl;
      generalForm.file = file;
      await analyzeImageWithYOLO(file);
    }
  };
  reader.readAsDataURL(file);
};

// ✅ Enhanced QR extraction with detailed logging
const extractQRFromImage = async (imageDataUrl) => {
  isExtractingQR.value = true;
  qrDetected.value = false;
  qrDetectionFailed.value = false;
  
  try {
    const img = new Image();
    img.src = imageDataUrl;
    
    await new Promise(resolve => {
      img.onload = resolve;
      img.onerror = () => resolve();
    });
    
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    canvas.width = img.width;
    canvas.height = img.height;
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
    
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const qrCode = jsQR(imageData.data, imageData.width, imageData.height);
    
    if (qrCode && qrCode.data) {
      console.log("📷 QR code detected! Raw data:", qrCode.data);

      const studentId = extractStudentIdFromQR(qrCode.data);
      if (studentId) {
        idForm.studentId = studentId;
        qrDetected.value = true;
        console.log("✅ Student ID match found:", studentId);
      } else {
        qrDetectionFailed.value = true;
        console.warn("⚠️ QR detected but no valid student ID pattern matched.");
      }
    } else {
      qrDetectionFailed.value = true;
      console.warn("❌ No QR code found in the image.");
    }
  } catch (error) {
    console.error('🚨 Error extracting QR from image:', error);
    qrDetectionFailed.value = true;
  } finally {
    isExtractingQR.value = false;
  }
};

// ✅ Enhanced student ID extraction with logging
const extractStudentIdFromQR = (qrText) => {
  console.log("🔍 Extracting student ID from QR text:", qrText);
  
  const patterns = [
    /(\d{3}-\d{5})/,
    /CSU[-\s]?(\d{3}-\d{5})/i,
    /ID[:\s]?(\d{3}-\d{5})/i,
    /Student[:\s]?(\d{3}-\d{5})/i,
    /(\d{8})/,
  ];
  
  for (const pattern of patterns) {
    const match = qrText.match(pattern);
    if (match) {
      console.log("🧩 Pattern matched:", pattern, "→", match[1]);
      let studentId = match[1];
      if (studentId.length === 8 && !studentId.includes('-')) {
        studentId = `${studentId.substring(0, 3)}-${studentId.substring(3)}`;
      }
      return studentId;
    }
  }
  
  console.warn("🚫 No student ID pattern matched from QR text.");
  return null;
};

const analyzeImageWithYOLO = async (file) => {
  isAnalyzing.value = true;
  detectedObjects.value = [];

  try {
    const formData = new FormData();
    formData.append("file", file);

    const response = await fetch(`${yoloApiUrl}/detect/`, {
      method: "POST",
      body: formData,
    });

    if (!response.ok) throw new Error("YOLO API error");

    const result = await response.json();
    detectedObjects.value = result.detections || [];

    if (detectedObjects.value.length > 0) {
      const topObject = detectedObjects.value.reduce((prev, curr) =>
        curr.confidence > prev.confidence ? curr : prev
      );
      generalForm.name = topObject.class_name || "";
      detectedObjects.value = [topObject];
    }
  } catch (error) {
    console.error("❌ Error analyzing image with YOLO:", error);
  } finally {
    isAnalyzing.value = false;
  }
};

const removeImage = (formType) => {
  if (formType === "id") {
    idForm.preview = null;
    idForm.file = null;
    qrDetected.value = false;
    qrDetectionFailed.value = false;
    isExtractingQR.value = false;
  } else {
    generalForm.preview = null;
    generalForm.file = null;
    detectedObjects.value = [];
  }
};

const prepareReview = () => {
  reviewing.value = true;
  if (itemCategory.value === "id") {
    Object.assign(reviewData, { type: reportType.value, category: "ID", ...idForm });
  } else {
    Object.assign(reviewData, { type: reportType.value, category: "General", ...generalForm });
  }
};

const confirmSubmit = async () => {
  try {
    const formData = new FormData();
    const data = itemCategory.value === "id" ? idForm : generalForm;

    formData.append("type", reportType.value);
    formData.append("category", itemCategory.value);
    formData.append("name", data.name || "");
    formData.append("student_id", data.studentId || "");
    formData.append("course", data.course || "");
    formData.append("brand", data.brand || "");
    formData.append("color", data.color || "");
    formData.append("datetime", data.dateTime || "");
    formData.append("location", data.location || "");
    formData.append("description", data.description || "");
    formData.append("cover", data.cover || "");
    formData.append("reporter_id", reporterId.value);
    if (data.file) formData.append("photo", data.file);

    const response = await fetch(`${backendUrl}/report`, {
      method: "POST",
      body: formData,
    });

    if (!response.ok) throw new Error("Failed to submit report");

    submitted.value = true;
    reviewing.value = false;
    clearProgress(); // ✅ Clear after successful submit
  } catch (err) {
    console.error("❌ Error submitting report:", err);
    alert("Failed to submit report. Please try again.");
  }
};

const editReport = () => {
  reviewing.value = false;
};

const resetForm = () => {
  step.value = 1;
  reportType.value = "";
  itemCategory.value = "";
  reviewing.value = false;
  submitted.value = false;
  qrDetected.value = false;
  qrDetectionFailed.value = false;
  isExtractingQR.value = false;
  Object.keys(idForm).forEach((k) => (idForm[k] = k === "preview" || k === "file" ? null : ""));
  Object.keys(generalForm).forEach((k) => (generalForm[k] = k === "preview" || k === "file" ? null : ""));
  clearProgress(); // ✅ Clear on reset
};

const goBack = () => {
  if (step.value === 1) router.push("/userdashboard");
  else if (step.value === 2) step.value = 1;
  else if (step.value === 3) step.value = 2;
};

const formatStudentId = () => {
  let value = idForm.studentId.replace(/[^0-9]/g, "");
  if (value.length >= 4) {
    value = `${value.slice(0, 3)}-${value.slice(3, 8)}`;
  }
  idForm.studentId = value;
};

const filterSuggestions = () => {
  const term = generalForm.name.toLowerCase();
  filteredSuggestions.value = suggestions.filter((s) => s.toLowerCase().includes(term));
};

const formatDateTime = (dt) => {
  return new Date(dt).toLocaleString();
};

const showSmartphoneCover = computed(() => {
  return generalForm.name.toLowerCase().includes("phone") || generalForm.name.toLowerCase().includes("smartphone");
});
</script>