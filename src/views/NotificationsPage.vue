<template>
  <div class="p-6 min-h-screen flex flex-col items-center bg-gradient-to-b from-gray-950 via-gray-900 to-gray-950">
    <h2 class="text-2xl font-bold mb-6 text-yellow-400">Alerts</h2>

    <div v-if="loading" class="text-gray-400">Loading notifications...</div>
    <div v-else-if="errorMessage" class="text-red-400">{{ errorMessage }}</div>

    <!-- Notifications List -->
    <div
      v-else-if="!selectedNotification && notifications.length"
      class="w-full max-w-md sm:max-w-lg lg:max-w-xl space-y-4"
    >
      <div
        v-for="notif in notifications"
        :key="notif.id"
        class="bg-gray-900 p-4 rounded-xl shadow-md cursor-pointer hover:bg-gray-800 transition"
        @click="openNotification(notif)"
      >
        <h3 class="text-lg font-semibold text-yellow-400">{{ notif.title }}</h3>
        <p class="text-gray-300 text-sm mt-1">{{ notif.message }}</p>
        <p v-if="notif.created_at" class="text-gray-500 text-xs mt-2">
          {{ notif.created_at }}
        </p>
      </div>
    </div>

    <div
      v-else-if="!selectedNotification && !notifications.length"
      class="text-gray-500"
    >
      No notifications yet.
    </div>

    <!-- Notification Details -->
    <div
      v-else
      class="w-full max-w-md sm:max-w-lg lg:max-w-xl bg-gray-900 p-6 rounded-xl shadow-md border border-gray-800"
    >
      <h2 class="text-xl font-bold mb-3 text-white">
        {{ selectedNotification.title }}
      </h2>
      <p class="text-gray-300 mb-4">{{ selectedNotification.details }}</p>

      <img
        v-if="selectedNotification.image"
        :src="selectedNotification.image"
        alt="Matched item"
        class="w-full h-48 object-cover rounded-lg border border-gray-700 mb-4"
      />

      <div class="text-sm text-gray-400 space-y-1 mb-4">
        <p v-if="selectedNotification.location">Location: {{ selectedNotification.location }}</p>
        <p v-if="selectedNotification.status">Status: {{ selectedNotification.status }}</p>
        <p v-if="selectedNotification.studentId">Tagged Student ID: {{ selectedNotification.studentId }}</p>
      </div>

      <button
        @click="selectedNotification = null"
        class="mt-2 px-6 py-2 rounded-lg bg-yellow-500 text-black font-semibold hover:bg-yellow-600 transition"
      >
        ← Back
      </button>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from "vue";
import axios from "axios";

const notifications = ref([]);
const selectedNotification = ref(null);
const loading = ref(false);
const errorMessage = ref("");

const API_BASE = "http://localhost:5000";

const mapNotification = (row) => {
  const title = row.category?.toLowerCase() === "id" ? "Student ID match found" : "Item match found";
  const message =
    row.category?.toLowerCase() === "id"
      ? `Your Student ID (${row.display_student_id || "Unknown"}) might be at Security.`
      : `A possible match for "${row.display_name}" was found.`;

  const detailSegments = [];
  if (row.display_description) detailSegments.push(row.display_description);
  if (row.matched_location) detailSegments.push(`Stored at: ${row.matched_location}`);
  if (row.matched_status) detailSegments.push(`Current status: ${row.matched_status.replace(/_/g, " ")}`);

  return {
    id: row.id || `match-${row.match_id}`,
    title,
    message,
  details: detailSegments.join(" • ") || message,
    image: row.display_image ? `${API_BASE}${row.display_image}` : null,
    location: row.matched_location || null,
    status: row.matched_status ? row.matched_status.replace(/_/g, " ") : null,
    studentId: row.display_student_id || null,
    created_at: row.created_at ? new Date(row.created_at).toLocaleString() : null,
  };
};

const loadNotifications = async () => {
  loading.value = true;
  errorMessage.value = "";

  try {
    const user = JSON.parse(localStorage.getItem("user") || "null");
    if (!user?.id) {
      errorMessage.value = "Please sign in to view notifications.";
      notifications.value = [];
      return;
    }

    const res = await axios.get(`${API_BASE}/api/notifications/${user.id}`);
    notifications.value = Array.isArray(res.data)
      ? res.data.map(mapNotification)
      : [];
  } catch (err) {
    console.error("Failed to load notifications:", err);
    errorMessage.value = "Unable to load notifications right now.";
  } finally {
    loading.value = false;
  }
};

const openNotification = (notif) => {
  selectedNotification.value = notif;
};

onMounted(loadNotifications);
</script>
