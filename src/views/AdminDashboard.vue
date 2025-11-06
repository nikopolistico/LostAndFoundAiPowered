  <template>
  <div class="flex h-screen bg-gray-800 text-white">
    <!-- Sidebar -->
  <AdminSidebar @select-page="handlePageSelect" />
    <!-- Main Content -->
    <div class="flex-1 flex flex-col">
      <!-- Navbar -->
      <AdminNavbar />
      <main class="p-6 overflow-y-auto flex-1">
        <!-- Dashboard Overview -->
        <div v-if="activePage === 'dashboard'">
          <div class="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
            <DashboardCard title="Total Reports" :count="totalReports" color="yellow" />
            <DashboardCard title="Resolved Items" :count="resolvedCount" color="green" />
            <DashboardCard title="Pending Items" :count="pendingCount" color="red" />
          </div>
        </div>

        <!-- ===================== -->
        <!-- REPORTED ITEMS SECTION -->
        <!-- ===================== -->
        <div v-if="activePage === 'reported-items'">
          <!-- Tabs -->
          <div class="flex justify-center mb-6 space-x-4 relative">
            <button
              v-for="tab in reportTabs"
              :key="tab"
              @click="activeReportTab = tab"
              class="px-4 py-2 rounded-lg transition"
              :class="activeReportTab === tab
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
          <div class="mb-4 flex justify-between items-center flex-wrap gap-2">
            <input
              v-model="reportSearch"
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
              v-if="activeReportTab === 'Found Reports'"
              v-model="statusFilter"
              class="px-4 py-2 rounded-lg bg-gray-800 text-white focus:outline-none"
            >
              <option value="">All Status</option>
              <option value="pending">Pending</option>
              <option value="in_security_custody">In Security Custody</option>
            </select>
          </div>

          <!-- Report Table -->
          <table class="min-w-full bg-gray-900 text-left text-sm text-gray-300 rounded-lg mb-6 border border-gray-700">
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
                v-for="item in filteredReportItems"
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
                <td class="px-4 py-2">{{ item.name || 'N/A' }}</td>
                <td class="px-4 py-2">{{ item.category || 'General' }}</td>
                <td class="px-4 py-2">{{ getItemDetails(item) }}</td>
                <td class="px-4 py-2">{{ formatDate(item.datetime) }}</td>
                <td class="px-4 py-2">{{ formatStatus(item.status) }}</td>
                <td class="px-4 py-2 flex items-center space-x-2">
                  <img
                    v-if="item.reporter_profile_picture && !item.reporterImageError"
                    :src="`${API_BASE_URL}${item.reporter_profile_picture}`"
                    @error="item.reporterImageError = true"
                    class="w-8 h-8 rounded-full object-cover border border-gray-600"
                  />
                  <div
                    v-else
                    class="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center text-white text-xs font-bold"
                  >
                    {{ item.reporter_name ? item.reporter_name[0].toUpperCase() : '?' }}
                  </div>
                  <span>{{ item.reporter_name || 'Anonymous' }}</span>
                </td>
                <td class="px-4 py-2 space-x-2">
                  <button
                    @click="viewItem(item)"
                    class="px-4 py-2 bg-yellow-500 text-black rounded hover:bg-yellow-600"
                  >
                    View
                  </button>
                  <button
                    v-if="activeReportTab === 'Returned History'"
                    @click="confirmDelete(item)"
                    class="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600"
                  >
                    Delete
                  </button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <!-- ===================== -->
        <!-- USERS MANAGEMENT SECTION -->
        <!-- ===================== -->
        <div v-if="activePage === 'users'">
          <h2 class="text-2xl font-semibold mb-6 text-yellow-400">User Accounts</h2>
          <div class="bg-gray-900 border border-gray-700 rounded-lg p-5 mb-6">
            <h3 class="text-lg font-semibold text-yellow-300">Register Security Staff</h3>
            <p class="text-sm text-gray-400 mt-1">
              Add security personnel accounts directly from the admin dashboard. Staff will authenticate using Google sign-in after registration.
            </p>

            <form @submit.prevent="registerStaff" class="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
              <div class="flex flex-col">
                <label class="text-sm text-gray-300 mb-1">University Email<span class="text-red-500">*</span></label>
                <input
                  v-model="staffForm.email"
                  type="email"
                  required
                  placeholder="security.staff@carsu.edu.ph"
                  class="px-3 py-2 rounded bg-gray-800 border border-gray-700 text-gray-200 focus:outline-none focus:ring-2 focus:ring-yellow-400"
                />
              </div>

              <div class="flex flex-col">
                <label class="text-sm text-gray-300 mb-1">Full Name</label>
                <input
                  v-model="staffForm.fullName"
                  type="text"
                  placeholder="Juan Dela Cruz"
                  class="px-3 py-2 rounded bg-gray-800 border border-gray-700 text-gray-200 focus:outline-none focus:ring-2 focus:ring-yellow-400"
                />
              </div>

              <div class="flex flex-col">
                <label class="text-sm text-gray-300 mb-1">Department</label>
                <input
                  v-model="staffForm.department"
                  type="text"
                  placeholder="Campus Security"
                  class="px-3 py-2 rounded bg-gray-800 border border-gray-700 text-gray-200 focus:outline-none focus:ring-2 focus:ring-yellow-400"
                />
              </div>

              <div class="flex flex-col">
                <label class="text-sm text-gray-300 mb-1">Contact Number</label>
                <input
                  v-model="staffForm.contactNumber"
                  type="text"
                  placeholder="09xx xxx xxxx"
                  class="px-3 py-2 rounded bg-gray-800 border border-gray-700 text-gray-200 focus:outline-none focus:ring-2 focus:ring-yellow-400"
                />
              </div>

              <div class="md:col-span-2 flex flex-col items-start gap-2">
                <button
                  type="submit"
                  :disabled="staffFormLoading"
                  class="px-4 py-2 bg-yellow-500 text-black rounded hover:bg-yellow-400 transition disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  {{ staffFormLoading ? 'Registering...' : 'Register Staff' }}
                </button>
                <p v-if="staffFormError" class="text-sm text-red-400">{{ staffFormError }}</p>
                <p v-if="staffFormSuccess" class="text-sm text-green-400">{{ staffFormSuccess }}</p>
              </div>
            </form>
          </div>
          <div class="mb-4 flex justify-between items-center flex-wrap gap-2">
            <input
              v-model="userSearch"
              type="text"
              placeholder="Search by Name or Email"
              class="px-4 py-2 rounded-lg bg-gray-800 text-white w-64 focus:outline-none"
            />
          </div>

          <table class="min-w-full bg-gray-900 text-left text-sm text-gray-300 rounded-lg mb-6 border border-gray-700">
            <thead>
              <tr class="border-b border-gray-700 bg-gray-800 text-gray-300">
                <th class="px-4 py-2">Profile</th>
                <th class="px-4 py-2">Name</th>
                <th class="px-4 py-2">Email</th>
                <th class="px-4 py-2">Role</th>
                <th class="px-4 py-2">Actions</th>
              </tr>
            </thead>
            <tbody>
              <tr
                v-for="user in filteredUsers"
                :key="user.id"
                class="border-b border-gray-700 hover:bg-gray-800"
              >
                <td class="px-4 py-2">
                  <img
                    v-if="user.profile_picture"
                    :src="`${API_BASE_URL}${user.profile_picture}`"
                    class="w-10 h-10 rounded-full object-cover border border-gray-600"
                  />
                  <div
                    v-else
                    class="w-10 h-10 rounded-full bg-blue-600 flex items-center justify-center text-white font-bold"
                  >
                    {{ user.full_name ? user.full_name[0].toUpperCase() : '?' }}
                  </div>
                </td>
                <td class="px-4 py-2">{{ user.full_name || 'N/A' }}</td>
                <td class="px-4 py-2">{{ user.email || 'N/A' }}</td>
                <td class="px-4 py-2">
                  <span v-if="user.role === 'security'">Security staff</span>
                  <span v-else-if="user.role === 'admin'">Administrator</span>
                  <span v-else>University member</span>
                </td>
                <td class="px-4 py-2 flex flex-wrap gap-1">
                  <button
                    @click="viewUser(user)"
                    class="px-3 py-1 text-sm bg-yellow-500 text-black rounded hover:bg-yellow-600"
                  >
                    View
                  </button>

                  <button
                    @click="deleteUser(user)"
                    class="px-3 py-1 text-sm bg-red-500 text-white rounded hover:bg-red-600"
                  >
                    Delete
                  </button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </main>
    </div>

    <!-- View Item Modal -->
    <div
      v-if="selectedItem && !deleteConfirmation"
      class="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50"
    >
      <div class="bg-gray-900 text-white rounded-xl p-6 w-96 max-h-[90vh] overflow-y-auto border border-gray-700 shadow-lg">
        <h3 class="text-xl font-semibold mb-4">Item Details</h3>
        <img
          v-if="selectedItem.image_url && !imageError"
          :src="`${API_BASE_URL}${selectedItem.image_url}`"
          @error="imageError = true"
          class="w-full h-1/2 object-cover rounded mb-4"
        />
        <div v-else class="w-full h-48 bg-gray-800 flex items-center justify-center rounded mb-4 text-gray-500">
          N/A
        </div>

        <div class="space-y-1 mb-4">
          <div
            v-for="(value, key) in filteredDetails"
            :key="key"
            class="flex justify-between border-b border-gray-800 py-1"
          >
            <span class="capitalize text-gray-400">{{ key }}</span>
            <span>{{ value }}</span>
          </div>
        </div>

        <div v-if="selectedItem.reporter_name" class="mt-4 pt-3 border-t border-gray-800">
          <h4 class="text-lg font-medium text-yellow-400 mb-2">Reported By</h4>
          <div class="flex items-center space-x-3 mb-3">
            <img
              v-if="selectedItem.reporter_profile_picture && !reporterImageError"
              :src="`${API_BASE_URL}${selectedItem.reporter_profile_picture}`"
              @error="reporterImageError = true"
              class="w-10 h-10 rounded-full object-cover border border-gray-600"
            />
            <div
              v-else
              class="w-10 h-10 rounded-full bg-blue-600 flex items-center justify-center text-white text-sm font-bold"
            >
              {{ selectedItem.reporter_name[0].toUpperCase() }}
            </div>
            <div>
              <p class="font-medium">{{ selectedItem.reporter_name }}</p>
              <p class="text-sm text-gray-400">{{ selectedItem.reporter_email || 'N/A' }}</p>
            </div>
          </div>
          <button
            @click="viewReporterProfile(selectedItem.reporter_id)"
            class="w-full py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition text-sm font-medium"
          >
            View Reporter Profile
          </button>
        </div>

        <div class="mt-6 flex justify-end">
          <button
            @click="closeModal"
            class="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600"
          >
            Close
          </button>
        </div>
      </div>
    </div>

    <!-- Delete Confirmation Modal -->
    <div
      v-if="deleteConfirmation && selectedItem"
      class="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50"
    >
      <div class="bg-gray-900 text-white rounded-xl p-6 w-96 max-h-[90vh] overflow-y-auto border border-gray-700 shadow-lg">
        <h3 class="text-xl font-semibold mb-4">Confirm Deletion</h3>
        <p class="mb-4">Are you sure you want to delete this item?</p>

        <div class="space-y-2">
          <div><strong>Item Name:</strong> {{ selectedItem.name }}</div>
          <div><strong>Category:</strong> {{ selectedItem.category || 'General' }}</div>
          <div><strong>Details:</strong> {{ getItemDetails(selectedItem) }}</div>
          <div class="flex items-center space-x-2">
            <img
              v-if="selectedItem.reporter_profile_picture && !reporterImageError"
              :src="`${API_BASE_URL}${selectedItem.reporter_profile_picture}`"
              @error="reporterImageError = true"
              class="w-8 h-8 rounded-full object-cover border border-gray-600"
            />
            <div
              v-else
              class="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center text-white text-xs font-bold"
            >
              {{ selectedItem.reporter_name ? selectedItem.reporter_name[0].toUpperCase() : '?' }}
            </div>
            <span><strong>Reported By:</strong> {{ selectedItem.reporter_name || 'Anonymous' }}</span>
          </div>
          <div v-if="selectedItem.reporter_email"><strong>Reporter Email:</strong> {{ selectedItem.reporter_email }}</div>
        </div>

        <div class="mt-6 flex justify-end space-x-2">
          <button
            @click="deleteReportConfirmed"
            class="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600"
          >
            Delete
          </button>
          <button
            @click="cancelDelete"
            class="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>

    <!-- User Details Modal -->
    <div
      v-if="selectedUser && userModal"
      class="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50"
    >
      <div class="bg-gray-900 text-white rounded-xl p-6 w-96 max-h-[90vh] overflow-y-auto border border-gray-700 shadow-lg">
        <h3 class="text-xl font-semibold mb-4">User Details</h3>
        <p><strong>Name:</strong> {{ selectedUser.full_name }}</p>
        <p><strong>Email:</strong> {{ selectedUser.email }}</p>
        <p>
          <strong>Role:</strong>
          <span v-if="selectedUser.role === 'security'">Security staff</span>
          <span v-else-if="selectedUser.role === 'admin'">Administrator</span>
          <span v-else>University member</span>
        </p>
        <div class="mt-6 flex justify-end">
          <button
            @click="closeUserModal"
            class="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600"
          >
            Close
          </button>
        </div>
      </div>
    </div>

  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted, watch } from "vue";
