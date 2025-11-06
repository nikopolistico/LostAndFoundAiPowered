<template>
  <div
    class="min-h-screen bg-gradient-to-b from-gray-950 via-gray-900 to-gray-950 text-white flex flex-col items-center justify-center p-6 animate-fade-in relative"
  >
    <!-- ✅ Success Message -->
    <transition name="fade">
      <div
        v-if="showSuccess"
        class="fixed top-8 right-8 bg-green-600 text-white px-6 py-3 rounded-lg shadow-lg flex items-center gap-2 z-50 border border-green-400"
      >
        <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
          <path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7" />
        </svg>
        <span class="font-semibold">Profile updated successfully!</span>
      </div>
    </transition>

    <!-- Profile Card -->
    <div
      class="relative bg-gray-800 w-full max-w-3xl rounded-2xl shadow-2xl overflow-hidden text-center"
    >
      <div class="h-40 bg-gradient-to-r from-gray-900 to-gray-700"></div>

      <div class="pb-8 px-8 -mt-16 flex flex-col items-center">
        <!-- Profile Image -->
        <div class="relative mb-4">
          <img
            :src="profilePhoto"
            alt="Profile Photo"
            class="w-32 h-32 rounded-full border-4 border-yellow-400 object-cover shadow-lg"
          />
          <label
            v-if="editMode"
            class="absolute bottom-0 right-0 bg-yellow-500 text-black px-2 py-1 text-xs rounded cursor-pointer hover:bg-yellow-400 transition"
          >
            Change
            <input type="file" accept="image/*" @change="openCropper" class="hidden" />
          </label>
        </div>

        <!-- Image Cropper Modal -->
        <div
          v-if="showCropper"
          class="fixed inset-0 bg-black/80 flex flex-col items-center justify-center z-50 p-6"
        >
          <div class="bg-gray-900 p-6 rounded-2xl shadow-lg w-full max-w-lg border border-gray-700">
            <h2 class="text-yellow-400 font-semibold text-lg mb-4 text-center">
              Adjust Your Profile Photo
            </h2>

            <div class="relative w-full h-80 bg-gray-800 rounded-xl overflow-hidden">
              <Cropper
                ref="cropperRef"
                :src="tempPhoto"
                class="w-full h-full border-2 border-yellow-400 rounded-lg"
                :stencil-props="{
                  aspectRatio: 1,
                  movable: true,
                  resizable: true,
                  handlers: true,
                  lines: true,
                  aspectRatioLocked: true
                }"
                :stencil-size="{ width: 250, height: 250 }"
                :auto-zoom="true"
                image-restriction="stencil"
              />
            </div>

            <div class="flex justify-center mt-6 gap-4">
              <button @click="saveCroppedImage" class="bg-yellow-500 text-black px-5 py-2 rounded-lg font-semibold hover:bg-yellow-400 transition">
                Save
              </button>
              <button @click="cancelCrop" class="bg-gray-700 px-5 py-2 rounded-lg text-gray-200 hover:bg-gray-600 transition">
                Cancel
              </button>
            </div>
          </div>
        </div>

        <!-- Profile Info -->
        <div class="text-center mt-3 w-full">
          <div v-if="!editMode">
            <h1 class="text-3xl font-bold mb-1">{{ name }}</h1>
            <p class="text-gray-400 mb-2">{{ email }}</p>
            <p class="text-gray-300">{{ userType }}</p>
            <p class="text-gray-300">{{ department }}</p>
            <p class="text-gray-300">Contact: {{ contactNumber }}</p>
            <p class="text-gray-400">Birthday: {{ birthday }}</p>
          </div>

          <!-- Editable Fields -->
          <div v-else class="space-y-3 max-w-sm mx-auto">
            <input v-model="editableName" type="text" placeholder="Full Name" class="w-full p-2 rounded-lg text-black border border-gray-400 text-center" />
            <select v-model="editableUserType" class="w-full p-2 rounded-lg text-black border border-gray-400 text-center">
              <option value="University Student">University Student</option>
              <option value="University Employee">University Employee</option>
              <option value="Security Staff">Security Staff</option>
            </select>
            <input v-model="editableDepartment" type="text" placeholder="Department / Office" class="w-full p-2 rounded-lg text-black border border-gray-400 text-center" />
            <input v-model="editableContactNumber" type="tel" placeholder="Contact Number" class="w-full p-2 rounded-lg text-black border border-gray-400 text-center" />
            <input v-model="editableBirthday" type="date" class="w-full p-2 rounded-lg text-black border border-gray-400 text-center" />
          </div>

          <p class="text-gray-500 mt-3 text-sm">Member since: {{ createdAt }}</p>

          <!-- Buttons -->
          <div class="mt-6 flex flex-col sm:flex-row sm:items-center sm:justify-center sm:gap-3">
            <button
              v-if="!editMode"
              @click="toggleEdit"
              class="px-6 py-2 rounded-full bg-yellow-500 text-black font-semibold hover:bg-yellow-400 transition"
            >
              Edit Profile
            </button>

            <div v-else class="flex items-center justify-center gap-3">
              <button @click="saveProfile" class="px-6 py-2 rounded-full bg-green-600 text-white font-semibold hover:bg-green-500 transition">
                Save
              </button>
              <button @click="cancelEdit" class="px-6 py-2 rounded-full bg-gray-600 text-white font-semibold hover:bg-gray-500 transition">
                Cancel
              </button>
            </div>
          </div>

          <!-- ✅ Only Home Button -->
          <div class="mt-6 flex justify-center items-center text-gray-400">
            <router-link
              to="/userdashboard"
              class="flex flex-col items-center hover:text-yellow-400 transition"
            >
              <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6 mb-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                  d="M3 12l2-2m0 0l7-7 7 7m-9 2v8m0-8H5m4 0h10" />
              </svg>
              Home
            </router-link>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from "vue";
