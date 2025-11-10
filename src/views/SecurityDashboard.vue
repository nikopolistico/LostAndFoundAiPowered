<template>
  <div class="min-h-screen bg-gradient-to-b from-gray-950 via-gray-900 to-gray-955 animate-fade-in">
    <!-- Navbar -->
    <nav
      class="fixed top-0 left-0 w-full bg-gray-900 shadow-md z-50 flex justify-between items-center px-6 h-16"
    >
      <h1 class="text-xl font-semibold text-yellow-400">Security Dashboard</h1>
      <div class="flex items-center gap-4" ref="profileMenuRef">
        <div class="hidden sm:block text-right">
          <p class="font-semibold text-white">{{ securityDisplayName }}</p>
          <p class="text-xs text-gray-400">{{ securityDisplayEmail }}</p>
        </div>
        <button
          @click.stop="toggleProfileMenu"
          class="w-10 h-10 rounded-full bg-yellow-500 text-gray-900 flex items-center justify-center font-semibold border-2 border-yellow-400 overflow-hidden"
        >
          <img
            v-if="securityAvatar"
            :src="securityAvatar"
            alt="Security Avatar"
            class="w-full h-full object-cover"
          />
          <span v-else>{{ securityInitial }}</span>
        </button>
        <div
          v-if="showProfileMenu"
          class="absolute right-6 top-14 w-48 bg-gray-800 rounded-xl shadow-lg border border-gray-700 z-50"
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
    </nav>

    <!-- Main Content -->
    <div class="pt-24 px-6">
      <!-- Tabs with Notification Badges -->
      <div class="flex justify-center mb-6 space-x-4">
        <button
          v-for="tab in tabs"
          :key="tab"
          @click="handleTabChange(tab)"
          class="px-4 py-2 rounded-lg transition relative"
          :class="activeTab === tab
            ? 'bg-yellow-500 text-black'
            : 'bg-gray-800 text-white hover:bg-gray-700'"
        >
          {{ tab }}
          <!-- 🔸 Pending Claims Badge (only on Found Reports) -->
          <span
            v-if="tab === 'Found Reports' && pendingClaimsCount > 0"
            class="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center"
          >
            {{ pendingClaimsCount }}
          </span>
          <!-- 🔸 Other tab badges -->
          <span
            v-else-if="getUnreadCount(tab) > 0"
            class="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center"
          >
            {{ getUnreadCount(tab) }}
          </span>
        </button>
      </div>

      <!-- LOST REPORTS -->
      <div v-if="activeTab === 'Lost Reports'">
        <!-- ... (unchanged) ... -->
        <div class="mb-4 flex justify-between items-center">
          <input
            v-model="lostSearch"
            type="text"
            placeholder="Search by Item Name or Student ID"
            class="px-4 py-2 rounded-lg bg-gray-800 text-white w-64 focus:outline-none"
          />
          <select
            v-model="lostCategoryFilter"
            class="px-4 py-2 rounded-lg bg-gray-800 text-white focus:outline-none"
          >
            <option value="">All Categories</option>
            <option value="id">ID Items</option>
            <option value="general">General Items</option>
          </select>
        </div>

        <div
          v-if="filteredLostItems.length === 0"
          class="border border-gray-700 rounded-lg h-32 flex items-center justify-center text-gray-400 italic bg-gray-900 mb-6"
        >
          No lost reports for now.
        </div>

        <table
          v-else
          class="min-w-full bg-gray-900 text-left text-sm text-gray-300 rounded-lg mb-6 border border-gray-700"
        >
          <thead>
            <tr class="border-b border-gray-700 bg-gray-800 text-gray-300">
              <th class="px-4 py-2">Image</th>
              <th class="px-4 py-2">Name</th>
              <th class="px-4 py-2">Category</th>
              <th class="px-4 py-2">Details</th>
              <th class="px-4 py-2">Date Lost</th>
              <th class="px-4 py-2">Status</th>
              <th class="px-4 py-2">Reported By</th>
              <th class="px-4 py-2">Actions</th>
            </tr>
          </thead>
          <tbody>
            <tr
              v-for="item in filteredLostItems"
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
              <td class="px-4 py-2">
                <span
                  v-if="item.category === 'id' && item.student_id"
                  ><strong>Student ID:</strong> {{ item.student_id }}</span
                >
                <span v-else-if="item.brand || item.color">
                  <span v-if="item.brand"><strong>Brand:</strong> {{ item.brand }}</span>
                  <span v-if="item.color" class="ml-2"
                    ><strong>Color:</strong> {{ item.color }}</span
                  >
                </span>
                <span v-else>N/A</span>
              </td>
              <td class="px-4 py-2">{{ formatDate(item.datetime) }}</td>
              <td class="px-4 py-2">{{ formatStatus(item.status) }}</td>
              <td class="px-4 py-2">
                <div class="flex items-center space-x-2">
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
                </div>
              </td> 
              <td class="px-4 py-2 flex space-x-2">
                <button
                  @click="viewItem(item)"
                  class="px-4 py-2 bg-yellow-500 text-black rounded hover:bg-yellow-600"
                >
                  View
                </button>
                <!-- 'Mark Received' removed from Lost Reports as requested -->
                <template v-if="item.status === 'in_security_custody'">
                  <button
                    @click="openReturnModal(item)"
                    class="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
                  >
                    Mark as Returned
                  </button>
                  <button
                    @click="openClaimsModal(item)"
                    class="px-4 py-2 bg-purple-500 text-white rounded hover:bg-purple-600"
                  >
                    View Claims
                  </button>
                </template>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- FOUND REPORTS -->
      <div v-if="activeTab === 'Found Reports'">
        <!-- ... (unchanged) ... -->
        <div class="mb-4 flex justify-between items-center">
          <input
            v-model="foundSearch"
            type="text"
            placeholder="Search by Item Name or Student ID"
            class="px-4 py-2 rounded-lg bg-gray-800 text-white w-64 focus:outline-none"
          />
          <div class="flex space-x-4">
            <select
              v-model="foundStatusFilter"
              class="px-4 py-2 rounded-lg bg-gray-800 text-white focus:outline-none"
            >
              <option value="">All Status</option>
              <option value="pending">Pending</option>
              <option value="in_security_custody">In Security Custody</option>
            </select>
            <select
              v-model="foundCategoryFilter"
              class="px-4 py-2 rounded-lg bg-gray-800 text-white focus:outline-none"
            >
              <option value="">All Categories</option>
              <option value="id">ID Items</option>
              <option value="general">General Items</option>
            </select>
          </div>
        </div>

        <div
          v-if="filteredFoundItems.length === 0"
          class="border border-gray-700 rounded-lg h-32 flex items-center justify-center text-gray-400 italic bg-gray-900 mb-6"
        >
          No found reports for now.
        </div>

        <table
          v-else
          class="min-w-full bg-gray-900 text-left text-sm text-gray-300 rounded-lg mb-6 border border-gray-700"
        >
          <thead>
            <tr class="border-b border-gray-700 bg-gray-800 text-gray-300">
              <th class="px-4 py-2">Image</th>
              <th class="px-4 py-2">Name</th>
              <th class="px-4 py-2">Category</th>
              <th class="px-4 py-2">Details</th>
              <th class="px-4 py-2">Date Found</th>
              <th class="px-4 py-2">Status</th>
              <th class="px-4 py-2">Reported By</th>
              <th class="px-4 py-2">Actions</th>
            </tr>
          </thead>
          <tbody>
            <tr
              v-for="item in filteredFoundItems"
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
              <td class="px-4 py-2">
                <span
                  v-if="item.category === 'id' && item.student_id"
                  ><strong>Student ID:</strong> {{ item.student_id }}</span
                >
                <span v-else-if="item.brand || item.color">
                  <span v-if="item.brand"><strong>Brand:</strong> {{ item.brand }}</span>
                  <span v-if="item.color" class="ml-2"
                    ><strong>Color:</strong> {{ item.color }}</span
                  >
                </span>
                <span v-else>N/A</span>
              </td>
              <td class="px-4 py-2">{{ formatDate(item.datetime) }}</td>
              <td class="px-4 py-2">{{ formatStatus(item.status) }}</td>
              <td class="px-4 py-2">
                <div class="flex items-center space-x-2">
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
                </div>
              </td>
              <td class="px-4 py-2 flex space-x-2">
                <button
                  @click="viewItem(item)"
                  class="px-4 py-2 bg-yellow-500 text-black rounded hover:bg-yellow-600"
                >
                  View
                </button>
                <button
                  v-if="item.status === 'pending'"
                  @click="openReviewModal(item)"
                  class="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600"
                >
                  Mark Received
                </button>
                <template v-if="item.status === 'in_security_custody'">
                  <button
                    @click="openReturnModal(item)"
                    class="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
                  >
                    Mark as Returned
                  </button>
                  <button
                    @click="openClaimsModal(item)"
                    class="px-4 py-2 bg-purple-500 text-white rounded hover:bg-purple-600"
                  >
                    View Claims
                  </button>
                </template>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- RETURNED HISTORY -->
      <div v-if="activeTab === 'Returned History'">
        <!-- ... (unchanged) ... -->
        <div class="mb-4 flex justify-between items-center">
          <input
            v-model="returnedSearch"
            type="text"
            placeholder="Search by Item Name or Student ID"
            class="px-4 py-2 rounded-lg bg-gray-800 text-white w-64 focus:outline-none"
          />
          <select
            v-model="returnedCategoryFilter"
            class="px-4 py-2 rounded-lg bg-gray-800 text-white focus:outline-none"
          >
            <option value="">All Categories</option>
            <option value="id">ID Items</option>
            <option value="general">General Items</option>
          </select>
        </div>

        <div
          v-if="filteredReturnedHistory.length === 0"
          class="border border-gray-700 rounded-lg h-32 flex items-center justify-center text-gray-400 italic bg-gray-900 mb-6"
        >
          No returned items yet.
        </div>

        <table
          v-else
          class="min-w-full bg-gray-900 text-left text-sm text-gray-300 rounded-lg mb-6 border border-gray-700"
        >
          <thead>
            <tr class="border-b border-gray-700 bg-gray-800 text-gray-300">
              <th class="px-4 py-2">Image</th>
              <th class="px-4 py-2">Name</th>
              <th class="px-4 py-2">Category</th>
              <th class="px-4 py-2">Return Date</th>
              <th class="px-4 py-2">Status</th>
              <th class="px-4 py-2">Reported By</th>
              <th class="px-4 py-2">Actions</th>
            </tr>
          </thead>
          <tbody>
            <tr
              v-for="item in filteredReturnedHistory"
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
              <td class="px-4 py-2">{{ formatDate(item.return_date) }}</td>
              <td class="px-4 py-2">{{ formatStatus(item.status) }}</td>
              <td class="px-4 py-2">
                <div class="flex items-center space-x-2">
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
                </div>
              </td>
              <td class="px-4 py-2">
                <button
                  @click="viewItem(item)"
                  class="px-4 py-2 bg-yellow-500 text-black rounded hover:bg-yellow-600"
                >
                  View Details
                </button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- Modals (unchanged) -->
      <!-- VIEW MODAL, CLAIMS MODAL, REVIEW MODAL, RETURN MODAL -->
      <!-- ... (keep all modals exactly as they were) ... -->

      <!-- VIEW MODAL -->
      <div
        v-if="selectedItem"
        class="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50"
      >
        <div
          class="bg-gray-900 text-white rounded-xl p-6 w-96 max-h-[90vh] overflow-y-auto border border-gray-700 shadow-lg"
        >
          <h3 class="text-xl font-semibold mb-4">Item Details</h3>
          <img
            v-if="selectedItem.image_url && !imageError"
            :src="`${API_BASE_URL}${selectedItem.image_url}`"
            @error="imageError = true"
            class="w-full h-48 object-cover rounded mb-4"
          />
          <div
            v-else
            class="w-full h-48 bg-gray-800 flex items-center justify-center rounded mb-4 text-gray-500"
          >
            N/A
          </div>
          <div class="space-y-1">
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
                <p class="text-sm text-gray-400">{{ selectedItem.reporter_email }}</p>
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

      <!-- CLAIMS MODAL -->
      <div
        v-if="claimModalItem"
        class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
      >
        <div class="bg-gray-900 text-white rounded-lg p-6 w-96 border border-gray-700">
          <h3 class="text-xl font-semibold mb-4">Claim Requests - {{ claimModalItem.name }}</h3>

          <div class="text-sm text-gray-400 mb-2">Item ID: <span class="text-xs text-gray-300">{{ claimModalItem.id }}</span></div>

          <div v-if="claimRequests.length === 0" class="text-gray-400 italic mb-4">
            No claims submitted for this item.
          </div>

          <div v-for="claim in claimRequests" :key="claim.claim_id" class="border-b border-gray-700 py-2">
            <div class="flex justify-between items-start">
              <div>
                <p v-if="claim.claimant_name"><strong>Claimant:</strong> {{ claim.claimant_name || 'Unknown claimant' }}</p>
                <p v-if="claim.claimant_email" class="text-sm text-gray-400">Email: {{ claim.claimant_email }}</p>
                <p v-if="claim.claimant_contact" class="text-sm text-gray-400">Contact: {{ claim.claimant_contact }}</p>
                <p v-if="claim.claimant_department" class="text-sm text-gray-400">Department: {{ claim.claimant_department }}</p>
                <p class="text-sm text-gray-400">Requested: {{ formatDate(claim.created_at) }}</p>
                <p class="text-sm text-gray-400 mt-1">
                  <strong>Status:</strong>
                  <span
                    :class="['ml-2 inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold border', claimStatusClass(claim.status)]"
                  >
                    {{ formatClaimStatus(claim.status) }}
                  </span>
                </p>
              </div>
              <div class="flex space-x-2">
                <button
                  @click="approveClaim(claim)"
                  :disabled="claim.status === 'approved' || claim.status === 'rejected'"
                  :class="[
                    'px-3 py-1 rounded text-sm transition',
                    claim.status === 'approved' || claim.status === 'rejected'
                      ? 'bg-green-600 text-white opacity-60 cursor-not-allowed'
                      : 'bg-green-500 text-white hover:bg-green-600'
                  ]"
                >
                  {{ claim.status === 'approved' ? 'Approved' : 'Approve' }}
                </button>
                <button
                  @click="rejectClaim(claim)"
                  :disabled="claim.status === 'approved' || claim.status === 'rejected'"
                  :class="[
                    'px-3 py-1 rounded text-sm transition',
                    claim.status === 'approved' || claim.status === 'rejected'
                      ? 'bg-red-600 text-white opacity-60 cursor-not-allowed'
                      : 'bg-red-500 text-white hover:bg-red-600'
                  ]"
                >
                  {{ claim.status === 'rejected' ? 'Rejected' : 'Reject' }}
                </button>
              </div>
            </div>
            <div v-if="claim.message" class="mt-2 p-2 bg-gray-800 rounded text-sm text-gray-300">
              <strong>Claimant message:</strong>
              <span class="whitespace-pre-line"> {{ claim.message }} </span>
            </div>
          </div>

          <div class="mt-6 flex justify-end">
            <button
              @click="claimModalItem = null"
              class="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700"
            >
              Close
            </button>
          </div>

          <!-- DEBUG: raw response (for debugging only) -->
          <div v-if="claimRequests && claimRequests.length >= 0" class="mt-4 text-xs text-gray-500">
            <details>
              <summary class="cursor-pointer text-gray-400">Debug: raw claims JSON</summary>
              <pre class="text-xs text-gray-300 p-2 bg-gray-800 rounded mt-2 overflow-auto" style="max-height:200px">{{ JSON.stringify(claimRequests, null, 2) }}</pre>
            </details>
          </div>
        </div>
      </div>

      <!-- REVIEW MODAL -->
      <div
        v-if="reviewItem"
        class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
      >
        <div class="bg-gray-900 text-white rounded-lg p-6 w-96 border border-gray-700">
          <h3 class="text-xl font-semibold mb-4">Confirm Item Received</h3>
          <p><strong>Name:</strong> {{ reviewItem.name }}</p>
          <p><strong>Status:</strong> {{ formatStatus(reviewItem.status) }}</p>

          <div class="mt-6 flex justify-end space-x-2">
            <button
              @click="reviewItem = null"
              class="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600"
            >
              Cancel
            </button>
            <button
              @click="confirmReceived"
              class="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600"
            >
              Confirm Received
            </button>
          </div>
        </div>
      </div>

      <!-- RETURN MODAL -->
      <div
        v-if="returnItem"
        class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
      >
        <div class="bg-gray-900 text-white rounded-lg p-6 w-96 border border-gray-700">
          <h3 class="text-xl font-semibold mb-4">Return Item to Owner</h3>
          <p><strong>Name:</strong> {{ returnItem.name }}</p>
          <p><strong>Category:</strong> {{ returnItem.category || "General" }}</p>
          <p><strong>Status:</strong> {{ formatStatus(returnItem.status) }}</p>
          <p class="mt-4 text-yellow-400 text-sm">
            ⚠️ This item will be officially marked as
            <strong>returned to the owner</strong>.
          </p>

          <div class="mt-6 flex justify-end space-x-2">
            <button
              @click="returnItem = null"
              class="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700"
            >
              Cancel
            </button>
            <button
              @click="confirmReturn"
              class="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
            >
              Confirm Return
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted, nextTick, watch } from "vue";
import { useRouter } from "vue-router";
import axios from "axios";
import initSocket, { disconnectSocket } from "../socket";