import { useRouter } from "vue-router";
import axios from "axios";
import initSocket from "../socket";
import AdminSidebar from '../components/AdminSidebar.vue';
import AdminNavbar from '../components/AdminNavbar.vue';
import DashboardCard from '../components/DashboardCard.vue';

const API_BASE_URL = "http://localhost:5000";
const router = useRouter();

// ====================
// Persisted Page State
// ====================

// Restore activePage from localStorage or default to 'dashboard'
const activePage = ref(localStorage.getItem('admin-active-page') || 'dashboard');

// Restore activeReportTab from localStorage or default to 'Lost Reports'
const activeReportTab = ref(localStorage.getItem('admin-active-report-tab') || 'Lost Reports');

// Auto-save activePage to localStorage
watch(activePage, (newPage) => {
  localStorage.setItem('admin-active-page', newPage);
});

// Auto-save activeReportTab to localStorage
watch(activeReportTab, (newTab) => {
  localStorage.setItem('admin-active-report-tab', newTab);
});

// ====================
// Static Data
// ====================

const reportTabs = ["Lost Reports", "Found Reports", "Returned History"];

const handlePageSelect = (page) => {
  if (page === "profile") {
    router.push("/profile");
    return;
  }

  activePage.value = page;
};

// ====================
// Reported Items
// ====================

