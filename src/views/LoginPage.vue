<template>
  <div
    class="min-h-screen flex items-center justify-center p-6 bg-gradient-to-b from-gray-950 via-gray-900 to-gray-950 animate-fade-in"
  >
    <div
      class="w-full max-w-2xl bg-gray-900/80 border border-gray-800 rounded-2xl shadow-lg p-8 space-y-6"
    >
      <header class="text-center space-y-2">
        <h1 class="text-3xl font-bold text-yellow-400">Campus Lost &amp; Found Access</h1>
        <p class="text-sm text-gray-400">
          Use your @carsu.edu.ph email to sign in or register.
        </p>
      </header>

      <div class="flex bg-gray-800/70 rounded-xl p-1">
        <button :class="tabClass('login')" @click="switchTab('login')">
          Sign In
        </button>
        <button :class="tabClass('register')" @click="switchTab('register')">
          Register
        </button>
      </div>

      <section v-if="activeTab === 'login'" class="grid md:grid-cols-2 gap-6">
        <div class="space-y-4">
          <div>
            <label class="block text-gray-300 mb-2 text-sm font-medium">Login as</label>
            <select
              v-model="role"
              class="w-full px-4 py-3 rounded-xl bg-gray-900 border border-gray-700 text-sm text-gray-200 focus:ring-2 focus:ring-yellow-400 outline-none transition duration-300"
            >
              <option value="university_member">University Member</option>
              <option value="security">Security Staff</option>
            </select>
          </div>

          <div>
            <label class="block text-gray-300 mb-2 text-sm font-medium">Email</label>
            <input
              v-model="loginEmail"
              type="email"
              autocomplete="username"
              placeholder="your.name@carsu.edu.ph"
              class="w-full px-4 py-3 rounded-xl bg-gray-900 border border-gray-700 text-gray-200 focus:ring-2 focus:ring-yellow-400 outline-none transition duration-300"
            />
          </div>

          <div>
            <label class="block text-gray-300 mb-2 text-sm font-medium">Password</label>
            <input
              v-model="loginPassword"
              type="password"
              autocomplete="current-password"
              placeholder="Enter password"
              class="w-full px-4 py-3 rounded-xl bg-gray-900 border border-gray-700 text-gray-200 focus:ring-2 focus:ring-yellow-400 outline-none transition duration-300"
            />
          </div>

          <button
            @click="handleManualLogin"
            class="w-full py-3 bg-yellow-500 text-black font-semibold rounded-xl hover:bg-yellow-400 transition duration-300"
          >
            Sign In Manually
          </button>
        </div>

        <div
          class="flex flex-col justify-between bg-gray-900/70 border border-gray-800 rounded-xl p-5 space-y-4"
        >
          <div>
            <p class="font-semibold text-gray-100">Sign in with Google</p>
            <p class="text-sm text-gray-400 mt-1">
              Use your CarSU email. Choose your role first so we can send you to the right dashboard.
            </p>
          </div>

          <div class="relative">
            <div id="googleButton" class="w-full flex justify-center"></div>
            <div
              v-if="!role"
              class="absolute inset-0 bg-transparent cursor-not-allowed"
              @click="showRoleError"
            ></div>
          </div>

          <ul class="text-xs text-gray-500 space-y-1">
            <li>• University members are redirected to their dashboard.</li>
            <li>• Security staff will see the security dashboard.</li>
          </ul>
        </div>
      </section>

      <section v-else class="grid md:grid-cols-2 gap-6">
        <div class="space-y-4">
          <div
            class="bg-gray-800/60 border border-gray-700 rounded-xl p-4 text-sm text-gray-300 space-y-2"
          >
            <p class="font-semibold text-yellow-300">University Member Registration</p>
            <p>
              Manual registration automatically sets your role to
              <span class="text-yellow-400">University Member</span>. Security
              staff accounts are created by administrators.
            </p>
          </div>

          <div>
            <label class="block text-gray-300 mb-2 text-sm font-medium">Email</label>
            <input
              v-model="registerEmail"
              type="email"
              autocomplete="email"
              placeholder="your.name@carsu.edu.ph"
              class="w-full px-4 py-3 rounded-xl bg-gray-900 border border-gray-700 text-gray-200 focus:ring-2 focus:ring-yellow-400 outline-none transition duration-300"
            />
          </div>

          <div>
            <label class="block text-gray-300 mb-2 text-sm font-medium">Password</label>
            <input
              v-model="registerPassword"
              type="password"
              autocomplete="new-password"
              placeholder="Create a password"
              class="w-full px-4 py-3 rounded-xl bg-gray-900 border border-gray-700 text-gray-200 focus:ring-2 focus:ring-yellow-400 outline-none transition duration-300"
            />
          </div>

          <div class="flex items-start space-x-3">
            <input
              id="terms"
              type="checkbox"
              v-model="acceptedTerms"
              class="mt-1 w-4 h-4 accent-yellow-400"
            />
            <label for="terms" class="text-sm text-gray-300 leading-tight">
              I agree to the platform’s Terms, Privacy Policy, and confirm this
              email is mine.
            </label>
          </div>

          <button
            @click="handleManualRegister"
            class="w-full py-3 bg-green-600 text-white font-semibold rounded-xl hover:bg-green-500 transition duration-300 disabled:opacity-60"
            :disabled="!acceptedTerms"
          >
            Register Manually
          </button>
        </div>

        <div
          class="flex flex-col justify-between bg-gray-900/70 border border-gray-800 rounded-xl p-5 space-y-4"
        >
          <div>
            <p class="font-semibold text-gray-100">Register with Google</p>
            <p class="text-sm text-gray-400 mt-1">
              Google registration also creates a University Member account.
              Please accept the terms first.
            </p>
          </div>

          <div class="relative">
            <div id="googleButtonRegister" class="w-full flex justify-center"></div>
            <div
              v-if="!acceptedTerms"
              class="absolute inset-0 bg-transparent cursor-not-allowed"
              @click="showTermsError"
            ></div>
          </div>

          <p class="text-xs text-gray-500">
            Need a security staff account? Request one from an administrator so
            they can register it for you.
          </p>
        </div>
      </section>

      <div class="space-y-2">
        <p v-if="errorMessage" class="text-sm text-red-400 text-center">
          {{ errorMessage }}
        </p>
        <p v-if="successMessage" class="text-sm text-green-400 text-center">
          {{ successMessage }}
        </p>
      </div>

      <div class="flex flex-col items-center space-y-2 text-sm text-gray-400">
        <router-link to="/admin-login" class="text-yellow-400 hover:underline">
          Administrator? Sign in here.
        </router-link>
      </div>
    </div>
  </div>