const API_BASE_URL = "http://localhost:5000";
const router = useRouter();

const socket = initSocket();

const tabs = ["Lost Reports", "Found Reports", "Returned History"];
const activeTab = ref(localStorage.getItem('security-active-tab') || 'Lost Reports');
watch(activeTab, (newTab) => {
  localStorage.setItem('security-active-tab', newTab);
});

const lostItems = ref([]);
const foundItems = ref([]);
const returnedHistory = ref([]);

// Search / Filter state
const lostSearch = ref("");
const lostCategoryFilter = ref("");
const foundSearch = ref("");
const foundStatusFilter = ref("");
const foundCategoryFilter = ref("");
const returnedSearch = ref("");
const returnedCategoryFilter = ref("");

// Modal and UI state
const claimModalItem = ref(null);
const selectedItem = ref(null);
const reviewItem = ref(null);
const returnItem = ref(null);
const imageError = ref(false);
const reporterImageError = ref(false);
const newItemIds = ref([]);

// Unread counters
const unreadLostCount = ref(0);
const unreadFoundCount = ref(0);
const unreadReturnedCount = ref(0);

const securityUser = ref(null);
const showProfileMenu = ref(false);
const profileMenuRef = ref(null);

const securityDisplayName = computed(() => {
  if (!securityUser.value) return "Security Staff";
  return (
    securityUser.value.full_name ||
    securityUser.value.email?.split("@")[0] ||
    "Security Staff"
  );
});

