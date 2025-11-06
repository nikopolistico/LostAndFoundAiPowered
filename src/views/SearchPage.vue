<template>
  <div
    class="relative min-h-screen overflow-y-auto bg-gray-950 flex flex-col items-center pb-24 pt-20"
  >
    <!-- ✅ Top-Right Profile & Notification -->
    <div class="absolute top-6 right-6 flex items-center space-x-4">
      <!-- 🔔 Notifications -->
      <div class="relative">
        <button
          @click="toggleNotifications"
          class="relative w-12 h-12 rounded-full bg-yellow-400 flex items-center justify-center shadow-lg hover:bg-yellow-500 transition"
          title="Notifications"
        >
          <svg
            class="w-6 h-6 text-black"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            viewBox="0 0 24 24"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
            />
          </svg>

          <span
            v-if="unreadNotificationCount > 0"
            class="absolute top-1 right-1 bg-red-600 text-white text-xs rounded-full px-2 py-0.5 font-bold"
          >
            {{ unreadNotificationCount }}
          </span>
        </button>

        <!-- Notifications Dropdown -->
        <div
          v-if="showNotifications"
          class="absolute right-0 mt-2 w-80 bg-yellow-100 rounded-xl shadow-lg z-50"
        >
          <div class="p-4 border-b border-yellow-300">
            <h2 class="text-lg font-semibold text-yellow-900 mb-2">
              Notifications
            </h2>
          </div>
          <ul v-if="notifications.length > 0">
            <li
              v-for="notif in notifications"
              :key="notif.id"
              class="text-yellow-900 py-3 px-4 border-b border-yellow-300"
            >
              <p class="font-medium mb-1">{{ notif.message }}</p>
            </li>
          </ul>
          <div v-else class="p-4 text-yellow-900 text-center">
            No new notifications.
          </div>
        </div>
      </div>

      <!-- 👤 Profile -->
      <div class="relative">
        <button
          @click="showProfileMenu = !showProfileMenu"
          class="w-12 h-12 rounded-full bg-blue-600 flex items-center justify-center shadow-lg hover:bg-blue-700 transition overflow-hidden border-2 border-yellow-400"
          title="Profile"
        >
          <template v-if="user && user.profile_picture">
            <img
              :src="user.profile_picture"
              alt="Profile"
              class="w-full h-full object-cover rounded-full"
            />
          </template>
          <template v-else>
            <span class="text-white text-xl font-bold">
              {{ profileInitial }}
            </span>
          </template>
        </button>

        <div
          v-if="showProfileMenu"
          class="absolute right-0 mt-2 w-48 bg-white rounded-xl shadow-lg z-50"
        >
          <ul>
            <li>
              <button
                @click="goToProfile"
                class="w-full text-left px-4 py-2 hover:bg-blue-100 flex items-center space-x-2"
              >
                <span>Go to Profile</span>
              </button>
            </li>
            <li>
              <button
                @click="logout"
                class="w-full text-left px-4 py-2 hover:bg-blue-100 text-red-600"
              >
                Logout
              </button>
            </li>
          </ul>
        </div>
      </div>
    </div>

    <!-- 🟡 Page Title -->
    <h1 class="text-3xl font-semibold mb-10 mt-16 text-yellow-400">
      Search Found Items in Security Custody
    </h1>

    <!-- Step 1: Choose Category -->
    <div v-if="step === 1" class="flex flex-col gap-4 w-full max-w-sm text-center">
      <h2 class="text-xl text-white font-semibold mb-3">
        What type of item did you lose?
      </h2>
      <button
        @click="selectCategory('id')"
        class="py-3 rounded-xl bg-green-500 text-white font-semibold hover:bg-green-600 transition"
      >
        Student ID
      </button>
      <button
        @click="selectCategory('general')"
        class="py-3 rounded-xl bg-purple-500 text-white font-semibold hover:bg-purple-600 transition"
      >
        General Item
      </button>
    </div>

    <!-- Step 2: Choose Search Method -->
    <div
      v-if="step === 2"
      class="flex flex-col items-center text-center mt-6 w-full max-w-md bg-gray-900 p-6 rounded-2xl shadow-lg"
    >
      <h2 class="text-xl text-yellow-400 font-semibold mb-3">
        How do you want to search your {{ category === 'id' ? 'Student ID' : 'general' }}?
      </h2>

      <button
        @click="selectMethod('image')"
        class="py-3 rounded-xl bg-blue-500 text-white font-semibold hover:bg-blue-600 transition mb-3 w-full"
      >
        Upload Image
      </button>

      <button
        @click="selectMethod('manual')"
        class="py-3 rounded-xl bg-green-500 text-white font-semibold hover:bg-green-600 transition w-full"
      >
        Enter {{ category === 'id' ? 'Student ID' : 'Item Name' }}
      </button>

      <button
        class="mt-3 text-gray-400 text-sm underline hover:text-gray-300"
        @click="step = 1"
      >
        ← Back
      </button>
    </div>

    <!-- Step 3A: Upload Image for General Items (AI-assisted) -->
    <div
      v-if="step === 3 && searchMethod === 'image' && category === 'general'"
      class="w-full max-w-4xl mt-6 bg-gray-900 p-6 rounded-2xl shadow-lg"
    >
      <div class="text-left mb-4">
        <h2 class="text-xl font-semibold text-yellow-400">Lost and Found Objects using AI</h2>
        <p class="text-sm text-gray-300">Upload an image to detect objects. Left: your upload preview. Right: prediction result.</p>
      </div>

      <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
        <!-- Left column: Preview + Upload -->
        <div class="flex flex-col">
          <div class="w-full h-64 bg-white/80 border border-gray-300 rounded-lg overflow-hidden flex items-center justify-center">
            <template v-if="previewImageCurrent">
              <img :src="previewImageCurrent" alt="Preview" class="object-contain w-full h-full" />
            </template>
            <template v-else>
              <div class="text-gray-500">Preview will appear here</div>
            </template>
          </div>

          <form @submit.prevent="submitForm" enctype="multipart/form-data" class="mt-4 w-full flex flex-col gap-3">
            <input
              type="file"
              @change="handleImageUpload"
              id="file"
              class="block w-full text-sm text-gray-200 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:bg-yellow-400 file:text-black hover:file:bg-yellow-500"
            />

            <button
              type="submit"
              :disabled="!hasSelectedFile"
              :class="hasSelectedFile ? 'bg-yellow-500 hover:bg-yellow-600 text-black' : 'bg-gray-700 text-gray-400 cursor-not-allowed'"
              class="py-2 px-4 rounded-lg font-semibold"
            >
              Start Prediction
            </button>
          </form>
        </div>

        <!-- Right column: Predicted image + classes -->
        <div class="flex flex-col">
          <div class="w-full h-64 bg-white/80 border border-gray-300 rounded-lg overflow-hidden flex items-center justify-center">
            <template v-if="predictedImage">
              <img :src="'data:image/jpeg;base64,' + predictedImage" alt="Prediction Result" class="object-contain w-full h-full" />
            </template>
            <template v-else>
              <div class="text-gray-500">Prediction result will appear here</div>
            </template>
          </div>

          <div v-if="classNames" class="mt-4 bg-white/90 p-3 rounded-lg">
            <h4 class="font-semibold text-gray-800">Detected Object:</h4>
            <div class="mt-2 text-gray-700">
              <span class="font-medium">{{ classNames }}</span>
              <span v-if="detectedConfidence !== null" class="text-sm text-gray-500"> — {{ detectedConfidence }}</span>
            </div>
          </div>

          <div v-if="errorMessage" class="mt-4 text-red-400">{{ errorMessage }}</div>
        </div>
      </div>
      <button
        class="mt-3 text-gray-400 text-sm underline hover:text-gray-300"
        @click="step = 2"
      >
        ← Back
      </button>
    </div>

    <!-- Step 3B: Upload Student ID Image (QR scan) -->
    <div
      v-if="step === 3 && searchMethod === 'image' && category === 'id'"
      class="w-full max-w-3xl mt-6 bg-gray-900 p-6 rounded-2xl shadow-lg"
    >
      <div class="text-left mb-4">
        <h2 class="text-xl font-semibold text-green-400">Scan Student ID QR</h2>
        <p class="text-sm text-gray-300">Upload a clear photo of the ID. We will read the QR code to fill the student number, then you can search for matches.</p>
      </div>

      <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
        <!-- ID Preview + Upload -->
        <div class="flex flex-col">
          <div class="w-full h-64 bg-white/80 border border-gray-300 rounded-lg overflow-hidden flex items-center justify-center">
            <template v-if="previewImageCurrent">
              <img :src="previewImageCurrent" alt="ID Preview" class="object-contain w-full h-full" />
            </template>
            <template v-else>
              <div class="text-gray-500">ID preview will appear here</div>
            </template>
          </div>

          <div class="mt-4 w-full flex flex-col gap-3">
            <input
              type="file"
              accept="image/*"
              @change="handleImageUpload"
              class="block w-full text-sm text-gray-200 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:bg-yellow-400 file:text-black hover:file:bg-yellow-500"
            />

            <button
              type="button"
              @click="resetIdUpload"
              class="py-2 px-4 rounded-lg font-semibold bg-gray-800 text-gray-300 hover:bg-gray-700 transition"
              v-if="selectedFileId"
            >
              Clear Image
            </button>
          </div>
        </div>

        <!-- QR status + extracted ID -->
        <div class="flex flex-col">
          <div class="bg-white/90 p-3 rounded-lg space-y-2">
            <h4 class="font-semibold text-gray-800">QR Scan Status</h4>
            <p v-if="isExtractingQR" class="text-blue-600 text-sm flex items-center gap-2">
              <span>🔍</span><span>Analyzing image for QR code…</span>
            </p>
            <p v-else-if="qrDetected" class="text-green-600 text-sm flex items-center gap-2">
              <span>✅</span><span>QR code detected! Student ID auto-filled below.</span>
            </p>
            <p v-else-if="qrDetectionFailed" class="text-yellow-600 text-sm flex items-center gap-2">
              <span>⚠️</span><span>No QR code found. Try another angle or clearer photo.</span>
            </p>
            <p v-if="qrErrorMessage" class="text-red-500 text-sm">{{ qrErrorMessage }}</p>
            <p v-if="!isExtractingQR && !qrDetected && !qrDetectionFailed && !qrErrorMessage" class="text-gray-600 text-sm">
              Upload an image to start scanning.
            </p>
          </div>

          <div class="mt-4 text-left">
            <label class="block text-sm text-gray-300 mb-2">Detected Student ID</label>
            <input
              v-model="studentId"
              @input="formatStudentId"
              placeholder="Auto-filled after QR scan"
              class="w-full bg-gray-800 border border-gray-700 p-3 rounded-lg text-gray-300 outline-none focus:ring-2 focus:ring-green-500"
            />
            <p v-if="studentId && !isValidStudentId" class="text-red-500 text-sm mt-2">
              ❌ Invalid format. Use 3 digits + dash + 5 digits.
            </p>
          </div>

          <button
            type="button"
            :disabled="isExtractingQR || !studentId || !isValidStudentId"
            @click="performSearch"
            class="mt-4 py-2 px-4 rounded-lg font-semibold transition"
            :class="(isExtractingQR || !studentId || !isValidStudentId)
              ? 'bg-gray-700 text-gray-500 cursor-not-allowed'
              : 'bg-yellow-500 hover:bg-yellow-600 text-black'"
          >
            Search Using Student ID
          </button>
        </div>
      </div>

      <button
        class="mt-3 text-gray-400 text-sm underline hover:text-gray-300"
        @click="step = 2"
      >
        ← Back
      </button>
    </div>

    

    <!-- Step 3C: Manual Input -->
    <div
      v-if="step === 3 && searchMethod === 'manual'"
      class="flex flex-col items-center text-center mt-6 w-full max-w-md bg-gray-900 p-6 rounded-2xl shadow-lg"
    >
      <h2
        class="text-xl font-semibold mb-3"
        :class="category === 'id' ? 'text-green-400' : 'text-purple-400'"
      >
        Enter {{ category === 'id' ? 'Student ID' : 'Item Name' }}
      </h2>

      <!-- Student ID Input -->
      <div v-if="category === 'id'" class="w-full mb-6">
        <input
          v-model="studentId"
          @input="formatStudentId"
          placeholder="e.g. 221-01878"
          class="w-full bg-gray-800 border border-gray-700 p-3 rounded-lg text-gray-300 outline-none focus:ring-2 focus:ring-yellow-500"
        />
        <p v-if="studentId && !isValidStudentId" class="text-red-500 text-sm mt-2">
          ❌ Invalid format. Use 3 digits + dash + 5 digits.
        </p>
      </div>

      <!-- Item Name Input with Suggestions -->
      <div v-if="category === 'general'" class="w-full mb-6 relative">
        <input
          v-model="itemName"
          @input="filterSuggestions"
          @focus="showSuggestions = true"
          @blur="hideSuggestions"
          placeholder="e.g. Black Umbrella"
          class="w-full bg-gray-800 border border-gray-700 p-3 rounded-lg text-gray-300 outline-none focus:ring-2 focus:ring-purple-500"
        />
        <ul
          v-if="showSuggestions && filteredSuggestions && filteredSuggestions.length"
          class="absolute z-50 mt-1 w-full bg-gray-900 border border-gray-700 rounded-lg shadow-lg text-gray-300 max-h-48 overflow-y-auto"
        >
          <li
            v-for="(suggestion, index) in filteredSuggestions"
            :key="index"
            @mousedown.prevent="selectSuggestion(suggestion)"
            class="px-4 py-2 cursor-pointer hover:bg-yellow-500 hover:text-black transition"
          >
            {{ suggestion }}
          </li>
        </ul>
      </div>

      <button
        :disabled="(category === 'id' && !isValidStudentId) || (category === 'general' && !itemName)"
        @click="performSearch"
        class="w-full py-3 rounded-xl font-semibold transition"
        :class="((category === 'id' && !isValidStudentId) || (category === 'general' && !itemName))
          ? 'bg-gray-700 text-gray-500 cursor-not-allowed'
          : 'bg-yellow-500 hover:bg-yellow-600 text-black'"
      >
        Start Search
      </button>

      <button
        class="mt-3 text-gray-400 text-sm underline hover:text-gray-300"
        @click="step = 2"
      >
        ← Back
      </button>
    </div>

    <!-- Step 4: Results -->
    <div v-if="step === 4" class="mt-10 w-full max-w-4xl text-center">
      <h2 class="text-2xl text-yellow-400 font-semibold mb-6">Search Results</h2>

      <div v-if="loading" class="text-gray-400 italic">Searching...</div>

      <div
        v-if="!loading && results.length > 0"
        class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6"
      >
        <div
          v-for="(item, index) in results"
          :key="index"
          class="bg-gray-900 p-4 rounded-xl shadow-lg"
        >
          <img
            :src="formatImageUrl(item.image_url)"
            alt="Found Item"
            class="w-full h-48 object-cover rounded-lg mb-3"
          />
          <h3 class="text-lg font-semibold text-white">{{ item.name }}</h3>
          <p class="text-gray-400">{{ item.category }}</p>
          <p class="text-gray-400">Location: {{ item.location }}</p>
          <p v-if="item.student_id" class="text-yellow-400">
            Tagged Student ID: {{ item.student_id }}
          </p>
        </div>
      </div>

      <p v-else-if="!loading" class="text-gray-400">{{ noResultsMessage }}</p>

      <button
        class="mt-6 py-3 px-6 rounded-xl bg-blue-500 text-white font-semibold hover:bg-blue-600 transition"
        @click="resetSearch"
      >
        New Search
      </button>
    </div>
  </div>
