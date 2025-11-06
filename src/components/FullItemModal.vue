<template>
  <div
    v-if="show"
    class="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50"
  >
    <div class="bg-gray-800 p-6 rounded-2xl shadow-xl max-w-lg w-full relative">
      <!-- Close Button -->
      <button
        class="absolute top-3 right-3 text-gray-400 hover:text-white"
        @click="$emit('close')"
      >
        ✕
      </button>

      <!-- Image -->
      <img
        :src="item.image"
        alt="Item image"
        class="w-full h-60 object-cover rounded-lg mb-4"
      />

      <!-- Info -->
      <h2 class="text-2xl font-bold mb-2">{{ item.title }}</h2>
      <p class="text-gray-300">{{ item.description }}</p>
    </div>
  </div>
</template>

<script setup>
defineProps({
  item: Object,
  show: Boolean,
})
defineEmits(["close"])
</script>