const securityDisplayEmail = computed(
  () => securityUser.value?.email || "security@example.com"
);

const securityAvatar = computed(() => {
  const path = securityUser.value?.profile_picture;
  if (!path) return "";
  return path.startsWith("http") ? path : `${API_BASE_URL}${path}`;
});

const securityInitial = computed(() => securityDisplayName.value.charAt(0).toUpperCase());

const toggleProfileMenu = () => {
  showProfileMenu.value = !showProfileMenu.value;
};

const handleProfileMenuOutside = (event) => {
  if (!profileMenuRef.value) return;
  if (!profileMenuRef.value.contains(event.target)) {
    showProfileMenu.value = false;
  }
};

const goToProfile = () => {
  showProfileMenu.value = false;
  router.push("/profile");
};

// Fetch items from backend and populate lists
const fetchItems = async () => {
  try {
    const res = await axios.get(`${API_BASE_URL}/api/items`);
    const data = Array.isArray(res.data) ? res.data.map(i => ({ ...i, imageError: false, reporterImageError: false })) : [];
    lostItems.value = data.filter(i => i.type === "lost");
    foundItems.value = data.filter(i => i.type === "found" && i.status !== "returned");
    returnedHistory.value = data.filter(i => i.status === "returned");
  } catch (err) {
    console.error("Error fetching items:", err);
  }
};

