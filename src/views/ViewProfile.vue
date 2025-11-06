<script setup>
import { ref, onMounted, computed } from "vue";
import { useRoute, useRouter } from "vue-router"; // ✅ Import useRouter
import axios from "axios";

const route = useRoute();
const router = useRouter(); // ✅ Initialize router
const API_URL = "http://localhost:5000/api/profile";

// Profile state
const name = ref("");
const email = ref("");
const userType = ref("");
const department = ref("");
const contactNumber = ref("");
const birthday = ref("");
const createdAt = ref("");
const profilePhoto = ref("");

// Computed property for current date
const currentDate = computed(() => {
  return new Date().toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
});

// Fetch profile by user ID
const fetchProfile = async () => {
  try {
    const userId = route.params.id;
    const res = await axios.get(`${API_URL}/${userId}`);
    const data = res.data;

    name.value = data.full_name;
    email.value = data.email;
    userType.value = data.user_type;
    department.value = data.department;
    contactNumber.value = data.contact_number;

    if (data.birthday) {
      birthday.value = new Date(data.birthday).toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
      });
    }

    createdAt.value = new Date(data.created_at || data.updated_at).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
    });

    profilePhoto.value = data.profile_picture
      ? `http://localhost:5000${data.profile_picture.replace(/^\/?uploads\//, "/uploads/")}`
      : "";
  } catch (err) {
    console.error("Failed to fetch profile:", err.message);
  }
};

// ✅ Go back to previous page (Admin or Security Dashboard)
const goBack = () => {
  router.go(-1); // Navigate back in browser history
};

onMounted(fetchProfile);
</script>

<template>
  <div class="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-6">
    <!-- Header Navigation -->
    <div class="max-w-5xl mx-auto mb-8">
      <button
        @click="goBack"
        class="flex items-center gap-2 text-slate-600 hover:text-slate-900 transition-colors font-medium"
      >
        <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
        </svg>
        Back to Dashboard
      </button>
    </div>

    <!-- Main Profile Container -->
    <div class="max-w-5xl mx-auto">
      <!-- Staff View Badge -->
      <div class="mb-6 flex items-center gap-2">
        <span class="inline-flex items-center gap-2 px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm font-medium">
          <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
            <path d="M12 1C6.48 1 2 5.48 2 11s4.48 10 10 10 10-4.48 10-10S17.52 1 12 1zm0 3c1.66 0 3 1.34 3 3s-1.34 3-3 3-3-1.34-3-3 1.34-3 3-3zm0 14.2c-2.5 0-4.71-1.28-6-3.22.03-1.99 4-3.08 6-3.08 1.99 0 5.97 1.09 6 3.08-1.29 1.94-3.5 3.22-6 3.22z" />
          </svg>
          Staff View
        </span>
        <span class="text-sm text-slate-500">Viewed on {{ currentDate }}</span>
      </div>

      <!-- Profile Header Card -->
      <div class="bg-white rounded-lg shadow-sm border border-slate-200 overflow-hidden mb-6">
        <!-- Header Background -->
        <div class="h-32 bg-gradient-to-r from-green-600 to-green-700"></div>

        <!-- Profile Info Section -->
        <div class="px-8 pb-8">
          <div class="flex flex-col md:flex-row gap-8 -mt-16 mb-8">
            <!-- Profile Photo -->
            <div class="flex-shrink-0">
              <img
                :src="profilePhoto || 'https://via.placeholder.com/140'"
                alt="Profile Photo"
                class="w-32 h-32 rounded-full border-4 border-white shadow-md object-cover"
              />
            </div>

            <!-- Primary Info -->
            <div class="flex-1 pt-4">
              <h1 class="text-3xl font-bold text-slate-900 mb-1">{{ name || 'N/A' }}</h1>
              <p class="text-lg text-green-600 font-semibold mb-4">{{ userType || 'N/A' }}</p>
              <p class="text-slate-600 mb-2">{{ department || 'N/A' }}</p>
              <p class="text-slate-500 text-sm">Member since {{ createdAt || 'N/A' }}</p>
            </div>
          </div>

          <!-- Info Grid -->
          <div class="grid grid-cols-1 md:grid-cols-3 gap-6 pt-6 border-t border-slate-200">
            <!-- Email -->
            <div>
              <label class="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">Email Address</label>
              <p class="text-slate-900 font-medium">{{ email || 'N/A' }}</p>
            </div>

            <!-- Contact -->
            <div>
              <label class="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">Contact Number</label>
              <p class="text-slate-900 font-medium">{{ contactNumber || 'N/A' }}</p>
            </div>

            <!-- Birthday -->
            <div>
              <label class="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">Date of Birth</label>
              <p class="text-slate-900 font-medium">{{ birthday || 'N/A' }}</p>
            </div>
          </div>
        </div>
      </div>

      <!-- Action Footer -->
      <div class="flex justify-end gap-3">
        <button
          @click="goBack"
          class="px-6 py-2 bg-slate-200 text-slate-900 rounded-lg font-medium hover:bg-slate-300 transition-colors"
        >
          Close
        </button>
        <button
          class="px-6 py-2 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 transition-colors"
        >
          Download Profile
        </button>
      </div>
    </div>
  </div>
</template>

<style scoped>
button {
  transition: all 0.2s ease-in-out;
}

button:active {
  transform: scale(0.98);
}
</style>