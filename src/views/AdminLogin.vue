<template>
  <div
    class="min-h-screen flex items-center justify-center p-6 bg-gradient-to-b from-gray-950 via-gray-900 to-gray-950 animate-fade-in"
  >
    <div
      class="w-full max-w-2xl bg-gray-900/80 border border-gray-800 rounded-2xl shadow-lg p-8 space-y-6"
    >
      <header class="text-center space-y-2">
        <h1 class="text-3xl font-bold text-yellow-400">Administrator Access</h1>
        <p class="text-sm text-gray-400">
          Only authorized campus administrators may sign in. Use your @carsu.edu.ph email address.
        </p>
      </header>

      <section class="grid md:grid-cols-2 gap-6">
        <div class="space-y-4">
          <div
            class="bg-gray-800/60 border border-gray-700 rounded-xl p-4 text-sm text-gray-300 space-y-2"
          >
            <p class="font-semibold text-yellow-300">Manual Sign In</p>
            <p>
              Admin accounts are provisioned by the system team. Enter the email and password associated with
              your administrator profile.
            </p>
          </div>

          <div>
            <label class="block text-gray-300 mb-2 text-sm font-medium">Email</label>
            <input
              v-model="loginEmail"
              type="email"
              autocomplete="username"
              placeholder="admin.name@carsu.edu.ph"
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

          <div class="border-t border-gray-800 pt-4 space-y-3">
            <button
              v-if="registrationAllowed"
              @click="showRegister = !showRegister"
              class="w-full py-2 text-sm font-semibold rounded-xl border border-yellow-500 text-yellow-400 hover:bg-yellow-500 hover:text-black transition"
            >
              {{ showRegister ? "Hide Administrator Registration" : "Register an Administrator" }}
            </button>
            <p v-else class="text-xs text-gray-500">
              Administrator registration is locked. Contact the system maintainer to provision access.
            </p>

            <form
              v-if="showRegister && registrationAllowed"
              @submit.prevent="handleBootstrapRegister"
              class="space-y-3 bg-gray-900/70 border border-gray-800 rounded-xl p-4"
            >
              <p class="text-sm text-gray-300">
                Create an administrator account with a strong password. This action is audited.
              </p>

              <div class="grid gap-3">
                <div>
                  <label class="block text-gray-300 mb-1 text-xs uppercase tracking-wide">Full Name</label>
                  <input
                    v-model="registerFullName"
                    type="text"
                    placeholder="Admin Name"
                    class="w-full px-3 py-2 rounded-lg bg-gray-900 border border-gray-700 text-gray-200 focus:ring-2 focus:ring-yellow-400 outline-none transition"
                  />
                </div>

                <div>
                  <label class="block text-gray-300 mb-1 text-xs uppercase tracking-wide">Administrator Email</label>
                  <input
                    v-model="registerEmail"
                    type="email"
                    required
                    placeholder="admin.name@carsu.edu.ph"
                    class="w-full px-3 py-2 rounded-lg bg-gray-900 border border-gray-700 text-gray-200 focus:ring-2 focus:ring-yellow-400 outline-none transition"
                  />
                </div>

                <div>
                  <label class="block text-gray-300 mb-1 text-xs uppercase tracking-wide">Password</label>
                  <input
                    v-model="registerPassword"
                    type="password"
                    required
                    minlength="12"
                    placeholder="Minimum 12 characters"
                    class="w-full px-3 py-2 rounded-lg bg-gray-900 border border-gray-700 text-gray-200 focus:ring-2 focus:ring-yellow-400 outline-none transition"
                  />
                </div>

                <div>
                  <label class="block text-gray-300 mb-1 text-xs uppercase tracking-wide">Confirm Password</label>
                  <input
                    v-model="registerConfirm"
                    type="password"
                    required
                    placeholder="Retype password"
                    class="w-full px-3 py-2 rounded-lg bg-gray-900 border border-gray-700 text-gray-200 focus:ring-2 focus:ring-yellow-400 outline-none transition"
                  />
                </div>

                <div v-if="registrationRequiresKey">
                  <label class="block text-gray-300 mb-1 text-xs uppercase tracking-wide">Bootstrap Key</label>
                  <input
                    v-model="registerKey"
                    type="text"
                    placeholder="Enter administrator bootstrap key"
                    class="w-full px-3 py-2 rounded-lg bg-gray-900 border border-gray-700 text-gray-200 focus:ring-2 focus:ring-yellow-400 outline-none transition"
                  />
                </div>
              </div>

              <button
                type="submit"
                :disabled="registerLoading"
                class="w-full py-2 bg-blue-600 text-white font-semibold rounded-xl hover:bg-blue-500 transition disabled:opacity-60"
              >
                {{ registerLoading ? "Registering..." : "Create Administrator Account" }}
              </button>
            </form>
          </div>
        </div>

        <div class="flex flex-col justify-between bg-gray-900/70 border border-gray-800 rounded-xl p-5 space-y-4">
          <div>
            <p class="font-semibold text-gray-100">Sign in with Google</p>
            <p class="text-sm text-gray-400 mt-1">
              Use your university Google account. Access is granted only to emails that have administrator
              privileges assigned in the system.
            </p>
          </div>

          <div class="relative">
            <div id="googleButtonAdmin" class="w-full flex justify-center"></div>
          </div>

          <ul class="text-xs text-gray-500 space-y-1">
            <li>• Successful login routes directly to the admin dashboard.</li>
            <li>• Contact the system maintainer if your account needs access.</li>
          </ul>
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
        <router-link to="/login" class="text-yellow-400 hover:underline">
          Back to user & security sign in
        </router-link>
      </div>
    </div>
  </div>