const formatDate = (datetime) => {
  if (!datetime) return "N/A";
  const parsed = new Date(datetime);
  if (Number.isNaN(parsed.getTime())) return "N/A";

  return parsed.toLocaleString("en-PH", {
    timeZone: "Asia/Manila",
    year: "numeric",
    month: "short",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });
};

const formatStatus = (status) =>
  (status || "").split("_").map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(" ");

const formatClaimStatus = (status) => {
  const safe = (status ? String(status) : "pending")
    .replace(/\s+/g, "_")
    .toLowerCase();

  return safe
    .split("_")
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ") || "Pending";
};

const claimStatusClass = (status) => {
  const normalized = (status || "pending").toString().toLowerCase();
  switch (normalized) {
    case "approved":
      return "bg-green-500/20 border-green-500/40 text-green-300";
    case "rejected":
      return "bg-red-500/20 border-red-500/40 text-red-300";
    default:
      return "bg-yellow-500/20 border-yellow-500/40 text-yellow-300";
  }
};

// 🔸 NEW: Pending claims counter
const pendingClaimsCount = ref(0);

const claimRequests = ref([]);

const normalizeClaim = (raw = {}) => {
  const normalized = { ...raw };

  normalized.claim_id =
    raw.claim_id || raw.id || raw.claimId || normalized.claim_id || null;
  normalized.user_id =
    raw.user_id || raw.claimant_id || raw.userId || normalized.user_id || null;
  normalized.notification_id =
    raw.notification_id || raw.notificationId || normalized.notification_id || null;

  const timestamp =
    raw.created_at ||
    raw.requested_at ||
    raw.createdAt ||
    raw.requestedAt ||
    normalized.created_at ||
    normalized.requested_at ||
    null;
  normalized.created_at = timestamp || new Date().toISOString();

  normalized.status = raw.status || raw.user_claim_status || normalized.status || "pending";

  normalized.message =
    raw.claimant_message ??
    raw.message ??
    raw.claimantMessage ??
    raw.notes ??
    normalized.message ??
    null;

  normalized.claimant_name =
    raw.claimant_name ||
    raw.user_name ||
    raw.claimant_full_name ||
    raw.full_name ||
    raw.name ||
    normalized.claimant_name ||
    "Unknown claimant";

  normalized.claimant_email =
    raw.claimant_email || raw.user_email || raw.email || normalized.claimant_email || null;

  normalized.claimant_contact =
    raw.claimant_contact ||
    raw.user_contact ||
    raw.contact_number ||
    raw.contact ||
    normalized.claimant_contact ||
    null;

  normalized.claimant_department =
    raw.claimant_department ||
    raw.department ||
    raw.user_department ||
    normalized.claimant_department ||
    null;

  normalized.claimed_item_id =
    raw.claimed_item_id || raw.item_id || raw.itemId || normalized.claimed_item_id || null;

  const relatedCandidates = [
    normalized.claimed_item_id,
    raw.lost_item_id || raw.lostItemId,
    raw.found_item_id || raw.foundItemId,
    raw.notification_item_id || raw.notificationItemId,
    raw.notification_matched_item_id || raw.notificationMatchedItemId,
  ].filter(Boolean);

  if (Array.isArray(raw.related_item_ids)) {
    relatedCandidates.push(...raw.related_item_ids.filter(Boolean));
  }

  normalized.related_item_ids = Array.from(new Set(relatedCandidates));

  return normalized;
};
const openClaimsModal = async (item) => {
  claimModalItem.value = item;
  claimRequests.value = [];
  try {
    // Primary fetch: item-specific claims
    const res = await axios.get(
      `${API_BASE_URL}/api/claims/item/${encodeURIComponent(item.id)}`
    );

    const rows = Array.isArray(res.data) ? res.data : [];
    claimRequests.value = rows.map((row) => normalizeClaim(row));

    if (claimRequests.value.length > 0) return;
  } catch (err) {
    console.error(
      "Error fetching claims via item endpoint:",
      err?.response?.data || err.message || err
    );
  }

  try {
    // Fallback: fetch all claims and filter (ensures older data still appears)
    const allRes = await axios.get(`${API_BASE_URL}/api/claims/security/all`);
    const normalizedAll = (Array.isArray(allRes.data) ? allRes.data : []).map((row) =>
      normalizeClaim(row)
    );

    const filtered = normalizedAll.filter((claim) => {
      if (claim.related_item_ids?.length) {
        return claim.related_item_ids.some(
          (candidate) => String(candidate) === String(item.id)
        );
      }
      return String(claim.claimed_item_id) === String(item.id);
    });

    if (filtered.length === 0) {
      console.warn(
        "No claims found for item after fallback filter",
        item.id,
        allRes.data
      );
    }

    claimRequests.value = filtered;
  } catch (err) {
    console.error(
      "Error fetching claims via fallback endpoint:",
      err?.response?.data || err.message || err
    );
    claimRequests.value = [];
  }
};
    