import { useRouter } from "vue-router";
import axios from "axios";
import { Cropper } from "vue-advanced-cropper";
import { disconnectSocket } from "../socket";
import "vue-advanced-cropper/dist/style.css";

const router = useRouter();
const API_URL = "http://localhost:5000/api/profile";

const redirectToLogin = () => {
  disconnectSocket();
  localStorage.clear();
  router.push("/login");
};

// Profile state
const name = ref("");
const email = ref("");
const userType = ref("");
const department = ref("");
const contactNumber = ref("");
const birthday = ref(""); // ← will show formatted date
const createdAt = ref("");
const profilePhoto = ref("https://via.placeholder.com/150");

// Editable state
const editableName = ref("");
const editableUserType = ref("");
const editableDepartment = ref("");
const editableContactNumber = ref("");
const editableBirthday = ref(""); // ← raw YYYY-MM-DD for input
const selectedFile = ref(null);

const editMode = ref(false);
const showCropper = ref(false);
const showSuccess = ref(false);
const tempPhoto = ref(null);
const cropperRef = ref(null);

// ✅ Fetch profile safely with backend base URL
const fetchProfile = async () => {
  try {
    const token = localStorage.getItem("token");
    if (!token) {
      console.warn("No token found");
      return redirectToLogin();
    }

    const res = await axios.get(API_URL, {
      headers: { Authorization: `Bearer ${token}` },
    });

    const data = res.data;

    name.value = data.full_name;
    email.value = data.email;
    userType.value = data.user_type;
    department.value = data.department;
    contactNumber.value = data.contact_number;

    // ✅ Format birthday for display (e.g., "April 18, 2003")
    if (data.birthday) {
      const date = new Date(data.birthday);
      birthday.value = date.toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
      });
    } else {
      birthday.value = "Not set";
    }

    createdAt.value = new Date(data.created_at || data.updated_at).toLocaleDateString();

    // ✅ Profile photo
    if (data.profile_picture) {
      const normalizedPath = data.profile_picture.replace(/^\/?uploads\//, "/uploads/");
      profilePhoto.value = `http://localhost:5000${normalizedPath}`;
    } else {
      profilePhoto.value = "https://via.placeholder.com/150";
    }

    // Editable fields
    editableName.value = name.value;
    editableUserType.value = userType.value;
    editableDepartment.value = department.value;
    editableContactNumber.value = contactNumber.value;
    // Keep raw value for date input (YYYY-MM-DD)
    editableBirthday.value = data.birthday ? new Date(data.birthday).toISOString().split("T")[0] : "";

  } catch (err) {
    console.error("Failed to fetch profile:", err.message);
    if (err.response?.status === 401) {
      redirectToLogin();
    }
  }
};

// Cropper functions
const openCropper = (e) => {
  const file = e.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = (event) => {
    tempPhoto.value = event.target.result;
    showCropper.value = true;
  };
  reader.readAsDataURL(file);
};

const saveCroppedImage = () => {
  const { canvas } = cropperRef.value.getResult();
  if (canvas) {
    canvas.toBlob((blob) => {
      selectedFile.value = new File([blob], "profile.png", { type: "image/png" });
      profilePhoto.value = URL.createObjectURL(selectedFile.value);
      showCropper.value = false;
    }, "image/png");
  }
};

// ✅ Save profile safely
const saveProfile = async () => {
  try {
    const token = localStorage.getItem("token");
  if (!token) return redirectToLogin();

    const formData = new FormData();
    formData.append("full_name", editableName.value);
    formData.append("user_type", editableUserType.value);
    formData.append("department", editableDepartment.value);
    formData.append("contact_number", editableContactNumber.value);
    formData.append("birthday", editableBirthday.value);
    if (selectedFile.value) formData.append("profile_picture", selectedFile.value);

    const response = await axios.post(`${API_URL}/save`, formData, {
      headers: {
        "Content-Type": "multipart/form-data",
        Authorization: `Bearer ${token}`,
      },
    });

    const updatedUser = response.data?.user || null;
    if (updatedUser) {
      try {
        const storedUser = JSON.parse(localStorage.getItem("user") || "null") || {};
        const nextUser = { ...storedUser, ...updatedUser };
        localStorage.setItem("user", JSON.stringify(nextUser));
      } catch (err) {
        console.error("Failed to sync updated user in storage:", err);
      }
    }

    showSuccess.value = true;
    editMode.value = false;
    fetchProfile();
    setTimeout(() => (showSuccess.value = false), 3000);

  } catch (err) {
    console.error("Error saving profile:", err.message);
    if (err.response?.status === 401) {
      redirectToLogin();
    }
  }
};

const cancelCrop = () => (showCropper.value = false);
const toggleEdit = () => (editMode.value = true);
const cancelEdit = () => (editMode.value = false);

onMounted(fetchProfile);
</script>