const lostItems = ref([]);
const foundItems = ref([]);
const returnedHistory = ref([]);
const reportSearch = ref("");
const categoryFilter = ref("");
const statusFilter = ref("");

// ====================
// Users
// ====================

const users = ref([]);
const userSearch = ref("");
const selectedUser = ref(null);
const userModal = ref(false);
const staffForm = reactive({
  email: "",
  fullName: "",
  department: "",
  contactNumber: "",
});
const staffFormError = ref("");
const staffFormSuccess = ref("");
const staffFormLoading = ref(false);

// ====================
// Shared Modals
// ====================

const selectedItem = ref(null);
const deleteConfirmation = ref(false);
const imageError = ref(false);
const reporterImageError = ref(false);

// ====================
// Socket (shared singleton)
// ====================

const socket = initSocket();

const autoDeletedIds = new Set();

// ====================
// Fetching
// ====================

const fetchItems = async () => {
  try {
    const res = await axios.get(`${API_BASE_URL}/api/items`);
    const rawData = Array.isArray(res.data) ? res.data : [];

    const nextLost = [];
    const nextFound = [];
    const nextReturned = [];

    for (const record of rawData) {
      const item = {
        ...record,
        imageError: false,
        reporterImageError: false,
      };

      const removed = await maybeAutoDeleteReturnedLost(item);
      if (removed) continue;

      if (item.type === "lost") {
        nextLost.push(item);
      }

      if (item.type === "found" && item.status !== "returned") {
        nextFound.push(item);
      }

      if (item.status === "returned") {
        nextReturned.push(item);
      }
    }

    lostItems.value = nextLost;
    foundItems.value = nextFound;
    returnedHistory.value = nextReturned;
  } catch (err) {
    console.error("Error fetching items:", err);
  }
};