const approveClaim = async (claim) => {
  if (!claim || claim.status === "approved") return;
  if (!confirm("Approve this claim? The user will be notified.")) return;

  const wasPending = !claim.status || claim.status === "pending";

  try {
    await axios.put(`${API_BASE_URL}/api/claims/${claim.claim_id}/approve`);

    const idx = claimRequests.value.findIndex(
      (c) => c.claim_id === claim.claim_id
    );
    if (idx !== -1) {
      const updated = {
        ...claimRequests.value[idx],
        status: "approved",
      };
      claimRequests.value[idx] = updated;
      claim.status = updated.status;
    }
    if (wasPending && pendingClaimsCount.value > 0) {
      pendingClaimsCount.value--;
    }

    alert("✅ Claim approved.");
  } catch (err) {
    console.error("Error approving claim:", err);
    alert("❌ Failed to approve claim.");
  }
};

const rejectClaim = async (claim) => {
  if (!claim || claim.status === "rejected") return;
  if (!confirm("Reject this claim?")) return;

  const wasPending = !claim.status || claim.status === "pending";

  try {
    await axios.put(`${API_BASE_URL}/api/claims/${claim.claim_id}/reject`);

    const idx = claimRequests.value.findIndex(
      (c) => c.claim_id === claim.claim_id
    );
    if (idx !== -1) {
      const updated = {
        ...claimRequests.value[idx],
        status: "rejected",
      };
      claimRequests.value[idx] = updated;
      claim.status = updated.status;
    }
    if (wasPending && pendingClaimsCount.value > 0) {
      pendingClaimsCount.value--;
    }

    alert("❌ Claim rejected.");
  } catch (err) {
    console.error("Error rejecting claim:", err);
    alert("❌ Failed to reject claim.");
  }
};