</template>

<script setup>
/* global google */
import { onMounted, ref, watch } from "vue";
import { useRoute, useRouter } from "vue-router";
import { jwtDecode } from "jwt-decode";

const router = useRouter();
const route = useRoute();

const activeTab = ref("login");
const role = ref("university_member");
const loginEmail = ref("");
const loginPassword = ref("");
const registerEmail = ref("");
const registerPassword = ref("");
const acceptedTerms = ref(false);
const errorMessage = ref("");
const successMessage = ref("");

let clientId = "";
let googleLoaded = false;
let googleInit = false;

const setTabFromQuery = () => {
  const tabQuery = String(route.query.tab || "").toLowerCase();
  if (tabQuery === "register") {
    activeTab.value = "register";
  } else {
    activeTab.value = "login";
  }
};

const switchTab = (tab) => {
  if (activeTab.value === tab) return;
  activeTab.value = tab;
  errorMessage.value = "";
  successMessage.value = "";
  const query = tab === "register" ? { tab: "register" } : {};
  router.replace({ query }).catch(() => {});
  renderGoogleButtons();
};

const tabClass = (tab) => {
  const base = "flex-1 text-sm md:text-base font-semibold py-3 rounded-xl transition";
  if (activeTab.value === tab) {
    return `${base} bg-yellow-500 text-black`;
  }
  return `${base} text-gray-300 hover:text-yellow-400`;
};

const showRoleError = () => {
  errorMessage.value = "Select your role before using Google sign-in.";
};

const showTermsError = () => {
  errorMessage.value = "Please accept the terms before continuing.";
};

const handleManualLogin = async () => {
  errorMessage.value = "";
  successMessage.value = "";

  const email = loginEmail.value.trim().toLowerCase();
  if (!email.endsWith("@carsu.edu.ph")) {
    errorMessage.value = "Login email must end with @carsu.edu.ph.";
    return;
  }

  try {
    const res = await fetch("http://localhost:5000/api/auth/simple-login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email,
        password: loginPassword.value,
        role: role.value,
      }),
    });

    const data = await res.json();
    if (!res.ok) {
      errorMessage.value = data.error || "Manual login failed.";
      return;
    }

    localStorage.setItem("token", data.token);
    localStorage.setItem("user", JSON.stringify(data.user));

    successMessage.value = "Login successful! Redirecting...";
    redirectByRole(data.user?.role);
  } catch (err) {
    console.error("Manual login error:", err);
    errorMessage.value = "Unable to login right now.";
  }
};

const handleManualRegister = async () => {
  errorMessage.value = "";
  successMessage.value = "";

  const email = registerEmail.value.trim().toLowerCase();
  if (!email) {
    errorMessage.value = "Registration email is required.";
    return;
  }
  if (!email.endsWith("@carsu.edu.ph")) {
    errorMessage.value = "Registration email must end with @carsu.edu.ph.";
    return;
  }
  if (!acceptedTerms.value) {
    showTermsError();
    return;
  }

  try {
    const res = await fetch("http://localhost:5000/api/auth/simple-register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password: registerPassword.value }),
    });

    const data = await res.json();
    if (!res.ok) {
      errorMessage.value = data.error || "Registration failed.";
      return;
    }

    successMessage.value = "Registration successful! You can sign in now.";
    registerEmail.value = "";
    registerPassword.value = "";
    acceptedTerms.value = false;
  } catch (err) {
    console.error("Manual registration error:", err);
    errorMessage.value = "Unable to register right now.";
  }
};

