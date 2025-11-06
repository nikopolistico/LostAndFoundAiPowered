<template>
  <div class="min-h-screen bg-gray-950 flex flex-col items-center py-10 px-4 space-y-10">
    <!-- Page Title -->
    <h1 class="text-2xl font-bold text-yellow-400 mb-6">Matched Item Details</h1>

    <!-- Lost Item Card -->
    <div class="w-full max-w-lg bg-gray-900 rounded-xl shadow-lg p-6 text-white">
      <h2 class="text-xl font-semibold mb-4 text-yellow-400">Lost Item</h2>
      <div class="w-full flex justify-center mb-4">
        <img
          v-if="match.lostItem?.preview"
          :src="match.lostItem.preview"
          alt="Lost Item Image"
          class="w-64 h-64 object-cover rounded-lg border-4 border-red-500"
        />
        <div
          v-else
          class="w-64 h-64 flex items-center justify-center bg-gray-700 text-gray-300 rounded-lg border-4 border-red-500"
        >
          No Image
        </div>
      </div>
      <p class="mb-1"><strong>Category:</strong> {{ match.lostItem?.category || 'Uncategorized' }}</p>
      <p class="mb-1" v-if="match.lostItem?.type"><strong>Type:</strong> {{ match.lostItem.type }}</p>
      <p class="mb-1" v-if="match.lostItem?.brand"><strong>Brand:</strong> {{ match.lostItem.brand }}</p>
      <p class="mb-1" v-if="match.lostItem?.color"><strong>Color:</strong> {{ match.lostItem.color }}</p>
      <p class="mb-1" v-if="match.lostItem?.studentId"><strong>Student ID:</strong> {{ match.lostItem.studentId }}</p>
      <p class="mb-1" v-if="match.lostItem?.course"><strong>Course/Program:</strong> {{ match.lostItem.course }}</p>
      <p class="mb-1" v-if="match.lostItem?.ownerName"><strong>Owner Name:</strong> {{ match.lostItem.ownerName }}</p>
      <p class="mb-4" v-if="match.lostItem?.description"><strong>Description:</strong> {{ match.lostItem.description }}</p>
      <p class="mb-1"><strong>Status:</strong> {{ match.lostItem?.status || 'Pending' }}</p>
      <p class="mb-4" v-if="match.lostItem?.date"><strong>Reported On:</strong> {{ match.lostItem.date }}</p>
    </div>

    <!-- Found Item Card -->
    <div class="w-full max-w-lg bg-gray-900 rounded-xl shadow-lg p-6 text-white">
      <h2 class="text-xl font-semibold mb-4 text-green-400">Found Item (Matched)</h2>
      <div class="w-full flex justify-center mb-4">
        <img
          v-if="match.foundItem?.preview"
          :src="match.foundItem.preview"
          alt="Found Item Image"
          class="w-64 h-64 object-cover rounded-lg border-4 border-green-500"
        />
        <div
          v-else
          class="w-64 h-64 flex items-center justify-center bg-gray-700 text-gray-300 rounded-lg border-4 border-green-500"
        >
          No Image
        </div>
      </div>
      <p class="mb-1"><strong>Category:</strong> {{ match.foundItem?.category || 'Uncategorized' }}</p>
      <p class="mb-1" v-if="match.foundItem?.type"><strong>Type:</strong> {{ match.foundItem.type }}</p>
      <p class="mb-1" v-if="match.foundItem?.brand"><strong>Brand:</strong> {{ match.foundItem.brand }}</p>
      <p class="mb-1" v-if="match.foundItem?.color"><strong>Color:</strong> {{ match.foundItem.color }}</p>
      <p class="mb-1" v-if="match.foundItem?.studentId"><strong>Student ID:</strong> {{ match.foundItem.studentId }}</p>
      <p class="mb-1" v-if="match.foundItem?.course"><strong>Course/Program:</strong> {{ match.foundItem.course }}</p>
      <p class="mb-1" v-if="match.foundItem?.ownerName"><strong>Owner Name:</strong> {{ match.foundItem.ownerName }}</p>
      <p class="mb-4" v-if="match.foundItem?.description"><strong>Description:</strong> {{ match.foundItem.description }}</p>
      <p class="mb-1"><strong>Status:</strong> {{ match.foundItem?.status || 'Pending' }}</p>
      <p class="mb-4" v-if="match.foundItem?.date"><strong>Reported On:</strong> {{ match.foundItem.date }}</p>
    </div>

    <!-- Back Button -->
    <button
      @click="$router.push('/userdashboard')"
      class="w-full max-w-lg py-3 rounded-xl bg-yellow-500 text-black font-semibold hover:bg-yellow-600 transition"
    >
      Back to Dashboard
    </button>
  </div>
</template>

<script>
export default {
  name: "MatchDetails",
  data() {
    return {
      match: {
        lostItem: {},
        foundItem: {}
      },
    };
  },
  mounted() {
    // Load the selected match from localStorage
    const storedMatch = localStorage.getItem("selectedMatch");
    if (storedMatch) {
      this.match = JSON.parse(storedMatch);
    }
  },
};
</script>

<style scoped>
::-webkit-scrollbar {
  width: 6px;
}
::-webkit-scrollbar-thumb {
  background-color: #facc15;
  border-radius: 3px;
}
</style>
