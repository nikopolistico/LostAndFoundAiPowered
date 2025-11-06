<template>
  <div :class="`p-4 rounded-lg shadow-md bg-${color}-600`">
    <h3 class="text-sm font-medium">{{ title }}</h3>
    <p class="text-2xl font-bold">{{ count }}</p>
  </div>
</template>

<script setup>
defineProps({
  title: String,
  count: [Number, String],
  color: { type: String, default: 'yellow' }
})
</script>
