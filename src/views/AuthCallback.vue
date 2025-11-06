<template>
  <div class="flex h-screen bg-gray-950 text-white">
    <!-- Sidebar -->
    <AdminSidebar />

    <!-- Main Content -->
    <div class="flex-1 flex flex-col">
      <!-- Navbar -->
      <AdminNavbar />

      <!-- Dashboard Content -->
      <main class="p-6 overflow-y-auto flex-1">
        <!-- Overview Cards -->
        <div class="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          <DashboardCard title="Total Reports" :count="totalReports" color="yellow" />
          <DashboardCard title="Resolved Items" :count="resolvedCount" color="green" />
          <DashboardCard title="Pending Items" :count="pendingCount" color="red" />
        </div>

        <!-- Tabs -->
        <div class="flex justify-center mb-6 space-x-4 relative">
          <button
            v-for="tab in tabs"
            :key="tab"
            @click="activeTab = tab"
            class="px-4 py-2 rounded-lg transition"
            :class="activeTab === tab
              ? 'bg-yellow-500 text-black'
              : 'bg-gray-800 text-white hover:bg-gray-700'"
          >
            {{ tab }}
            <span
              v-if="getUnreadCount(tab) > 0"
              class="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center"
            >
              {{ getUnreadCount(tab) }}
            </span>
          </button>
        </div>

        <!-- Filter/Search -->
        <div class="mb-4 flex justify-between items-center flex-wrap gap-4">
          <input
            v-model="search"
            type="text"
            placeholder="Search by Name or Student ID"
            class="px-4 py-2 rounded-lg bg-gray-800 text-white w-64 focus:outline-none"
          />
          <select
            v-model="categoryFilter"
            class="px-4 py-2 rounded-lg bg-gray-800 text-white focus:outline-none"
          >
            <option value="">All Categories</option>
            <option value="id">ID Items</option>
            <option value="general">General Items</option>
          </select>
          <select
            v-if="activeTab === 'Found Reports'"
            v-model="statusFilter"
            class="px-4 py-2 rounded-lg bg-gray-800 text-white focus:outline-none"
          >
            <option value="">All Status</option>
            <option value="pending">Pending</option>
            <option value="in_security_custody">In Security Custody</option>
          </select>
        </div>

        <!-- Report Table -->
        <table
          class="min-w-full bg-gray-900 text-left text-sm text-gray-300 rounded-lg mb-6 border border-gray-700"
        >
          <thead>
            <tr class="border-b border-gray-700 bg-gray-800 text-gray-300">
              <th class="px-4 py-2">Image</th>
              <th class="px-4 py-2">Name</th>
              <th class="px-4 py-2">Category</th>
              <th class="px-4 py-2">Details</th>
              <th class="px-4 py-2">Date</th>
              <th class="px-4 py-2">Status</th>
              <th class="px-4 py-2">Reported By</th>
              <th class="px-4 py-2">Actions</th>
            </tr>
          </thead>
          <tbody>
            <tr
              v-for="item in filteredItems"
              :key="item.id"
              class="border-b border-gray-700 hover:bg-gray-800"
            >
              <td class="px-4 py-2">
                <img
                  v-if="item.image_url && item.image_url !== 'null' && item.image_url.trim() !== '' && !item.imageError"
                  :src="`${API_BASE_URL}${item.image_url}`"
                  @error="item.imageError = true"
                  class="w-12 h-12 object-cover rounded"
                />
                <span v-else class="text-gray-500">N/A</span>
              </td>
              <td class="px-4 py-2">{{ item.name }}</td>
              <td class="px-4 py-2">{{ item.category || "General" }}</td>
              <td class="px-4 py-2">{{ getItemDetails(item) }}</td>
              <td class="px-4 py-2">{{ formatDate(item.datetime) }}</td>
              <td class="px-4 py-2">{{ formatStatus(item.status) }}</td>
              <td class="px-4 py-2">{{ item.reporter_name || 'Anonymous' }}</td>
              <td class="px-4 py-2 flex space-x-2">
                <button
                  @click="viewItem(item)"
                  class="px-4 py-2 bg-yellow-500 text-black rounded hover:bg-yellow-600"
                >
                  View
                </button>
                <button
                  @click="confirmDeleteItem(item)"
                  class="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600"
                >
                  Delete
                </button>
              </td>
            </tr>
          </tbody>
        </table>

        <!-- ITEM DETAILS MODAL -->
        <div v-if="selectedItem && !deleteItemModal" class="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50">
          <div class="bg-gray-900 text-white rounded-xl p-6 w-96 max-h-[90vh] overflow-y-auto border border-gray-700 shadow-lg">
            <h3 class="text-xl font-semibold mb-4">Item Details</h3>

            <!-- Item Image -->
            <img
              v-if="selectedItem.image_url && !imageError"
              :src="`${API_BASE_URL}${selectedItem.image_url}`"
              @error="imageError = true"
              class="w-full h-48 object-cover rounded mb-4"
            />
            <div v-else class="w-full h-48 bg-gray-800 flex items-center justify-center rounded mb-4 text-gray-500">
              N/A
            </div>

            <!-- Item Details -->
            <div class="space-y-1 mb-4">
              <div
                v-for="(value, key) in filteredItemDetails"
                :key="key"
                class="flex justify-between border-b border-gray-800 py-1"
              >
                <span class="capitalize text-gray-400">{{ key }}</span>
                <span>{{ value }}</span>
              </div>
            </div>

            <!-- Reporter Details -->
            <h4 class="text-lg font-semibold mb-2">Reported By</h4>
            <div class="space-y-1 mb-4">
              <div class="flex justify-between border-b border-gray-800 py-1">
                <span class="text-gray-400">Name</span>
                <span>{{ selectedItem.reporter_name || 'Anonymous' }}</span>
              </div>
              <div class="flex justify-between border-b border-gray-800 py-1">
                <span class="text-gray-400">Email</span>
                <span>{{ selectedItem.reporter_email || 'N/A' }}</span>
              </div>
              <div class="flex justify-between border-b border-gray-800 py-1">
                <span class="text-gray-400">Contact</span>
                <span>{{ selectedItem.reporter_contact || 'N/A' }}</span>
              </div>
            </div>

            <div class="mt-6 flex justify-end">
              <button @click="closeModal" class="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600">
                Close
              </button>
            </div>
          </div>
        </div>

        <!-- DELETE CONFIRM MODAL -->
        <div v-if="deleteItemModal" class="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50">
          <div class="bg-gray-900 text-white rounded-xl p-6 w-96 max-h-[90vh] overflow-y-auto border border-gray-700 shadow-lg">
            <h3 class="text-xl font-semibold mb-4">Confirm Delete</h3>

            <p class="mb-4">Are you sure you want to delete this report?</p>

            <!-- Item Details -->
            <div class="space-y-1 mb-4">
              <div
                v-for="(value, key) in filteredItemDetails"
                :key="key"
                class="flex justify-between border-b border-gray-800 py-1"
              >
                <span class="capitalize text-gray-400">{{ key }}</span>
                <span>{{ value }}</span>
              </div>
            </div>

            <!-- Reporter Details -->
            <h4 class="text-lg font-semibold mb-2">Reported By</h4>
            <div class="space-y-1 mb-4">
              <div class="flex justify-between border-b border-gray-800 py-1">
                <span class="text-gray-400">Name</span>
                <span>{{ selectedItem.reporter_name || 'Anonymous' }}</span>
              </div>
              <div class="flex justify-between border-b border-gray-800 py-1">
                <span class="text-gray-400">Email</span>
                <span>{{ selectedItem.reporter_email || 'N/A' }}</span>
              </div>
              <div class="flex justify-between border-b border-gray-800 py-1">
                <span class="text-gray-400">Contact</span>
                <span>{{ selectedItem.reporter_contact || 'N/A' }}</span>
              </div>
            </div>

            <div class="mt-6 flex justify-end space-x-2">
              <button @click="cancelDelete" class="px-4 py-2 bg-gray-700 rounded hover:bg-gray-600">Cancel</button>
              <button @click="deleteReport(selectedItem.id)" class="px-4 py-2 bg-red-500 rounded hover:bg-red-600">Delete</button>
            </div>
          </div>
        </div>
      </main>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from "vue";
