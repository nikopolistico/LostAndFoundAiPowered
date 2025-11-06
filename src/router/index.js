import { createRouter, createWebHistory } from "vue-router";

import Landing from "@/views/LandingPage.vue";
import Login from "@/views/LoginPage.vue";
import AdminLogin from "@/views/AdminLogin.vue";
import Report from "@/views/ReportPage.vue";
import LostDetails from "@/views/LostDetails.vue";
import Search from "@/views/SearchPage.vue";
import Profile from "@/views/UserProfile.vue";
import Notifications from "@/views/NotificationsPage.vue";
import MatchItem from "@/views/MatchItem.vue";
import UserDashboard from "@/views/UserDashboard.vue";
import MatchDetails from "@/views/match/MatchDetails.vue";
import SecurityDashboard from "@/views/SecurityDashboard.vue";
import AdminDashboard from "@/views/AdminDashboard.vue"; // ✅ Import Admin Dashboard
import AuthCallback from "@/views/AuthCallback.vue"; // ✅ Added AuthCallback page
import ViewProfile from "@/views/ViewProfile.vue"; // <-- read-only profile page

const routes = [
  { path: "/", component: Landing },
  { path: "/login", component: Login },
  { path: "/admin-login", component: AdminLogin },
  {
    path: "/register",
    redirect: { path: "/login", query: { tab: "register" } },
  },
  { path: "/report", component: Report },
  { path: "/lost/:id", component: LostDetails },
  { path: "/search", component: Search },
  { path: "/profile/:id?", component: Profile },
  { path: "/notifications", component: Notifications },
  { path: "/match/:id", component: MatchItem },
  {
    path: "/userdashboard",
    name: "UserDashboard",
    component: UserDashboard,
    meta: { requiresAuth: true, allowedRoles: ["university_member"] },
  },
  { path: "/match-details", name: "MatchDetails", component: MatchDetails },
  {
    path: "/security-dashboard",
    name: "SecurityDashboard",
    component: SecurityDashboard,
    meta: { requiresAuth: true, allowedRoles: ["security"] },
  },
  {
    path: "/admin-dashboard",
    name: "AdminDashboard",
    component: AdminDashboard,
    meta: {
      requiresAuth: true,
      allowedRoles: ["admin"],
      redirectIfUnauthenticated: "/admin-login",
    },
  }, // ✅ Admin route
  { path: "/auth/callback", name: "AuthCallback", component: AuthCallback }, // ✅ OAuth redirect
  {
    path: "/view-profile/:id?",
    name: "ViewProfile",
    component: ViewProfile,
    meta: { requiresAuth: true },
  },
];

const router = createRouter({
  history: createWebHistory(),
  routes,
});

// Navigation Guard
router.beforeEach((to, from, next) => {
  const token = localStorage.getItem("token");
  let user = null;

  if (token) {
    try {
      user = JSON.parse(localStorage.getItem("user") || "null");
    } catch (err) {
      console.error("Failed to parse stored user:", err);
      user = null;
    }
  }

  if (to.meta?.requiresAuth) {
    if (!token) {
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      const redirectTarget = to.meta.redirectIfUnauthenticated || "/login";
      return next(redirectTarget);
    }

    if (
      to.meta.allowedRoles &&
      user?.role &&
      !to.meta.allowedRoles.includes(user.role)
    ) {
      if (user.role === "admin") return next("/admin-dashboard");
      if (user.role === "security") return next("/security-dashboard");
      if (user.role === "university_member") return next("/userdashboard");
      return next("/login");
    }
  }

  // Require login
  if (to.path === "/login" && token) {
    if (user?.role === "university_member") return next("/userdashboard");
    if (user?.role === "security") return next("/security-dashboard");
    if (user?.role === "admin") return next("/admin-dashboard");
    return next();
  }

  if (to.path === "/admin-login" && token) {
    if (user?.role === "admin") return next("/admin-dashboard");
    if (user?.role === "security") return next("/security-dashboard");
    if (user?.role === "university_member") return next("/userdashboard");
    return next();
  }

  next();
});

export default router;
