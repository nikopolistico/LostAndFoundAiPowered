<template>
  <div
    class="bg-white rounded-xl shadow-lg overflow-hidden cursor-pointer 
           transform transition duration-300 hover:scale-105 hover:shadow-2xl hover:ring-2 hover:ring-yellow-500"
    @click="emitOpen"
  >
    <!-- Image -->
    <img
      :src="item.image"
      alt="Item image"
      class="w-full h-48 object-cover"
    />

    <!-- Content -->
    <div class="p-4">
      <h3 class="text-xl font-bold mb-2 text-black">{{ item.title }}</h3>
      <p class="text-black text-sm ">
        {{ item.description }}
      </p>
    </div>
  </div>
</template>

<script setup>
const props = defineProps({
  item: {
    type: Object,
    required: true,
  },
})

const emit = defineEmits(["open"])

function emitOpen() {
  emit("open", props.item)
}
</script>