import axios from "axios";
import initSocket from "../socket";
import AdminSidebar from '../components/AdminSidebar.vue';
import AdminNavbar from '../components/AdminNavbar.vue';
import DashboardCard from '../components/DashboardCard.vue';

const API_BASE_URL = "http://localhost:5000";

const tabs = ["Lost Reports", "Found Reports", "Returned History"];
const activeTab = ref("Lost Reports");

const lostItems = ref([]);
const foundItems = ref([]);
const returnedHistory = ref([]);

const selectedItem = ref(null);
const deleteItemModal = ref(false);
const imageError = ref(false);

const search = ref("");
const categoryFilter = ref("");
const statusFilter = ref("");

const socket = initSocket();

// Fetch items from backend
const fetchItems = async () => {
  try {
    const res = await axios.get(`${API_BASE_URL}/api/items`);
    const data = res.data.map(i => ({ ...i, imageError: false }));
    lostItems.value = data.filter(i => i.type === "lost");
    foundItems.value = data.filter(i => i.type === "found" && i.status !== "returned");
    returnedHistory.value = data.filter(i => i.status === "returned");
  } catch (err) {
    console.error("Error fetching items:", err);
  }
};

// Computed filtered items
const filteredItems = computed(() => {
  let items = activeTab.value === "Lost Reports"
    ? lostItems.value
    : activeTab.value === "Found Reports"
    ? foundItems.value
    : returnedHistory.value;

  if (search.value) {
    items = items.filter(i =>
      i.name?.toLowerCase().includes(search.value.toLowerCase()) ||
      (i.student_id && i.student_id.includes(search.value))
    );
  }
  if (categoryFilter.value) items = items.filter(i => i.category === categoryFilter.value);
  if (statusFilter.value && activeTab.value === "Found Reports") {
    items = items.filter(i => i.status === statusFilter.value);
  }
  return items;
});

