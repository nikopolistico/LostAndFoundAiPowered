<template>
  <!-- Navbar will NOT show on login or register pages -->
  <nav v-if="showNavbar"
       class="fixed top-0 left-1/2 -translate-x-1/2 
              bg-brand-black border-b border-gray-700 
              flex justify-around w-full max-w-md 
              rounded-b-2xl py-3 shadow-xl z-50">
    <RouterLink v-for="item in nav" :key="item.to" 
      :to="item.to"
      class="flex flex-col items-center text-sm transition-all 
             hover:text-brand-yellow"
      :class="{ 'text-brand-yellow': $route.path === item.to }">
      <component :is="item.icon" class="w-6 h-6 mb-1" />
      {{ item.label }}
    </RouterLink>
  </nav>
</template>

<script setup>
import { computed } from "vue";
import { useRoute } from "vue-router";
import { Home, Search, Bell, User, PlusSquare } from "lucide-vue-next";

const route = useRoute();

const nav = [
  { to: "/userdashboard", label: "Home", icon: Home },
  { to: "/search", label: "Search", icon: Search },
  { to: "/report", label: "Report", icon: PlusSquare },
  { to: "/notifications", label: "Alerts", icon: Bell },
  { to: "/profile", label: "Profile", icon: User },
];

// Hide navbar on login & register pages
const showNavbar = computed(() => {
  // Check if the current route is neither login nor register
  return route.path !== "/login" && route.path !== "/register" && route.path !== "/" && route.path !== "/admin-dashboard";
});
</script>
