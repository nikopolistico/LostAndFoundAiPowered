<template>
  <aside class="w-64 bg-gray-900 p-6 flex flex-col space-y-6 text-white">
    <!-- 🔹 Static Admin Info -->
    <div class="flex items-center space-x-3 border-b border-gray-700 pb-4">
      <div v-if="avatarUrl" class="w-12 h-12">
        <img
          :src="avatarUrl"
          alt="Admin Avatar"
          class="w-12 h-12 rounded-full object-cover border-2 border-yellow-400"
        />
      </div>
      <div
        v-else
        class="w-12 h-12 rounded-full bg-yellow-500 text-gray-900 flex items-center justify-center text-xl font-bold border-2 border-yellow-400"
      >
        {{ avatarInitial }}
      </div>
      <div>
        <p class="font-semibold">{{ displayName }}</p>
        <p class="text-sm text-gray-400">{{ displayEmail }}</p>
      </div>
    </div>

    <!-- 🔹 Navigation Buttons -->
    <nav class="flex flex-col space-y-3">
      <button
        @click="selectPage('dashboard')"
        :class="navButtonClass('dashboard')"
      >
        Dashboard
      </button>
      <button
        @click="selectPage('reported-items')"
        :class="navButtonClass('reported-items')"
      >
        Reported Items
      </button>
      <button
        @click="selectPage('users')"
        :class="navButtonClass('users')"
      >
        Users
      </button>
      <button
        @click="selectPage('categories')"
        :class="navButtonClass('categories')"
      >
        Categories
      </button>
    </nav>

    <button
      @click="selectPage('profile')"
      :class="navButtonClass('profile')"
      class="mt-auto"
    >
      My Profile
    </button>
  </aside>
</template>

<script setup>
import { ref, computed, onMounted } from "vue";

const API_BASE_URL = "http://localhost:5000";

// Track active page
const activePage = ref("dashboard");
const adminUser = ref(null);

onMounted(() => {
  try {
    const storedUser = JSON.parse(localStorage.getItem("user") || "null");
    if (storedUser?.role === "admin") {
      adminUser.value = storedUser;
    }
  } catch (err) {
    console.error("Failed to parse admin user from storage:", err);
    adminUser.value = null;
  }
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

// Emit event to parent when page is selected
const emit = defineEmits(["select-page"]);

const selectPage = (page) => {
  activePage.value = page;
  emit("select-page", page);
};

// Dynamic button styling
const navButtonClass = (page) => {
  return [
    "text-left transition-colors",
    activePage.value === page
      ? "text-yellow-400 font-semibold"
      : "hover:text-yellow-400"
  ];
};
</script>

<style scoped>
button {
  transition: color 0.2s ease;
}
</style>