// Filtered item details for modal
const filteredItemDetails = computed(() => {
  if (!selectedItem.value) return {};
  const filtered = {};
  for (const [key, value] of Object.entries(selectedItem.value)) {
    if (!["id","image_url","created_at","reporter_name","reporter_email","reporter_contact"].includes(key) && value) {
      filtered[key] = value;
    }
  }
  return filtered;
});

const viewItem = (item) => {
  selectedItem.value = item;
  imageError.value = false;
  deleteItemModal.value = false;
};

const closeModal = () => selectedItem.value = null;

const confirmDeleteItem = (item) => {
  selectedItem.value = item;
  deleteItemModal.value = true;
};

const cancelDelete = () => {
  deleteItemModal.value = false;
  selectedItem.value = null;
};

const deleteReport = async (id) => {
  try {
    await axios.delete(`${API_BASE_URL}/api/items/${id}`);
    lostItems.value = lostItems.value.filter(i => i.id !== id);
    foundItems.value = foundItems.value.filter(i => i.id !== id);
    returnedHistory.value = returnedHistory.value.filter(i => i.id !== id);
    cancelDelete();
  } catch (err) {
    console.error("Error deleting item:", err);
  }
};

const getItemDetails = (item) => {
  if(item.category === "id" && item.student_id) return `Student ID: ${item.student_id}`;
  if(item.brand || item.color) return `Brand: ${item.brand || "N/A"}, Color: ${item.color || "N/A"}`;
  return "N/A";
};

const formatDate = (datetime) => new Date(datetime).toLocaleString("en-PH", { timeZone: "Asia/Manila", year: "numeric", month: "short", day: "2-digit", hour: "2-digit", minute: "2-digit", hour12: true });
const formatStatus = (status) => status.split("_").map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(" ");

// Dashboard counts
const totalReports = computed(() => lostItems.value.length + foundItems.value.length + returnedHistory.value.length);
const resolvedCount = computed(() => foundItems.value.filter(i => i.status !== "pending").length + returnedHistory.value.length);
const pendingCount = computed(() => lostItems.value.filter(i => i.status === "pending").length + foundItems.value.filter(i => i.status === "pending").length);

// Unread notifications (optional)
const unreadLostCount = ref(0), unreadFoundCount = ref(0), unreadReturnedCount = ref(0);
const getUnreadCount = (tab) => {
  switch(tab){
    case "Lost Reports": return unreadLostCount.value;
    case "Found Reports": return unreadFoundCount.value;
    case "Returned History": return unreadReturnedCount.value;
    default: return 0;
  }
};

// Real-time updates
socket.on("newReport", (report) => {
  const item = { ...report, imageError: false };
  if(item.type === "lost") lostItems.value.unshift(item);
  else if(item.type === "found") foundItems.value.unshift(item);
  else if(item.status === "returned") returnedHistory.value.unshift(item);
});

socket.on("reportUpdated", (updatedReport) => {
  const lists = [lostItems.value, foundItems.value, returnedHistory.value];
  lists.forEach(list => {
    const idx = list.findIndex(i => i.id === updatedReport.id);
    if(idx !== -1) list.splice(idx, 1);
  });
  if(updatedReport.status === "returned") returnedHistory.value.unshift(updatedReport);
  else if(updatedReport.type === "found") foundItems.value.unshift(updatedReport);
  else lostItems.value.unshift(updatedReport);
});

onMounted(() => {
  fetchItems();
});
</script>