</template>

<script setup>
/* global google */
import { computed, nextTick, onMounted, ref, watch } from "vue";
import { useRouter } from "vue-router";

const router = useRouter();

const loginEmail = ref("");
const loginPassword = ref("");
const errorMessage = ref("");
const successMessage = ref("");

const bootstrapStatus = ref({ allowRegistration: false, requireKey: false, adminCount: null });
const showRegister = ref(false);
const registerEmail = ref("");
const registerPassword = ref("");
const registerConfirm = ref("");
const registerFullName = ref("");
const registerKey = ref("");
const registerLoading = ref(false);

const registrationAllowed = computed(() => Boolean(bootstrapStatus.value.allowRegistration));
const registrationRequiresKey = computed(() => Boolean(bootstrapStatus.value.requireKey));

let clientId = "";
let googleLoaded = false;
let googleInit = false;

const ADMIN_ROLE = "admin";

const handleManualLogin = async () => {
  errorMessage.value = "";
  successMessage.value = "";

  const email = loginEmail.value.trim().toLowerCase();
  if (!email.endsWith("@carsu.edu.ph")) {
    errorMessage.value = "Email must end with @carsu.edu.ph.";
    return;
  }
  if (!loginPassword.value) {
    errorMessage.value = "Password is required for manual admin login.";
    return;
  }

  try {
    const res = await fetch("http://localhost:5000/api/auth/simple-login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password: loginPassword.value, role: ADMIN_ROLE }),
    });

    const data = await res.json();
    if (!res.ok) {
      errorMessage.value = data.error || "Manual login failed.";
      return;
    }

    if (!data.token || !data.user) {
      errorMessage.value = "Invalid response from server.";
      return;
    }

    localStorage.setItem("token", data.token);
    localStorage.setItem("user", JSON.stringify(data.user));

    successMessage.value = "Login successful! Redirecting...";
    redirectToDashboard();
  } catch (err) {
    console.error("Admin manual login error:", err);
    errorMessage.value = "Unable to login right now.";
  }
};