const fetchUsers = async () => {
  try {
    const res = await axios.get(`${API_BASE_URL}/api/user`);
    const toRole = (role) => {
      if (!role) return "university_member";
      if (role === "security_staff") return "security";
      return role;
    };

    users.value = res.data.map((u) => ({
      ...u,
      role: toRole(u.role),
    }));
  } catch (err) {
    console.error("Error fetching users:", err);
  }
};

// ====================
// Users Management
// ====================

const filteredUsers = computed(() => {
  if (!userSearch.value) return users.value;
  return users.value.filter(u =>
    u.full_name?.toLowerCase().includes(userSearch.value.toLowerCase()) ||
    u.email?.toLowerCase().includes(userSearch.value.toLowerCase())
  );
});

const viewUser = (user) => {
  selectedUser.value = user;
  userModal.value = true;
};

const closeUserModal = () => {
  userModal.value = false;
  selectedUser.value = null;
};

const deleteUser = async (user) => {
  try {
    const token = localStorage.getItem("token");
    if (!token) {
      console.error("Missing authentication token. Unable to delete user.");
      return;
    }

    await axios.delete(`${API_BASE_URL}/api/user/${user.id}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    users.value = users.value.filter(u => u.id !== user.id);
  } catch (err) {
    console.error("Error deleting user:", err);
  }
};

const resetStaffForm = () => {
  staffForm.email = "";
  staffForm.fullName = "";
  staffForm.department = "";
  staffForm.contactNumber = "";
};

const registerStaff = async () => {
  staffFormError.value = "";
  staffFormSuccess.value = "";

  const token = localStorage.getItem("token");
  if (!token) {
    staffFormError.value = "Authentication expired. Please sign in again.";
    setTimeout(() => {
      staffFormError.value = "";
    }, 4000);
    return;
  }

  const normalizedEmail = staffForm.email.trim().toLowerCase();
  if (!normalizedEmail) {
    staffFormError.value = "Staff email is required.";
    setTimeout(() => {
      staffFormError.value = "";
    }, 4000);
    return;
  }
  if (!normalizedEmail.endsWith("@carsu.edu.ph")) {
    staffFormError.value = "Use a valid @carsu.edu.ph email address.";
    setTimeout(() => {
      staffFormError.value = "";
    }, 4000);
    return;
  }

  staffFormLoading.value = true;

  try {
    const payload = {
      email: normalizedEmail,
      full_name: staffForm.fullName.trim() || undefined,
      department: staffForm.department.trim() || undefined,
      contact_number: staffForm.contactNumber.trim() || undefined,
    };

    const response = await axios.post(
      `${API_BASE_URL}/api/user/staff`,
      payload,
      { headers: { Authorization: `Bearer ${token}` } }
    );

    const createdUser = response.data?.user;
    if (createdUser) {
      const indexById = users.value.findIndex((u) => u.id === createdUser.id);
      if (indexById !== -1) {
        users.value.splice(indexById, 1, createdUser);
      } else {
        const indexByEmail = users.value.findIndex(
          (u) => u.email?.toLowerCase() === createdUser.email?.toLowerCase()
        );
        if (indexByEmail !== -1) {
          users.value.splice(indexByEmail, 1, createdUser);
        } else {
          users.value.unshift(createdUser);
        }
      }
    }

    staffFormSuccess.value = response.data?.message || "Security staff registered.";
    resetStaffForm();
    setTimeout(() => {
      staffFormSuccess.value = "";
    }, 4000);
  } catch (err) {
    const message = err.response?.data?.error || "Failed to register security staff.";
    staffFormError.value = message;
    console.error("Error registering security staff:", err);
    setTimeout(() => {
      staffFormError.value = "";
    }, 5000);
  } finally {
    staffFormLoading.value = false;
  }
};

// ====================
// Reporter Profile Navigation
// ====================

const viewReporterProfile = (reporterId) => {
  if (reporterId) router.push(`/view-profile/${reporterId}`);
};

// ====================
// Item Management
// ====================

const filteredReportItems = computed(() => {
  let items = [];
  if (activeReportTab.value === "Lost Reports") items = lostItems.value;
  else if (activeReportTab.value === "Found Reports") items = foundItems.value;
  else if (activeReportTab.value === "Returned History") items = returnedHistory.value;

  if (reportSearch.value) {
    items = items.filter(i =>
      i.name?.toLowerCase().includes(reportSearch.value.toLowerCase()) ||
      (i.student_id && i.student_id.includes(reportSearch.value))
    );
  }
  if (categoryFilter.value) items = items.filter(i => i.category === categoryFilter.value);
  if (statusFilter.value && activeReportTab.value === "Found Reports") {
    items = items.filter(i => i.status === statusFilter.value);
  }
  return items;
});

const viewItem = (item) => {
  selectedItem.value = item;
  imageError.value = false;
  reporterImageError.value = false;
  deleteConfirmation.value = false;
};

const closeModal = () => selectedItem.value = null;

const confirmDelete = (item) => {
  selectedItem.value = item;
  deleteConfirmation.value = true;
};

const deleteReportConfirmed = async () => {
  try {
    const response = await axios.delete(
      `${API_BASE_URL}/api/items/${selectedItem.value.id}`
    );

    const deletedIds = Array.isArray(response.data?.deleted_ids)
      ? response.data.deleted_ids
      : [selectedItem.value.id];

    deletedIds.forEach((deletedId) => {
      autoDeletedIds.add(deletedId);
      removeItemFromLists(deletedId);
    });

    deleteConfirmation.value = false;
    selectedItem.value = null;
  } catch (err) {
    console.error("Error deleting item:", err);
  }
};

const cancelDelete = () => {
  deleteConfirmation.value = false;
  selectedItem.value = null;
};

const removeItemFromLists = (id) => {
  lostItems.value = lostItems.value.filter(i => i.id !== id);
  foundItems.value = foundItems.value.filter(i => i.id !== id);
  returnedHistory.value = returnedHistory.value.filter(i => i.id !== id);
  if (selectedItem.value?.id === id) selectedItem.value = null;
};

async function maybeAutoDeleteReturnedLost(item) {
  if (!item || item.type !== "lost" || item.status !== "returned") return false;
  if (!item.id || autoDeletedIds.has(item.id)) return false;

  try {
    await axios.delete(`${API_BASE_URL}/api/items/${item.id}`);
    autoDeletedIds.add(item.id);
    removeItemFromLists(item.id);
    return true;
  } catch (err) {
    console.error("Error auto-deleting returned lost item:", err);
    return false;
  }
}

const filteredDetails = computed(() => {
  if (!selectedItem.value) return {};
  const filtered = {};
  for (const [key, value] of Object.entries(selectedItem.value)) {
    if (
      value &&
      ![
        "id",
        "image_url",
        "created_at",
        "reporter_id",
        "reporter_name",
        "reporter_email",
        "reporter_profile_picture",
        "reporterImageError",
        "imageError"
      ].includes(key)
    ) {
      filtered[key] = value;
    }
  }
  return filtered;
});

const getItemDetails = (item) => {
  if (item.category === "id" && item.student_id) return `Student ID: ${item.student_id}`;
  if (item.brand || item.color) return `Brand: ${item.brand || "N/A"}, Color: ${item.color || "N/A"}`;
  return "N/A";
};

const formatDate = (datetime) =>
  new Date(datetime).toLocaleString("en-PH", {
    timeZone: "Asia/Manila",
    year: "numeric",
    month: "short",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });

const formatStatus = (status) =>
  status
    .split("_")
    .map(w => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");

// ====================
// Dashboard Stats
// ====================

const totalReports = computed(() =>
  lostItems.value.length + foundItems.value.length + returnedHistory.value.length
);
const resolvedCount = computed(() =>
  foundItems.value.filter(i => i.status !== "pending").length +
  returnedHistory.value.length
);
const pendingCount = computed(() =>
  lostItems.value.filter(i => i.status === "pending").length +
  foundItems.value.filter(i => i.status === "pending").length
);

// ====================
// Unread Counters
// ====================

const unreadLostCount = ref(0);
const unreadFoundCount = ref(0);
const unreadReturnedCount = ref(0);

const getUnreadCount = (tab) => {
  switch (tab) {
    case "Lost Reports": return unreadLostCount.value;
    case "Found Reports": return unreadFoundCount.value;
    case "Returned History": return unreadReturnedCount.value;
    default: return 0;
  }
};

// ====================
// Real-Time Socket Events
// ====================

socket.on("newReport", async (report) => {
  const item = { ...report, imageError: false, reporterImageError: false };
  if (await maybeAutoDeleteReturnedLost(item)) return;

  if (item.type === "lost") lostItems.value.unshift(item);
  else if (item.type === "found") foundItems.value.unshift(item);
  else if (item.status === "returned") returnedHistory.value.unshift(item);
});

socket.on("reportUpdated", async (updatedReport) => {
  if (await maybeAutoDeleteReturnedLost(updatedReport)) return;

  const normalized = {
    ...updatedReport,
    imageError: false,
    reporterImageError: false,
  };

  removeItemFromLists(normalized.id);

  if (normalized.status === "returned") returnedHistory.value.unshift(normalized);
  else if (normalized.type === "found") foundItems.value.unshift(normalized);
  else lostItems.value.unshift(normalized);
});

socket.on("reportDeleted", ({ id }) => {
  removeItemFromLists(id);
});

// ====================
// Lifecycle
// ====================

onMounted(() => {
  fetchItems();
  fetchUsers();
});
</script>