const highlightNewItem = async (id) => {
  newItemIds.value.push(id);
  await nextTick();
  setTimeout(() => {
    newItemIds.value = newItemIds.value.filter((i) => i !== id);
  }, 5000);
};

const handleNewReport = (newReport) => {
  const reportWithFlags = {
    ...newReport,
    imageError: false,
    reporterImageError: false,
  };

  if (Notification.permission === "granted") {
    new Notification("🆕 New Report", {
      body: `${newReport.type === "lost" ? "Lost" : "Found"}: ${newReport.name}`,
      icon: newReport.image_url ? `${API_BASE_URL}${newReport.image_url}` : undefined,
    });
  }

  const exists =
    lostItems.value.some((i) => i.id === newReport.id) ||
    foundItems.value.some((i) => i.id === newReport.id) ||
    returnedHistory.value.some((i) => i.id === newReport.id);
  if (exists) return;

  if (newReport.type === "lost") {
    lostItems.value.unshift(reportWithFlags);
    unreadLostCount.value++;
    highlightNewItem(newReport.id);
  } else if (newReport.type === "found") {
    if (newReport.status === "returned") {
      returnedHistory.value.unshift(reportWithFlags);
      unreadReturnedCount.value++;
      highlightNewItem(newReport.id);
    } else {
      foundItems.value.unshift(reportWithFlags);
      unreadFoundCount.value++;
      highlightNewItem(newReport.id);
    }
  }
};

