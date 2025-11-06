<template>
  <table class="w-full text-left">
    <thead>
      <tr class="border-b border-gray-700">
        <th class="p-2">ID</th>
        <th class="p-2">Item Name</th>
        <th class="p-2">Category</th>
        <th class="p-2">Status</th>
        <th class="p-2">Actions</th>
      </tr>
    </thead>
    <tbody>
      <tr v-for="item in items" :key="item.id" class="border-b border-gray-800 hover:bg-gray-800">
        <td class="p-2">{{ item.id }}</td>
        <td class="p-2">{{ item.name }}</td>
        <td class="p-2">{{ item.category }}</td>
        <td class="p-2">{{ item.status }}</td>
        <td class="p-2">
          <button class="px-2 py-1 bg-yellow-400 text-black rounded mr-2">View</button>
          <button class="px-2 py-1 bg-red-500 text-white rounded">Delete</button>
        </td>
      </tr>
    </tbody>
  </table>
</template>

<script setup>
import { ref } from 'vue'

const items = ref([
  { id: 1, name: 'Wallet', category: 'Personal', status: 'Pending' },
  { id: 2, name: 'ID Card', category: 'Identification', status: 'Resolved' },
  { id: 3, name: 'Umbrella', category: 'Accessories', status: 'Pending' },
])
</script>
