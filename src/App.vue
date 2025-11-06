<template>
  <div class="bg-brand-black text-white min-h-screen flex flex-col">
    <router-view class="flex-1" />
    <Navbar v-if="showNavbar" />
  </div>
</template>

<script setup>
import { computed } from "vue";
import { useRoute } from "vue-router";
import Navbar from "@/components/AppNavbar.vue";

const route = useRoute();
const hiddenNavbarRoutes = ["/admin-login"];

const showNavbar = computed(() => !hiddenNavbarRoutes.includes(route.path));
</script>