socket.on("reportUpdated", (updatedReport) => {
  const lists = [lostItems.value, foundItems.value, returnedHistory.value];
  lists.forEach((list) => {
    const idx = list.findIndex((item) => item.id === updatedReport.id);
    if (idx !== -1) list.splice(idx, 1);
  });

  if (updatedReport.status === "returned") {
    returnedHistory.value.unshift(updatedReport);
  } else if (updatedReport.type === "found") {
    foundItems.value.unshift(updatedReport);
  } else if (updatedReport.type === "lost") {
    lostItems.value.unshift(updatedReport);
  }
});

socket.on("refreshDashboard", fetchItems);

// 🔸 UPDATED: newClaimRequest listener with counter
socket.on("newClaimRequest", (claimData) => {
  // 🔸 Increment pending claims counter
  pendingClaimsCount.value++;

  // Desktop notification
  if (Notification.permission === "granted") {
    new Notification("🆕 New Claim", {
      body: `New claim for: ${claimData.item_name}`,
    });
  }

  // Add to modal if open
  if (claimModalItem.value && claimModalItem.value.id === claimData.item_id) {
    claimRequests.value.push(
      normalizeClaim({ ...claimData, status: claimData.status || 'pending' })
    );
  }
});

const getUnreadCount = (tabName) => {
  switch (tabName) {
    case "Lost Reports":
      return unreadLostCount.value;
    case "Found Reports":
      return unreadFoundCount.value;
    case "Returned History":
      return unreadReturnedCount.value;
    default:
      return 0;
  }
};

const resetUnreadCount = (tabName) => {
  switch (tabName) {
    case "Lost Reports":
      unreadLostCount.value = 0;
      break;
    case "Found Reports":
      unreadFoundCount.value = 0;
      // 🔸 Also reset pending claims when tab is viewed
      pendingClaimsCount.value = 0;
      break;
    case "Returned History":
      unreadReturnedCount.value = 0;
      break;
  }
};

const handleTabChange = (newTab) => {
  activeTab.value = newTab;
  resetUnreadCount(newTab);
};

const confirmReceived = async () => {
  if (!reviewItem.value) return;
  try {
    const res = await axios.put(`${API_BASE_URL}/api/items/${reviewItem.value.id}`, {
      status: "in_security_custody",
    });
    socket.emit("updateReport", res.data);
    reviewItem.value = null;
  } catch (err) {
    console.error("Error marking received:", err);
    alert("Failed to update item status. Please try again.");
  }
};

const confirmReturn = async () => {
  if (!returnItem.value) return;

  const item = returnItem.value;
  const itemId = item.id;
  const isLostItem = String(item.type || "").toLowerCase() === "lost";

  try {
    const res = await axios.put(`${API_BASE_URL}/api/items/${itemId}`, {
      status: "returned",
      return_date: new Date().toISOString(),
    });

    socket.emit("updateReport", res.data);

    if (isLostItem) {
      await axios.delete(`${API_BASE_URL}/api/items/${itemId}`);
    }

    await fetchItems();
    alert("✅ Item marked as returned.");
  } catch (err) {
    console.error("Error marking as returned:", err);
    alert("Failed to mark item as returned. Please try again.");
  } finally {
    returnItem.value = null;
  }
};

onMounted(() => {
  try {
    const storedUser = JSON.parse(localStorage.getItem("user") || "null");
    if (storedUser?.role === "security" || storedUser?.role === "admin") {
      securityUser.value = storedUser;
    }
  } catch (err) {
    console.error("Failed to parse security user from storage:", err);
  }

  document.addEventListener("click", handleProfileMenuOutside);
  fetchItems();

  socket.on("newReport", handleNewReport);

  // Listen for claim status updates emitted when a user claims via notification
  socket.on("claimStatusUpdated", (payload) => {
    try {
      pendingClaimsCount.value++;

      if (Notification.permission === "granted") {
        new Notification("🆕 Claim Request", {
          body: `Claim for: ${payload.item_id}`,
        });
      }

      // If the modal for this item is open, add claimant info to the modal list
      if (claimModalItem.value && claimModalItem.value.id === payload.item_id) {
        claimRequests.value.push(
          normalizeClaim({
            ...payload,
            status: payload.user_claim_status || payload.status || 'pending',
            created_at: payload.requested_at || payload.created_at || new Date().toISOString(),
          })
        );
      }
    } catch (e) {
      console.error('Error handling claimStatusUpdated socket event', e);
    }
  });

  if (Notification.permission !== "denied") {
    Notification.requestPermission();
  }
  // Fetch initial pending claims count for badge
  (async () => {
    try {
      const res = await axios.get(`${API_BASE_URL}/api/claims/pending/count`);
      pendingClaimsCount.value = res.data?.pending_count || 0;
    } catch (err) {
      console.error('Failed to fetch pending claims count:', err);
    }
  })();
});

