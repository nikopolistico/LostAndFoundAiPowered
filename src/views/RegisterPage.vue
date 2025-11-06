<template>
  <div
    class="min-h-screen flex flex-col items-center justify-center p-6 bg-gradient-to-b from-gray-950 via-gray-900 to-gray-950 animate-fade-in"
  >
    <h1 class="text-2xl font-semibold mb-6 text-center text-gray-100">
      Register
    </h1>

    <!-- Note box -->
    <div
      class="bg-gray-800 text-gray-200 text-sm p-3 rounded-md mb-6 border-l-4 border-yellow-400 max-w-sm w-full"
    >
      <p class="font-semibold">Note:</p>
      <p class="mt-1">
        All new users are registered as
        <span class="text-yellow-400 font-semibold">University Members</span> by
        default.
      </p>
    </div>

    <!-- Terms and Conditions Checkbox -->
    <div class="flex items-start space-x-2 max-w-sm mb-4 text-gray-300 text-sm">
      <input
        id="terms"
        type="checkbox"
        v-model="acceptedTerms"
        class="mt-1 w-4 h-4 accent-yellow-400"
      />
      <label for="terms" class="leading-tight">
        I agree to the
        <button
          type="button"
          @click="showModal = true"
          class="text-yellow-400 hover:underline font-semibold"
        >
          Terms and Conditions
        </button>
        and Privacy Policy.
      </label>
    </div>

    <!-- Google Sign-Up Button -->
    <div
      id="googleSignUpButton"
      class="w-full max-w-sm transition-opacity"
      :class="{ 'opacity-40 pointer-events-none': !acceptedTerms }"
    ></div>

    <!-- Warning -->
    <p
      v-if="!acceptedTerms"
      class="mt-2 text-xs text-red-400 text-center max-w-sm"
    >
      Please accept the Terms and Conditions before signing up.
    </p>

    <!-- Already have an account -->
    <p class="mt-4 text-gray-400 text-sm">
      Already have an account?
      <router-link to="/login" class="text-yellow-400 hover:underline">
        Sign In
      </router-link>
    </p>

    <!-- Loading text -->
    <p v-if="loading" class="mt-4 text-yellow-400 text-sm animate-pulse">
      Setting up Google Sign-Up...
    </p>

    <!-- Modal -->
    <transition name="fade">
      <div
        v-if="showModal"
        class="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50 p-4"
      >
        <div
          class="bg-gray-900 text-gray-200 rounded-2xl shadow-lg max-w-lg w-full p-6 relative border border-yellow-500/20"
        >
          <h2 class="text-xl font-semibold text-yellow-400 mb-3">
            Terms and Conditions
          </h2>
          <div class="text-sm space-y-3 max-h-80 overflow-y-auto pr-2">
            <p>
              Welcome to the <span class="font-semibold">AI-Powered Campus Lost and Found System</span>.
              By creating an account, you agree to the responsible use of this platform for reporting
              and retrieving lost items within the Caraga State University community.
            </p>

            <p>
              This system uses <span class="text-yellow-400">AI image recognition</span> to match
              found items with reported lost ones. Your data (including uploaded images and contact
              information) will be securely processed and stored in accordance with our privacy
              policy.
            </p>

            <p>
              Users must not upload inappropriate content or impersonate others. Any abuse of the
              system may result in account suspension or permanent ban.
            </p>

            <p>
              By continuing, you consent to the use of your information for improving system accuracy,
              research purposes, and record-keeping under Caraga State University’s data policies.
            </p>
          </div>

          <!-- Close Button -->
          <div class="mt-5 flex justify-end">
            <button
              @click="showModal = false"
              class="px-4 py-2 bg-yellow-500 hover:bg-yellow-400 text-gray-900 font-semibold rounded-lg"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </transition>
  </div>
</template>

<script setup>
/* global google */
import { ref, onMounted } from "vue";
import { useRouter } from "vue-router";

const router = useRouter();
const loading = ref(true);
const acceptedTerms = ref(false);
const showModal = ref(false);

const handleCredentialResponse = async (response) => {
  if (!acceptedTerms.value) {
    alert("Please agree to the Terms and Conditions first.");
    return;
  }

  const token = response.credential;
  const role = "university_member"; // default role

  try {
    const res = await fetch("http://localhost:5000/api/auth/google-register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token, role }),
    });

    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Registration failed");

    localStorage.setItem("token", data.token);
    localStorage.setItem("user", JSON.stringify(data.user));

    router.push("/userdashboard");
  } catch (err) {
    console.error("Registration error:", err);
    alert(err.message || "Registration failed. Please try again.");
  }
};

onMounted(async () => {
  try {
    const res = await fetch("http://localhost:5000/api/auth/google-client-id");
    const data = await res.json();
    const clientId = data.clientId;

    const initGoogleButton = () => {
      google.accounts.id.initialize({
        client_id: clientId,
        callback: handleCredentialResponse,
      });
      google.accounts.id.renderButton(
        document.getElementById("googleSignUpButton"),
        {
          theme: "outline",
          size: "large",
          width: "300",
          text: "signup_with",
        }
      );
      loading.value = false;
    };

    if (
      !document.querySelector('script[src="https://accounts.google.com/gsi/client"]')
    ) {
      const script = document.createElement("script");
      script.src = "https://accounts.google.com/gsi/client";
      script.async = true;
      script.defer = true;
      script.onload = initGoogleButton;
      document.head.appendChild(script);
    } else {
      initGoogleButton();
    }
  } catch (err) {
    console.error("Failed to initialize Google Sign-Up:", err);
    alert("Failed to load Google Sign-Up. Please try again later.");
    loading.value = false;
  }
});
</script>

<style scoped>
#googleSignUpButton {
  display: flex;
  justify-content: center;
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.25s ease;
}
.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
