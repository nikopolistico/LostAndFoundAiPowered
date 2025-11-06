<template>
  <div class="bg-gray-900 p-4 rounded-xl shadow hover:bg-gray-800 transition">
    <h3 class="font-medium">{{ title }}</h3>
    <p class="text-gray-400 text-sm">{{ message }}</p>
  </div>
</template>

<script setup>
defineProps({
  title: String,
  message: String
});
</script>