onUnmounted(() => {
  socket.off("newReport", handleNewReport);
  socket.off("reportUpdated");
  socket.off("refreshDashboard");
  socket.off("newClaimRequest");
  document.removeEventListener("click", handleProfileMenuOutside);
  // Do NOT disconnect the shared socket here; just remove listeners.
});

// Filters (unchanged)
const filteredLostItems = computed(() => {
  let items = lostItems.value;
  if (lostSearch.value)
    items = items.filter(
      (i) =>
        i.name?.toLowerCase().includes(lostSearch.value.toLowerCase()) ||
        (i.student_id && i.student_id.includes(lostSearch.value))
    );
  if (lostCategoryFilter.value)
    items = items.filter((i) => i.category === lostCategoryFilter.value);
  return items;
});

const filteredFoundItems = computed(() => {
  let items = foundItems.value;
  if (foundStatusFilter.value)
    items = items.filter((i) => i.status === foundStatusFilter.value);
  if (foundSearch.value)
    items = items.filter(
      (i) =>
        i.name?.toLowerCase().includes(foundSearch.value.toLowerCase()) ||
        (i.student_id && i.student_id.includes(foundSearch.value))
    );
  if (foundCategoryFilter.value)
    items = items.filter((i) => i.category === foundCategoryFilter.value);
  return items;
});

const filteredReturnedHistory = computed(() => {
  let items = returnedHistory.value;
  if (returnedSearch.value)
    items = items.filter(
      (i) =>
        i.name?.toLowerCase().includes(returnedSearch.value.toLowerCase()) ||
        (i.student_id && i.student_id.includes(returnedSearch.value))
    );
  if (returnedCategoryFilter.value)
    items = items.filter((i) => i.category === returnedCategoryFilter.value);
  return items;
});

const filteredDetails = computed(() => {
  if (!selectedItem.value) return {};
  const filtered = {};
  for (const [key, value] of Object.entries(selectedItem.value)) {
    if (
      value &&
      value !== "N/A" &&
      ![
        "id",
        "image_url",
        "created_at",
        "imageError",
        "reporter_id",
        "reporter_name",
        "reporter_email",
        "reporter_profile_picture",
        "reporterImageError",
      ].includes(key)
    ) {
      filtered[key] = value;
    }
  }
  return filtered;
});

const viewItem = (item) => {
  selectedItem.value = item;
  imageError.value = false;
  reporterImageError.value = false;
};

const closeModal = () => {
  selectedItem.value = null;
  claimModalItem.value = null;
};

const openReviewModal = (item) => (reviewItem.value = item);
const openReturnModal = (item) => (returnItem.value = item);

const viewReporterProfile = (reporterId) => {
  if (reporterId) router.push(`/view-profile/${reporterId}`);
};

const logout = () => {
  showProfileMenu.value = false;
  disconnectSocket();
  localStorage.clear();
  router.push("/login");
};
</script>

<style scoped>
/* ... (keep all existing styles unchanged) ... */
.animate-fade-in {
  animation: fadeIn 0.6s ease-in-out;
}

@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

.new-report-highlight {
  animation: highlightFlash 1.5s ease-in-out;
  box-shadow: 0 0 20px 4px rgba(0, 255, 100, 0.4);
  border: 2px solid rgba(0, 255, 100, 0.6);
  border-radius: 12px;
  transition: all 0.3s ease;
}

@keyframes highlightFlash {
  0% { background-color: rgba(0, 255, 100, 0.1); transform: scale(1.02); }
  50% { background-color: rgba(0, 255, 100, 0.25); transform: scale(1.05); }
  100% { background-color: transparent; transform: scale(1); }
}

.notification-badge {
  position: absolute;
  top: -6px;
  right: -6px;
  background-color: #ef4444;
  color: white;
  font-size: 0.7rem;
  font-weight: bold;
  border-radius: 50%;
  width: 18px;
  height: 18px;
  display: flex;
  align-items: center;
  justify-content: center;
  animation: popIn 0.4s ease-in-out;
  box-shadow: 0 0 8px rgba(255, 0, 0, 0.4);
}

@keyframes popIn {
  0% { transform: scale(0); opacity: 0; }
  80% { transform: scale(1.2); opacity: 1; }
  100% { transform: scale(1); }
}

.report-card {
  transition: transform 0.2s ease, box-shadow 0.2s ease;
}
.report-card:hover {
  transform: translateY(-3px);
  box-shadow: 0 0 12px rgba(0, 255, 150, 0.3);
}

.image-placeholder {
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(75, 85, 99, 0.2);
  color: #9ca3af;
  font-size: 0.9rem;
  font-style: italic;
  border-radius: 0.5rem;
}

.modal-fade {
  animation: modalFadeIn 0.4s ease;
}
@keyframes modalFadeIn {
  from { opacity: 0; transform: scale(0.97); }
  to { opacity: 1; transform: scale(1); }
}
</style>