const handleGoogleCredential = async (response, mode) => {
  errorMessage.value = "";
  successMessage.value = "";

  if (mode === "register") {
    if (!acceptedTerms.value) {
      showTermsError();
      return;
    }
    await processGoogleRegister(response.credential);
  } else {
    if (!role.value) {
      showRoleError();
      return;
    }
    await processGoogleLogin(response.credential);
  }
};

const processGoogleLogin = async (googleToken) => {
  try {
    const res = await fetch("http://localhost:5000/api/auth/google-login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token: googleToken, role: role.value }),
    });

    const data = await res.json();
    if (!res.ok) {
      errorMessage.value = data.error || "Google sign-in failed.";
      return;
    }

    if (!data.token || !data.user) {
      errorMessage.value = "Invalid response from server.";
      return;
    }

    try {
      const decoded = jwtDecode(data.token);
      console.info("Google login decoded", decoded);
    } catch (err) {
      console.debug("JWT decode skipped", err);
    }

    localStorage.setItem("token", data.token);
    localStorage.setItem("user", JSON.stringify(data.user));
    redirectByRole(data.user.role);
  } catch (err) {
    console.error("Google login error:", err);
    errorMessage.value = "Login failed. Please try again.";
  }
};

const processGoogleRegister = async (googleToken) => {
  try {
    const res = await fetch("http://localhost:5000/api/auth/google-register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token: googleToken, role: "university_member" }),
    });

    const data = await res.json();
    if (!res.ok) {
      errorMessage.value = data.error || "Google registration failed.";
      return;
    }

    if (!data.token || !data.user) {
      errorMessage.value = "Invalid response from server.";
      return;
    }

    localStorage.setItem("token", data.token);
    localStorage.setItem("user", JSON.stringify(data.user));
    successMessage.value = "Registration successful! Redirecting...";
    redirectByRole(data.user.role);
  } catch (err) {
    console.error("Google registration error:", err);
    errorMessage.value = "Google registration failed.";
  }
};

const redirectByRole = (userRole) => {
  setTimeout(() => {
    if (userRole === "university_member") router.push("/userdashboard");
    else if (userRole === "security") router.push("/security-dashboard");
    else if (userRole === "admin") router.push("/admin-dashboard");
    else router.push("/");
  }, 600);
};

const loadGoogleScript = () => {
  if (googleLoaded) return Promise.resolve();
  return new Promise((resolve, reject) => {
    if (document.querySelector("script[src='https://accounts.google.com/gsi/client']")) {
      googleLoaded = true;
      resolve();
      return;
    }
    const script = document.createElement("script");
    script.src = "https://accounts.google.com/gsi/client";
    script.async = true;
    script.defer = true;
    script.onload = () => {
      googleLoaded = true;
      resolve();
    };
    script.onerror = reject;
    document.head.appendChild(script);
  });
};

const initializeGoogle = () => {
  if (!window.google || googleInit) return;
  google.accounts.id.initialize({
    client_id: clientId,
    callback: (response) => {
      const mode = activeTab.value === "register" ? "register" : "login";
      handleGoogleCredential(response, mode);
    },
  });
  googleInit = true;
  renderGoogleButtons();
};

const renderGoogleButtons = () => {
  if (!window.google || !googleInit) return;
  const loginContainer = document.getElementById("googleButton");
  const registerContainer = document.getElementById("googleButtonRegister");
  if (loginContainer) {
    loginContainer.innerHTML = "";
    google.accounts.id.renderButton(loginContainer, {
      theme: "outline",
      size: "large",
      width: "280",
      text: "continue_with",
    });
  }
  if (registerContainer) {
    registerContainer.innerHTML = "";
    google.accounts.id.renderButton(registerContainer, {
      theme: "outline",
      size: "large",
      width: "280",
      text: "signup_with",
    });
  }
};

const initGoogle = async () => {
  try {
    const res = await fetch("http://localhost:5000/api/auth/google-client-id");
    const data = await res.json();
    clientId = data.clientId;
    await loadGoogleScript();
    initializeGoogle();
  } catch (err) {
    console.error("Failed to initialize Google Sign-In:", err);
    errorMessage.value = "Failed to load Google Sign-In.";
  }
};

onMounted(() => {
  setTabFromQuery();
  initGoogle();
});

watch(
  () => route.query.tab,
  () => setTabFromQuery()
);

watch(activeTab, () => {
  renderGoogleButtons();
});
</script>

<style scoped>
.animate-fade-in {
  animation: fadeIn 0.6s ease-in-out;
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(8px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
</style>