</template>

<script>
import axios from "axios";
import jsQR from "jsqr";

export default {
  name: "SearchPage",
  data() {
    return {
      predictedImage: null, // Holds the base64 image returned by Flask
      errorMessage: '', // Holds any error message
      classNames: '', // Holds the single classname string returned by Flask (top detection)
      detectedConfidence: null, // Confidence value for the returned classname
      step: 1,
      category: null,
      searchMethod: null,
      selectedFile: null,  // Holds the selected file
    // Separate storage for ID vs General uploads
    selectedFileId: null,
    selectedFileGeneral: null,
    previewImageId: null,
    previewImageGeneral: null,
    previewImage: null,
      studentId: "",
      itemName: "",
      results: [],
      loading: false,
      showNotifications: false,
      showProfileMenu: false,
      notifications: [],
      user: null,
      reporterId: null,
      sourceItemId: null,
      showSuggestions: false,
      filteredSuggestions: [],
      itemSuggestions: [
        "Airpods", "Backpack", "Cap", "Eyeglasses", "Flash Drive", "Handbag",
        "Handheld Mini Fan", "Headphone", "Helmet", "Laptop", "Laptop Briefcase",
        "Laptop Charger", "Motorcycle keys", "Phone Charger", "Powerbank",
        "Scientific Calculator", "Sling bag", "Smart Watch", "Smartphone",
        "Sunglasses", "T-square Ruler", "Tablet", "Tote bag", "Tumbler",
        "Umbrella", "Wallet", "Watch"
      ],
      isExtractingQR: false,
      qrDetected: false,
      qrDetectionFailed: false,
      qrErrorMessage: "",
    };
  },
  computed: {
    unreadNotificationCount() {
      return this.notifications.filter((n) => !n.is_read).length;
    },
    profileInitial() {
      return this.user?.full_name?.[0]?.toUpperCase() || "U";
    },
    isValidStudentId() {
      return /^\d{3}-\d{5}$/.test(this.studentId);
    },
    noResultsMessage() {
      // Show a helpful message depending on what the user searched for
      if (this.category === 'id') {
        return 'Student ID not found in security custody yet.';
      }

      if (this.category === 'general') {
        return 'This object is not found yet.';
      }

      return 'No matching items found.';
    },
    // Shows the preview image for the currently active category
    previewImageCurrent() {
      if (this.category === 'id') return this.previewImageId || null;
      if (this.category === 'general') return this.previewImageGeneral || null;
      return this.previewImage;
    },
    // Whether a file is selected for the active category
    hasSelectedFile() {
      if (this.category === 'id') return !!this.selectedFileId;
      if (this.category === 'general') return !!this.selectedFileGeneral;
      return !!this.selectedFile;
    },
  },
  methods: {
    // Small helper to retry fetch requests for a short period while backend starts
    async fetchWithRetry(url, options = {}, retries = 6, delayMs = 500) {
      for (let i = 0; i < retries; i++) {
        try {
          const res = await fetch(url, options);
          return res;
        } catch (err) {
          // Only retry on network errors (connection refused). If last try, rethrow.
          if (i === retries - 1) throw err;
          // Wait and retry
          await new Promise((r) => setTimeout(r, delayMs));
          delayMs *= 1.5;
        }
      }
    },

    // Resolve image URLs stored in DB to full backend URLs when needed
    formatImageUrl(url) {
      if (!url) return "";
      // If already absolute or a data URI, return as-is
      if (/^(https?:)?\/\//.test(url) || url.startsWith("data:")) return url;

      // Ensure the path starts with a single '/'
      const normalized = url.startsWith("/") ? url : "/" + url;

      // Backend base (matches other files in the project)
      const API_BASE = "http://localhost:5000";

      return `${API_BASE}${normalized}`;
    },

    // Handle form submission
    async submitForm() {
      if (this.category !== 'general') {
        return;
      }
      const fileToUpload = this.selectedFileGeneral;

      if (!fileToUpload) {
        this.errorMessage = 'Please select an image for upload before starting prediction.';
        return;
      }

      const formData = new FormData();
      formData.append('file', fileToUpload); // Append the selected file
      // include category so backend can differentiate if needed
      formData.append('category', this.category || 'general');

      try {
        const response = await this.fetchWithRetry('http://localhost:8080/predict_yolo', {
          method: 'POST',
          body: formData,
        });

        // If the response is not JSON or not OK, try to show useful message
        let result = null;
        try {
          result = await response.json();
        } catch (e) {
          // Non-JSON response
          result = null;
        }

        if (response.ok) {
          this.predictedImage = result?.image || null;
          // Backend now returns detections as array of objects [{classname, confidence}, ...]
          if (result?.detections && result.detections.length > 0) {
            const top = result.detections[0];
            // Support both {classname} or legacy {name} or simple string
            this.classNames = top.classname || top.name || (typeof top === 'string' ? top : '');
            this.detectedConfidence = top.confidence ?? null;
          } else {
            this.classNames = '';
            this.detectedConfidence = null;
          }
          this.errorMessage = '';
          // If category is general, set detected class as itemName so user can search by it
          if (this.category === 'general' && this.classNames) {
            this.itemName = this.classNames;
            // Automatically perform search using the predicted class
            try {
              // small delay to allow UI to update (optional)
              await new Promise((r) => setTimeout(r, 200));
              await this.performSearch();
            } catch (e) {
              console.error('Auto-search after prediction failed:', e);
            }
          }
        } else {
          this.predictedImage = null;
          this.classNames = '';
          this.detectedConfidence = null;
          // Prefer backend message if present
          this.errorMessage = (result && (result.error || result.message)) || 'Error occurred during prediction';
          console.error('Prediction error response:', result);
        }
      } catch (error) {
        // Network or retry-exhausted
        this.predictedImage = null;
        this.classNames = '';
        this.detectedConfidence = null;
        this.errorMessage = 'Could not reach prediction server. Please ensure the model server is running.';
        console.error('Request failed:', error);
      }
    },
    selectCategory(cat) {
      this.category = cat;
      this.step = 2;
    },
    selectMethod(method) {
      this.searchMethod = method;
      this.step = 3;
    },
    formatStudentId() {
      let val = this.studentId.replace(/\D/g, "");
      if (val.length > 3) val = val.slice(0, 3) + "-" + val.slice(3);
      if (val.length > 9) val = val.slice(0, 9);
      this.studentId = val;
    },
    handleImageUpload(e) {
      const file = e.target.files[0];
      if (!file) return;

      if (this.category === 'id') {
        if (this.previewImageId) {
          URL.revokeObjectURL(this.previewImageId);
        }
        this.resetQrState(true);
        this.selectedFileId = file;
        this.previewImageId = URL.createObjectURL(file);
        this.scanQrFromFile(file);
      } else if (this.category === 'general') {
        if (this.previewImageGeneral) {
          URL.revokeObjectURL(this.previewImageGeneral);
        }
        this.selectedFileGeneral = file;
        this.previewImageGeneral = URL.createObjectURL(file);
      } else {
        // fallback to generic slot
        if (this.previewImage) {
          URL.revokeObjectURL(this.previewImage);
        }
        this.selectedFile = file;
        this.previewImage = URL.createObjectURL(file);
      }
      // clear previous prediction when a new file is chosen
      this.predictedImage = null;
      this.classNames = '';
      this.detectedConfidence = null;
      this.errorMessage = '';
    },
    async readFileAsDataURL(file) {
      return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (event) => resolve(event.target?.result);
        reader.onerror = () => reject(new Error('Failed to read file as data URL'));
        reader.readAsDataURL(file);
      });
    },
    async scanQrFromFile(file) {
      this.isExtractingQR = true;
      this.qrDetected = false;
      this.qrDetectionFailed = false;
      this.qrErrorMessage = '';

      try {
        const dataUrl = await this.readFileAsDataURL(file);
        const qrRawData = await this.extractQRFromImage(dataUrl);

        if (qrRawData) {
          const extractedId = this.extractStudentIdFromQR(qrRawData);
          if (extractedId) {
            this.studentId = extractedId;
            this.qrDetected = true;
          } else {
            this.qrDetectionFailed = true;
            this.qrErrorMessage = 'QR detected but no valid student ID was found.';
          }
        } else {
          this.qrDetectionFailed = true;
          this.qrErrorMessage = 'No QR code detected in the image.';
        }
      } catch (error) {
        console.error('Error scanning QR:', error);
        this.qrDetectionFailed = true;
        this.qrErrorMessage = 'Unable to process the image. Please try another photo.';
      } finally {
        this.isExtractingQR = false;
      }
    },
    async extractQRFromImage(imageDataUrl) {
      return new Promise((resolve, reject) => {
        const img = new Image();
        img.onload = () => {
          try {
            const canvas = document.createElement('canvas');
            canvas.width = img.width;
            canvas.height = img.height;
            const ctx = canvas.getContext('2d');
            if (!ctx) {
              reject(new Error('Unable to access canvas context'));
              return;
            }
            ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
            const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
            const qrCode = jsQR(imageData.data, imageData.width, imageData.height);
            resolve(qrCode?.data || null);
          } catch (err) {
            reject(err);
          }
        };
        img.onerror = () => reject(new Error('Failed to load image for QR extraction'));
        img.crossOrigin = 'anonymous';
        img.src = imageDataUrl;
      });
    },
    extractStudentIdFromQR(qrText) {
      if (!qrText) return null;
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
          let studentId = match[1];
          if (studentId.length === 8 && !studentId.includes('-')) {
            studentId = `${studentId.substring(0, 3)}-${studentId.substring(3)}`;
          }
          return studentId;
        }
      }

      return null;
    },
    filterSuggestions() {
      const input = this.itemName.toLowerCase();
      this.filteredSuggestions = this.itemSuggestions.filter((item) =>
        item.toLowerCase().includes(input)
      );
    },
    selectSuggestion(suggestion) {
      this.itemName = suggestion;
      this.showSuggestions = false;
    },
    hideSuggestions() {
      setTimeout(() => (this.showSuggestions = false), 150);
    },
    async performSearch() {
      // Clear previous errors and show loading UI
      this.errorMessage = '';
      this.loading = true;
      this.results = [];

      // Move to results area so user sees searching state
      this.step = 4;

      try {
        // Validate inputs based on selected category
        if (this.category === 'id') {
          if (!this.isValidStudentId) {
            this.errorMessage = 'Invalid Student ID format. Use XXX-XXXXX.';
            this.loading = false;
            return;
          }

          // Send both studentId and legacy query to be robust
          const params = { studentId: this.studentId, query: this.studentId };
          if (this.sourceItemId) params.source_item_id = this.sourceItemId;
          const reporterId = this.reporterId || this.user?.id;
          if (reporterId) params.reporter_id = reporterId;
          const resp = await axios.get('http://localhost:5000/api/items/search', {
            params,
          });

          this.results = resp.data || [];
          return;
        }

        if (this.category === 'general') {
          if (!this.itemName || !this.itemName.trim()) {
            this.errorMessage = 'Please enter an item name to search.';
            this.loading = false;
            return;
          }

          // Send itemName param so backend can filter by item name
          const trimmed = this.itemName.trim();

          // Send both itemName (new param) and query (legacy) to be robust while debugging
          const params = { itemName: trimmed, query: trimmed };
          if (this.sourceItemId) params.source_item_id = this.sourceItemId;
          const reporterId = this.reporterId || this.user?.id;
          if (reporterId) params.reporter_id = reporterId;
          const resp = await axios.get('http://localhost:5000/api/items/search', {
            params,
          });
          this.results = resp.data || [];
          return;
        }

        // Fallback: no category selected
        this.errorMessage = 'Please select a category and search method.';
      } catch (err) {
        console.error('Error searching items:', err);
        // Prefer backend message if present
        if (err.response && err.response.data && err.response.data.message) {
          this.errorMessage = err.response.data.message;
        } else {
          this.errorMessage = 'An error occurred while searching. Please try again.';
        }
      } finally {
        this.loading = false;
      }
    },
    resetSearch() {
      this.step = 1;
      this.category = null;
      this.searchMethod = null;
      // clear both upload states
      if (this.previewImageId) {
        URL.revokeObjectURL(this.previewImageId);
      }
      if (this.previewImageGeneral) {
        URL.revokeObjectURL(this.previewImageGeneral);
      }
      if (this.previewImage) {
        URL.revokeObjectURL(this.previewImage);
      }
      this.previewImage = null;
      this.previewImageId = null;
      this.previewImageGeneral = null;
      this.selectedFile = null;
      this.selectedFileId = null;
      this.selectedFileGeneral = null;
      this.studentId = "";
      this.itemName = "";
      this.results = [];
      this.predictedImage = null;
      this.classNames = '';
      this.detectedConfidence = null;
      this.errorMessage = '';
      this.resetQrState(true);
    },
    toggleNotifications() {
      this.showNotifications = !this.showNotifications;
    },
    goToProfile() {
      this.$router.push("/profile");
    },
    logout() {
      localStorage.clear();
      this.$router.push("/login");
    },
    resetQrState(clearStudentId = false) {
      this.isExtractingQR = false;
      this.qrDetected = false;
      this.qrDetectionFailed = false;
      this.qrErrorMessage = '';
      if (clearStudentId) {
        this.studentId = '';
      }
    },
    resetIdUpload() {
      if (this.previewImageId) {
        URL.revokeObjectURL(this.previewImageId);
      }
      this.previewImageId = null;
      this.selectedFileId = null;
      this.resetQrState(true);
    },
  },
  watch: {
    "$route.query"(next = {}) {
      if (next.source_item_id || next.sourceItemId) {
        this.sourceItemId = next.source_item_id || next.sourceItemId;
      }
      if (next.reporter_id || next.reporterId) {
        this.reporterId = next.reporter_id || next.reporterId;
      }
    },
  },
  mounted() {
    // Restore authenticated context so the search API knows who is searching.
    try {
      const storedUser = JSON.parse(localStorage.getItem("user") || "null");
      if (storedUser) {
        this.user = storedUser;
        if (!this.reporterId && storedUser.id) {
          this.reporterId = storedUser.id;
        }
      }
    } catch (err) {
      console.error("Failed to parse stored user:", err);
    }

    // Accept both snake_case and camelCase query params for flexibility.
    const query = this.$route?.query || {};
    this.sourceItemId =
      query.source_item_id || query.sourceItemId || this.sourceItemId;
    this.reporterId =
      query.reporter_id || query.reporterId || this.reporterId;
  },
};
</script>
