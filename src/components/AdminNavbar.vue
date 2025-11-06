<template>
  <nav class="bg-gray-900 shadow-md h-16 flex items-center justify-between px-6">
    <h1 class="text-lg font-semibold text-yellow-300">Admin Dashboard</h1>
    <div class="flex items-center gap-4">
      <div class="hidden sm:block text-right">
        <p class="font-semibold text-white">{{ displayName }}</p>
        <p class="text-xs text-gray-400">{{ displayEmail }}</p>
      </div>

      <div class="relative" ref="menuRef">
        <button
          @click="toggleMenu"
          class="w-10 h-10 rounded-full bg-yellow-500 text-gray-900 flex items-center justify-center font-semibold border-2 border-yellow-400 overflow-hidden"
        >
          <img
            v-if="avatarUrl"
            :src="avatarUrl"
            alt="Admin Avatar"
            class="w-full h-full object-cover"
          />
          <span v-else>{{ avatarInitial }}</span>
        </button>

        <div
          v-if="showMenu"
          class="absolute right-0 mt-2 w-48 bg-gray-800 rounded-xl shadow-lg border border-gray-700 z-50"
        >
          <button
            @click="goToProfile"
            class="w-full px-4 py-2 flex items-center gap-2 text-left text-gray-200 hover:bg-gray-700"
          >
            <svg
              class="w-5 h-5"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
              viewBox="0 0 24 24"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                d="M5.121 17.804A13.937 13.937 0 0112 15c2.485 0 4.797.657 6.879 1.804M15 11a3 3 0 11-6 0 3 3 0 016 0zm6 2a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            <span>My Profile</span>
          </button>
          <button
            @click="logout"
            class="w-full px-4 py-2 flex items-center gap-2 text-left text-red-500 hover:bg-gray-700"
          >
            <svg
              class="w-5 h-5"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
              viewBox="0 0 24 24"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                d="M16 12h4M4 18v-1a3 3 0 0 1 3-3h4a3 3 0 0 1 3 3v1a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1Zm8-10a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z"
              />
            </svg>
            <span>Logout</span>
          </button>
        </div>
      </div>
    </div>
  </nav>
</template>

<script setup>
import { computed, onMounted, onBeforeUnmount, ref } from "vue";
import { useRouter } from "vue-router";
import { disconnectSocket } from "../socket";

const router = useRouter();
const adminUser = ref(null);
const showMenu = ref(false);
const menuRef = ref(null);
const API_BASE_URL = "http://localhost:5000";

onMounted(() => {
  try {
    const storedUser = JSON.parse(localStorage.getItem("user") || "null");
    if (storedUser?.role === "admin") {
      adminUser.value = storedUser;
    }
    document.addEventListener("click", handleOutsideClick);
  } catch (err) {
    console.error("Failed to load admin user:", err);
  }
});

onBeforeUnmount(() => {
  document.removeEventListener("click", handleOutsideClick);
});

const displayName = computed(() => {
  if (!adminUser.value) return "Administrator";
  return (
    adminUser.value.full_name ||
    adminUser.value.email?.split("@")[0] ||
    "Administrator"
  );
});

const displayEmail = computed(() => adminUser.value?.email || "admin@example.com");

const avatarUrl = computed(() => {
  const path = adminUser.value?.profile_picture;
  if (!path) return "";
  return path.startsWith("http") ? path : `${API_BASE_URL}${path}`;
});

const avatarInitial = computed(() => displayName.value.charAt(0).toUpperCase());

const toggleMenu = (event) => {
  event.stopPropagation();
  showMenu.value = !showMenu.value;
};

const handleOutsideClick = (event) => {
  if (!menuRef.value) return;
  if (!menuRef.value.contains(event.target)) {
    showMenu.value = false;
  }
};

const goToProfile = () => {
  showMenu.value = false;
  router.push("/profile");
};

const logout = () => {
  showMenu.value = false;
  disconnectSocket();
  localStorage.clear();
  router.replace("/admin-login");
};
</script>