const handleGoogleCredential = async (response) => {
  errorMessage.value = "";
  successMessage.value = "";

  try {
    const res = await fetch("http://localhost:5000/api/auth/google-login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token: response.credential, role: ADMIN_ROLE }),
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

    localStorage.setItem("token", data.token);
    localStorage.setItem("user", JSON.stringify(data.user));
    successMessage.value = "Login successful! Redirecting...";
    redirectToDashboard();
  } catch (err) {
    console.error("Admin Google login error:", err);
    errorMessage.value = "Sign-in failed. Please try again.";
  }
};

const redirectToDashboard = () => {
  setTimeout(() => {
    router.push("/admin-dashboard");
  }, 600);
};

const fetchBootstrapStatus = async () => {
  try {
    const res = await fetch("http://localhost:5000/api/auth/admin-bootstrap-status");
    if (!res.ok) return;
    const data = await res.json();
    bootstrapStatus.value = data;
    if (!data.allowRegistration) {
      showRegister.value = false;
    }
  } catch (err) {
    console.error("Failed to load admin registration status:", err);
  }
};

const resetRegisterForm = () => {
  registerEmail.value = "";
  registerPassword.value = "";
  registerConfirm.value = "";
  registerFullName.value = "";
  registerKey.value = "";
};

const handleBootstrapRegister = async () => {
  errorMessage.value = "";
  successMessage.value = "";

  if (!registrationAllowed.value) {
    errorMessage.value = "Administrator registration is currently disabled.";
    return;
  }

  const email = registerEmail.value.trim().toLowerCase();
  if (!email.endsWith("@carsu.edu.ph")) {
    errorMessage.value = "Administrator email must end with @carsu.edu.ph.";
    return;
  }

  if (!registerPassword.value || registerPassword.value.length < 12) {
    errorMessage.value = "Password must be at least 12 characters long.";
    return;
  }

  if (registerPassword.value !== registerConfirm.value) {
    errorMessage.value = "Password confirmation does not match.";
    return;
  }

  if (registrationRequiresKey.value && !registerKey.value.trim()) {
    errorMessage.value = "Bootstrap key is required to register an administrator.";
    return;
  }

  registerLoading.value = true;

  try {
    const payload = {
      email,
      password: registerPassword.value,
      fullName: registerFullName.value.trim() || undefined,
    };

    if (registrationRequiresKey.value) {
      payload.bootstrapKey = registerKey.value.trim();
    }

    const res = await fetch("http://localhost:5000/api/auth/admin-bootstrap", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    const data = await res.json();
    if (!res.ok) {
      errorMessage.value = data.error || "Administrator registration failed.";
      return;
    }

    localStorage.setItem("token", data.token);
    localStorage.setItem("user", JSON.stringify(data.user));

    successMessage.value = "Administrator registered! Redirecting...";
    showRegister.value = false;
    resetRegisterForm();
    await fetchBootstrapStatus();
    redirectToDashboard();
  } catch (err) {
    console.error("Admin registration failed:", err);
    errorMessage.value = "Unable to register administrator right now.";
  } finally {
    registerLoading.value = false;
  }
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
    callback: handleGoogleCredential,
    ux_mode: "popup",
  });
  googleInit = true;
  renderGoogleButton();
};

const renderGoogleButton = () => {
  if (!window.google || !googleInit) return;
  const buttonContainer = document.getElementById("googleButtonAdmin");
  if (!buttonContainer) return;
  buttonContainer.innerHTML = "";
  google.accounts.id.renderButton(buttonContainer, {
    theme: "outline",
    size: "large",
    width: "280",
    text: "continue_with",
  });
};

const ensureGoogleButton = async () => {
  if (!googleInit) return;
  await nextTick();
  renderGoogleButton();
};

const initGoogle = async () => {
  try {
    const res = await fetch("http://localhost:5000/api/auth/google-client-id");
    const data = await res.json();
    clientId = data.clientId;
    await loadGoogleScript();
    initializeGoogle();
    await ensureGoogleButton();
  } catch (err) {
    console.error("Failed to initialize Google Sign-In:", err);
    errorMessage.value = "Failed to load Google Sign-In.";
  }
};

onMounted(() => {
  initGoogle();
  fetchBootstrapStatus();
});

watch(showRegister, () => {
  ensureGoogleButton();
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
