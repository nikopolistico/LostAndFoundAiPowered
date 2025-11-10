<template>
  <div
    class="relative min-h-screen overflow-y-auto bg-gray-950 flex flex-col items-center pb-24 pt-20"
  >
    <!-- Top-Right Profile & Notification -->
    <div class="absolute top-6 right-6 flex items-center space-x-4">
      <!-- Notification Icon -->
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
              <p
                v-if="notif.display_description"
                class="text-sm text-yellow-800/80"
              >
                {{ notif.display_description }}
              </p>
              <p v-if="notif.created_at" class="text-xs text-yellow-700 mt-1">
                {{ notif.created_at }}
              </p>
              <div class="flex items-start gap-2 mt-2">
                <img
                  v-if="notif.display_image"
                  :src="notif.display_image"
                  alt="Matched item"
                  class="w-10 h-10 object-cover rounded border"
                />
                <div class="text-sm">
                  <p><strong>{{ notif.display_name }}</strong></p>
                  <p v-if="notif.display_student_id">
                    ID: {{ notif.display_student_id }}
                  </p>
                  <p>Location: {{ notif.matched_location || "N/A" }}</p>
                </div>
              </div>
              <button
                @click="viewMatchDetails(notif)"
                class="mt-3 px-3 py-1 text-xs rounded bg-yellow-400 text-black font-semibold hover:bg-yellow-500 transition"
              >
                I want to claim this item
              </button>
            </li>
          </ul>

          <div v-else class="p-4 text-yellow-900 text-center">
            No new notifications.
          </div>
        </div>
      </div>

      <!-- Profile Button -->
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
          class="absolute right-0 mt-2 w-48 bg-black-700 rounded-xl shadow-lg z-50"
        >
          <ul>
            <li>
              <button
                @click="goToProfile"
                class="w-full text-left px-4 py-2 hover:bg-gray-700 flex items-center space-x-2"
              >
                <svg
                  class="w-5 h-5 text-blue-600"
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
                <span>Go to Profile</span>
              </button>
            </li>
            <li>
              <button
                @click="logout"
                class="w-full px-4 py-2 flex items-center gap-2 text-red-500 hover:bg-gray-700 transition"
              >
                <svg
                  class="w-5 h-5"
                  aria-hidden="true"
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill="none"
                >
                  <path
                    stroke="currentColor"
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M16 12h4M4 18v-1a3 3 0 0 1 3-3h4a3 3 0 0 1 3 3v1a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1Zm8-10a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z"
                  />
                </svg>
                <span class="text-white">Logout</span>
              </button>
            </li>
          </ul>
        </div>
      </div>
    </div>

    <!-- Dashboard Title -->
    <h1 class="text-3xl font-semibold mb-10 mt-16 text-yellow-400">
      User Dashboard
    </h1>

    <div
      v-if="claimResultMessage"
      class="mb-6 max-w-2xl w-full px-4 py-3 rounded-lg bg-green-600/20 border border-green-500 text-green-200 text-sm"
    >
      {{ claimResultMessage }}
    </div>

    <!-- Dashboard Sections -->
    <div class="grid grid-cols-1 md:grid-cols-2 gap-8 w-full max-w-6xl px-6">
      <div class="bg-gray-900 rounded-xl p-6 shadow-lg">
        <h2 class="text-lg font-semibold text-white mb-4">Pending Reports</h2>
        <ul>
          <li
            v-for="(report, index) in reports"
            :key="index"
            class="text-gray-300 py-2 border-b border-gray-800"
          >
            {{ report.type }}: {{ report.name }} - {{ report.status }}
          </li>
        </ul>
      </div>

      <div class="bg-gray-900 rounded-xl p-6 shadow-lg">
        <h2 class="text-lg font-semibold text-white mb-4">Claimed Items</h2>
        <ul>
          <li
            v-for="(item, index) in claimedItems"
            :key="index"
            class="text-gray-300 py-2 border-b border-gray-800"
          >
            {{ item.type }}: {{ item.name }} - {{ item.user_claim_status }}
          </li>
        </ul>
      </div>
    </div>

    <!-- File a Report & Search Option -->
    <div class="flex flex-col md:flex-row gap-4 mt-10 w-full max-w-sm">
      <button
        @click="$router.push('/report')"
        class="w-full py-3 rounded-xl bg-yellow-500 text-black font-semibold hover:bg-yellow-600 transition"
      >
        File a Report
      </button>

      <button
        @click="$router.push('/search')"  
        class="w-full py-3 rounded-xl bg-blue-500 text-white font-semibold hover:bg-blue-600 transition"
      >
        Search by Image
      </button>
    </div>

    <!-- 🟩 UPDATED Match Details Modal -->
    <div
      v-if="selectedMatch"
      class="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50 p-4"
    >
      <div class="bg-white rounded-xl max-w-md w-full overflow-hidden shadow-2xl">
        <div class="p-5">
          <h3 class="text-xl font-bold text-gray-800 mb-3">Match Found!</h3>
          <p class="text-gray-600 mb-2">{{ selectedMatch.message }}</p>
          <p
            v-if="selectedMatch.display_description"
            class="text-sm text-gray-500 mb-3"
          >
            {{ selectedMatch.display_description }}
          </p>

          <div class="flex flex-col items-center mb-4">
            <img
              v-if="selectedMatch.display_image"
              :src="selectedMatch.display_image"
              alt="Matched item"
              class="w-32 h-32 object-cover rounded-lg border mb-3"
            />
            <p class="font-semibold text-gray-800">
              {{ selectedMatch.display_name }}
            </p>
            <p
              v-if="selectedMatch.display_student_id"
              class="text-gray-600"
            >
              Student ID: {{ selectedMatch.display_student_id }}
            </p>
            <p class="text-sm text-gray-500">
              Location: {{ selectedMatch.matched_location || "N/A" }}
            </p>
            <p class="text-sm text-gray-500">
              Status: {{ selectedMatchStatusLabel }}
            </p>
            <p
              v-if="claimStatusNotice"
              class="mt-2 text-sm text-red-500"
            >
              {{ claimStatusNotice }}
            </p>
          </div>

          <!-- 🟩 Claim Item Button -->
          <div class="flex justify-center mb-3">
            <button
              @click="openClaimModal(selectedMatch)"
              :disabled="claimButtonDisabled"
              class="px-5 py-2 rounded-lg font-semibold transition"
              :class="
                claimButtonDisabled
                  ? 'bg-gray-500 text-white cursor-not-allowed opacity-70'
                  : 'bg-green-600 hover:bg-green-700 text-white'
              "
            >
              {{ claimButtonCta }}
            </button>
          </div>

          <p class="text-center text-sm text-gray-500 mb-1">
            Ready to submit a claim request to the security office?
          </p>

          <p class="text-xs text-gray-500 text-center">
            This item is currently in the Security Office.
          </p>
        </div>

        <div class="bg-gray-50 px-5 py-3 text-right">
          <button
            @click="closeMatchModal"
            class="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition"
          >
            Close
          </button>
        </div>
      </div>
    </div>

    <!-- 🟩 Claim Submission Modal -->
    <div
      v-if="showClaimModal"
      class="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50 p-4"
    >
      <div class="bg-white rounded-xl max-w-md w-full overflow-hidden shadow-2xl">
        <div class="p-5">
          <h3 class="text-xl font-bold text-gray-800 mb-3">Submit Claim Request</h3>
          <p class="text-gray-600 mb-4">
            You are about to submit a claim for <strong>{{ selectedMatch.display_name }}</strong>.
            Share a quick note below so security can verify your request, then confirm to send the claim to the Security Office.
          </p>

          <textarea
            v-model="claimMessage"
            rows="3"
            placeholder="Optional: e.g., 'I can describe the unique scratch on the back.'"
            class="w-full p-2 border rounded-lg mb-4"
          ></textarea>

          <div class="flex justify-end gap-3">
            <button
              @click="closeClaimModal"
              class="px-4 py-2 bg-gray-300 text-black rounded hover:bg-gray-400 transition"
            >
              Cancel
            </button>
            <button
              @click="submitClaim"
              :disabled="claimSubmitDisabled"
              class="px-5 py-2 rounded-lg font-semibold transition"
              :class="
                claimSubmitDisabled
                  ? 'bg-gray-400 text-white cursor-not-allowed opacity-70'
                  : 'bg-green-600 hover:bg-green-700 text-white'
              "
            >
              {{ claimSubmitLabel }}
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import initSocket, { disconnectSocket } from "../socket";
export default {
  name: "UserDashboard",
  data() {
    return {
      showNotifications: false,
      showProfileMenu: false,
      notifications: [],
      user: null,
      reports: [],
      claimedItems: [],
      showImageSearch: false,
      selectedMatch: null,
      claiming: false,
      showClaimModal: false,
      claimMessage: "",
      claimResultMessage: "",
      socket: null,
      apiBaseUrl: "http://localhost:5000",
      notificationPollTimer: null,
      notificationsInitialized: false,
      latestNotificationSignature: null,
      isSocketConnected: false,
      socketReconnectAttempts: 0,
    };
  },
  computed: {
    unreadNotificationCount() {
      return this.notifications.filter((n) => !n.is_read).length;
    },
    profileInitial() {
      if (this.user && this.user.full_name)
        return this.user.full_name[0].toUpperCase();
      return "U";
    },
    claimButtonDisabled() {
      return this.isClaimDisabled(this.selectedMatch);
    },
    claimButtonCta() {
      if (!this.selectedMatch || !this.claimButtonDisabled)
        return "I want to claim this item";

      const status = this.normalizeClaimStatus(
        this.selectedMatch.claim_status || this.selectedMatch.matched_status
      );

      switch (status) {
        case "pending_claim":
          return "Claim already submitted";
        case "confirmed_claim":
          return "Claim already approved";
        case "returned":
        case "returned_to_owner":
          return "Item already returned";
        case "rejected_claim":
          return "Claim already reviewed";
        default:
          return "Claim unavailable";
      }
    },
    selectedMatchStatusLabel() {
      if (!this.selectedMatch)
        return "In Security Custody";

      const candidates = [
        this.normalizeClaimStatus(this.selectedMatch.claim_status),
        this.normalizeClaimStatus(this.selectedMatch.matched_status),
      ];

      const prioritized = candidates.find((status) =>
        [
          "pending_claim",
          "confirmed_claim",
          "rejected_claim",
          "returned",
          "returned_to_owner",
        ].includes(status)
      );

      const fallback = candidates.find(Boolean) || "in_security_custody";

      return (prioritized || fallback)
        .split("_")
        .map((part) => (part ? part[0].toUpperCase() + part.slice(1) : ""))
        .join(" ");
    },
    claimStatusNotice() {
      if (!this.claimButtonDisabled) return "";

      const status = this.normalizeClaimStatus(
        this.selectedMatch?.claim_status || this.selectedMatch?.matched_status
      );

      switch (status) {
        case "pending_claim":
          return "A claim is already in review for this item.";
        case "confirmed_claim":
          return "This item already has an approved claim.";
        case "returned":
        case "returned_to_owner":
          return "This item has already been returned to its owner.";
        default:
          return "";
      }
    },
    claimSubmitDisabled() {
      return this.claiming || this.claimButtonDisabled;
    },
    claimSubmitLabel() {
      if (this.claimButtonDisabled) return "Claim unavailable";
      return this.claiming ? "Submitting..." : "Submit Claim";
    },
  },
  methods: {
    isValidUuid(value) {
      if (typeof value !== "string") return false;
      const trimmed = value.trim();
      return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(trimmed);
    },

    normalizeUuid(value) {
      return this.isValidUuid(value) ? value.trim() : null;
    },

    onSocketConnect() {
      this.isSocketConnected = true;
      this.socketReconnectAttempts = 0;
      const syncOptions = this.notificationsInitialized
        ? { autoPreview: true }
        : { markInitial: true };
      this.loadNotifications(syncOptions);
    },

    onSocketDisconnect() {
      this.isSocketConnected = false;
    },

    onSocketReconnectAttempt(attemptNumber) {
      this.socketReconnectAttempts = attemptNumber || 0;
    },

    normalizeClaimStatus(value) {
      if (value === undefined || value === null) return null;
      if (typeof value === "string") return value.trim().toLowerCase();
      try {
        return String(value).trim().toLowerCase();
      } catch (err) {
        return null;
      }
    },

    isClaimDisabled(match) {
      if (!match) return false;

      const statuses = [
        this.normalizeClaimStatus(match.claim_status),
        this.normalizeClaimStatus(match.matched_status),
      ].filter(Boolean);

      const blocking = [
        "pending_claim",
        "confirmed_claim",
        "returned",
        "returned_to_owner",
      ];

      return statuses.some((status) => blocking.includes(status));
    },

    applyClaimState(match, status) {
      if (!match) return;

      const normalized = this.normalizeClaimStatus(status) || "pending_claim";
      const key =
        match.match_id ||
        match.notification_id ||
        match.id ||
        match.item_id ||
        null;

      const clonedMatch = { ...match, claim_status: normalized };
      this.selectedMatch = { ...clonedMatch };

      if (key) {
        const idx = this.notifications.findIndex((n) => {
          const candidate =
            n.match_id || n.notification_id || n.id || n.item_id || null;
          return candidate && String(candidate) === String(key);
        });

        if (idx !== -1) {
          this.notifications.splice(idx, 1, {
            ...this.notifications[idx],
            claim_status: normalized,
          });
        }
      }
    },

    async toggleNotifications() {
      this.showNotifications = !this.showNotifications;
      if (this.showNotifications) await this.loadNotifications();
    },

    async loadNotifications(options = {}) {
      const { autoPreview = false, markInitial = false } = options;
      try {
        const user = JSON.parse(localStorage.getItem("user"));
        if (!user?.id) return console.warn("⚠️ No logged-in user found.");

        const res = await fetch(
          `http://localhost:5000/api/notifications/${user.id}`
        );
        if (!res.ok) throw new Error("Failed to fetch notifications");

        const data = await res.json();

    // ✅ Make sure to include the correct item_id from backend
    const mapped = data.map((n) => {
          const baseClaimStatus = this.normalizeClaimStatus(
            n.base_user_claim_status
          );
          const matchedClaimStatus = this.normalizeClaimStatus(
            n.matched_user_claim_status
          );
          const category = n.category?.toLowerCase();
          const baseType = (n.base_item_type || n.item_type || "").toLowerCase();
          const displayName = n.display_name || n.item_name || "Matched item";
          const studentId = n.display_student_id || null;
          const description =
            n.display_description ||
            n.matched_description ||
            (category === "id" && studentId
              ? `Possible match for student ID ${studentId}`
              : null);
          const message =
            category === "id"
              ? `A match for your lost Student ID (${studentId || "Unknown"}) has been found!`
              : `A match for your lost "${displayName}" has been found!`;

          const rawImagePath =
            n.display_image || n.matched_image_url || n.item_image_url || null;
          const baseUrl = this.apiBaseUrl.replace(/\/+$/, "");
          const normalizedPath = rawImagePath
            ? rawImagePath.startsWith("/")
              ? rawImagePath
              : `/${rawImagePath}`
            : null;
          const imageUrl = normalizedPath ? `${baseUrl}${normalizedPath}` : null;

          const createdAtRaw = n.created_at ? new Date(n.created_at) : new Date();

          const lostItemId =
            baseType === "lost"
              ? n.item_id
              : baseType === "found"
              ? n.matched_item_id || null
              : n.item_id;

          const foundItemId =
            baseType === "lost"
              ? n.matched_item_id || null
              : baseType === "found"
              ? n.item_id
              : n.matched_item_id || null;

          const resolvedClaimStatus =
            baseType === "lost"
              ? matchedClaimStatus || null
              : baseClaimStatus || matchedClaimStatus || null;

          const persistedNotificationId = this.normalizeUuid(n.id);
          const normalizedMatchId = this.normalizeUuid(n.match_id);

          return {
            id: persistedNotificationId || (normalizedMatchId ? `match-${normalizedMatchId}` : `match-${n.match_id}`),
            has_persisted_notification: Boolean(persistedNotificationId),
            notification_id: persistedNotificationId,
            item_id: n.item_id,
            lost_item_id: lostItemId,
            found_item_id: foundItemId,
            matched_item_id: n.matched_item_id || null,
            match_id: normalizedMatchId || n.match_id || null,
            category: n.category,
            message,
            display_name: displayName,
            display_student_id: studentId,
            display_description: description,
            display_image: imageUrl,
            matched_location: n.matched_location || "N/A",
            matched_status: n.matched_status || "in_security_custody",
            is_read: Boolean(n.is_read),
            created_at: createdAtRaw.toLocaleString(),
            created_at_ts: createdAtRaw.getTime(),
            base_item_type: baseType,
            claim_status: resolvedClaimStatus,
          };
        });

        mapped.sort((a, b) => b.created_at_ts - a.created_at_ts);

        const filtered = mapped.filter((entry) => {
          const status = this.normalizeClaimStatus(entry.claim_status);
          return !status || status === "rejected_claim";
        });

        this.notifications = filtered;

        if (this.selectedMatch) {
          const key =
            this.selectedMatch.match_id ||
            this.selectedMatch.notification_id ||
            this.selectedMatch.id ||
            this.selectedMatch.item_id ||
            null;
          if (key) {
            const refreshed = filtered.find((n) => {
              const candidate =
                n.match_id || n.notification_id || n.id || n.item_id || null;
              return candidate && String(candidate) === String(key);
            });
            if (refreshed) {
              this.selectedMatch = { ...refreshed };
            }
          }
        }

        const newest = filtered[0] || null;

        if (!this.notificationsInitialized && markInitial) {
          this.notificationsInitialized = true;
          this.latestNotificationSignature = newest
            ? this.buildNotificationSignature(newest)
            : null;
        } else if (autoPreview) {
          this.tryAutoPreviewLatest(newest);
        }

        return filtered;
      } catch (err) {
        console.error("❌ Error loading notifications:", err);
      }
    },

    buildNotificationSignature(notification) {
      if (!notification) return null;
      const keyParts = [
        notification.match_id ?? "no-match",
        notification.item_id ?? "no-item",
        notification.created_at_ts ?? Date.now(),
      ];
      return keyParts.join("::");
    },

    tryAutoPreviewLatest(candidate) {
      const target = candidate || this.notifications[0] || null;
      if (!target) return;

      const signature = this.buildNotificationSignature(target);
      if (!signature || signature === this.latestNotificationSignature) return;

      this.latestNotificationSignature = signature;
      this.triggerNotificationPreview(target, { showBrowserNotification: false });
    },

    triggerNotificationPreview(notification, options = {}) {
      if (!notification) return;
      const { showBrowserNotification = true } = options;

      if (this.showClaimModal) {
        this.closeClaimModal();
      }

      if (showBrowserNotification) {
        this.maybeSendDesktopNotification(notification);
      }

      this.$nextTick(() => {
        this.viewMatchDetails(notification);
      });
    },

    maybeSendDesktopNotification(notification) {
      if (typeof Notification === "undefined") return;

      if (Notification.permission === "granted") {
        new Notification("Item match found!", {
          body:
            notification.category?.toLowerCase() === "id"
              ? "Your Student ID may have been found."
              : `Possible match: ${notification.display_name}`,
          icon: notification.display_image || undefined,
        });
      } else if (Notification.permission !== "denied") {
        Notification.requestPermission();
      }
    },

    findNotificationForEvent(evt) {
      if (!evt) return null;

      return (
        this.notifications.find((n) => {
          const matchMatches =
            evt.match_id != null && String(n.match_id) === String(evt.match_id);
          const itemMatches =
            evt.item_id != null && String(n.item_id) === String(evt.item_id);
          const foundMatches =
            evt.found_item_id != null &&
            (String(n.found_item_id) === String(evt.found_item_id) ||
              String(n.matched_item_id) === String(evt.found_item_id));
          return matchMatches || itemMatches || foundMatches;
        }) || null
      );
    },

    // Handle realtime incoming match notification
    async handleNewNotificationEvent(evt) {
      try {
        const user = JSON.parse(localStorage.getItem("user"));
        if (!user?.id) return;

        if (evt && String(evt.user_id) !== String(user.id)) return;

        const eventType = (evt?.type || "").toLowerCase();
        const eventAction = (evt?.action || "").toLowerCase();

        const shouldAutoPreview =
          eventType === "match_found" || (!eventType && !eventAction);

        await this.loadNotifications({
          autoPreview:
            shouldAutoPreview &&
            eventType !== "claim_rejected" &&
            eventAction !== "claim_rejected",
        });

        if (eventType === "claim_submitted" || eventAction === "claim_pending") {
          if (!this.claimResultMessage) {
            this.claimResultMessage =
              "Your claim is now under review by Security. We'll notify you once there's an update.";
            setTimeout(() => {
              this.claimResultMessage = "";
            }, 9000);
          }
          return;
        }

        const target =
          this.findNotificationForEvent(evt) || this.notifications[0] || null;
        if (!target) return;

        if (eventType === "claim_rejected" || eventAction === "claim_rejected") {
          this.claimResultMessage =
            "Security could not verify your claim. You may review the match details and try again.";
          setTimeout(() => {
            this.claimResultMessage = "";
          }, 9000);
        }

        const shouldOpenModal =
          eventType === "claim_rejected" ||
          eventType === "match_found" ||
          (!eventType && !eventAction);

        if (!shouldOpenModal) return;

        const signature = this.buildNotificationSignature(target);
        if (signature === this.latestNotificationSignature) return;

        const showDesktopNotice =
          eventType === "match_found" || eventType === "claim_rejected";

        this.latestNotificationSignature = signature;
        this.triggerNotificationPreview(target, {
          showBrowserNotification: showDesktopNotice,
        });
      } catch (e) {
        console.error("Error handling realtime match event:", e);
      }
    },

    viewMatchDetails(match) {
      if (!match) {
        this.selectedMatch = null;
        return;
      }

      this.selectedMatch = { ...match };
    },

    closeMatchModal() {
      this.selectedMatch = null;
    },

    openClaimModal(match) {
      if (this.isClaimDisabled(match)) return;
      this.showClaimModal = true;
    },

    closeClaimModal() {
      this.showClaimModal = false;
      this.claimMessage = "";
    },

    async submitClaim() {
      if (!this.selectedMatch) return;

      try {
        this.claiming = true;
        const user = JSON.parse(localStorage.getItem("user"));
        if (!user?.id) throw new Error("User not logged in!");

        const foundItemId =
          this.selectedMatch.found_item_id || this.selectedMatch.matched_item_id;
        if (!foundItemId) {
          throw new Error(
            "Cannot submit claim because the matched found item is missing. Please run the search again or contact support."
          );
        }

        const rawNotificationId =
          this.selectedMatch.notification_id || this.selectedMatch.id || null;
        const normalizedNotificationId = this.normalizeUuid(rawNotificationId);
        const normalizedMatchId = this.normalizeUuid(
          this.selectedMatch.match_id || null
        );

        const res = await fetch(`http://localhost:5000/api/claims`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            user_id: user.id,
            item_id: foundItemId,
            notification_id: normalizedNotificationId,
            match_id: normalizedMatchId,
            message: this.claimMessage,
          }),
        });

        let data = null;
        try {
          data = await res.json();
        } catch (parseErr) {
          data = null;
        }

        if (res.status === 409) {
          const existingStatus =
            data?.claim?.status ||
            data?.claim?.user_claim_status ||
            data?.claim_status ||
            "pending_claim";
          this.applyClaimState(this.selectedMatch, existingStatus);
          this.claimResultMessage =
            data?.message ||
            "You already submitted a claim for this item. Security is reviewing it.";
          setTimeout(() => {
            this.claimResultMessage = "";
          }, 9000);
          this.closeClaimModal();
          await this.loadNotifications();
          return;
        }

        if (!res.ok)
          throw new Error(
            (data && data.message) || "Failed to submit claim request"
          );

        const suggestion =
          data?.suggestion ||
          "Your claim request was submitted. Please visit the Security Office for verification and claiming.";
        this.claimResultMessage = suggestion;
        setTimeout(() => {
          this.claimResultMessage = "";
        }, 9000);

        this.closeClaimModal();
        this.closeMatchModal();
        this.loadNotifications();
      } catch (err) {
        console.error("❌ Claim failed:", err.message);
        alert(`❌ Claim failed: ${err.message}`);
      } finally {
        this.claiming = false;
      }
    },



    goToProfile() {
      this.showProfileMenu = false;
      this.$router.push("/profile");
    },

    logout() {
      if (this.notificationPollTimer) {
        clearInterval(this.notificationPollTimer);
        this.notificationPollTimer = null;
      }

      if (this.socket) {
        try {
          this.socket.off("newNotification", this.handleNewNotificationEvent);
          this.socket.off("connect", this.onSocketConnect);
          this.socket.off("disconnect", this.onSocketDisconnect);
          if (this.socket.io) {
            this.socket.io.off("reconnect_attempt", this.onSocketReconnectAttempt);
          }
        } catch (err) {
          console.warn("Failed to remove socket listener on logout:", err);
        }
      }

      this.isSocketConnected = false;
      disconnectSocket();
      this.socket = null;
      localStorage.clear();
      this.$router.push("/login");
    },

    async fetchUserData() {
      try {
        const token = localStorage.getItem("token");
        if (!token) throw new Error("Missing authentication token");

        const res = await fetch("http://localhost:5000/api/profile", {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (!res.ok) throw new Error("Failed to fetch user data");

        const data = await res.json();
        if (data.profile_picture)
          data.profile_picture = `http://localhost:5000${data.profile_picture.replace(
            /^\/?uploads\//,
            "/uploads/"
          )}`;
        this.user = data;
      } catch (err) {
        console.error("Fetch user data error:", err);
        disconnectSocket();
        localStorage.clear();
        this.$router.push("/login");
      }
    },
  },
  mounted() {
    this.fetchUserData();
    this.loadNotifications({ markInitial: true });

    // Periodically refresh so matches still appear if realtime events are missed.
    this.notificationPollTimer = setInterval(() => {
      this.loadNotifications({ autoPreview: true });
    }, 20000);

    // Setup Socket.io for realtime notifications (shared singleton)
    try {
      this.socket = initSocket();
      if (this.socket.disconnected) {
        try {
          this.socket.connect();
        } catch (err) {
          console.error("Failed to initiate socket connect:", err);
        }
      }

      this.isSocketConnected = this.socket.connected;
      this.socketReconnectAttempts = 0;

      // Attach only the listeners this component needs. Do not disconnect the shared socket on unmount;
      // just remove listeners so other components using the socket are unaffected.
      this.socket.on("connect", this.onSocketConnect);
      this.socket.on("disconnect", this.onSocketDisconnect);
      if (this.socket.io) {
        this.socket.io.on(
          "reconnect_attempt",
          this.onSocketReconnectAttempt
        );
      }
      this.socket.on("newNotification", this.handleNewNotificationEvent);
    } catch (e) {
      console.error("Failed to initialize realtime socket:", e);
    }
  },
  beforeUnmount() {
    if (this.notificationPollTimer) {
      clearInterval(this.notificationPollTimer);
      this.notificationPollTimer = null;
    }

    if (this.socket) {
      try {
        this.socket.off("newNotification", this.handleNewNotificationEvent);
        this.socket.off("connect", this.onSocketConnect);
        this.socket.off("disconnect", this.onSocketDisconnect);
        if (this.socket.io) {
          this.socket.io.off(
            "reconnect_attempt",
            this.onSocketReconnectAttempt
          );
        }
        // Do not call disconnect() on the shared socket here. Other components may still need it.
      } catch (e) {
        // Non-fatal: ignore socket cleanup errors during unmount
        // console.debug("socket cleanup error", e);
      }
    }
  },
};
</script>