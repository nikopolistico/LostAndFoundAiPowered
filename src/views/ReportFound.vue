<template>
  <div class="min-h-screen flex flex-col items-center justify-center bg-gray-950 px-4">
    <div class="bg-gray-900 rounded-xl shadow-xl w-full max-w-lg p-6 border border-gray-800">
      <h1 class="text-2xl font-bold text-brand-yellow mb-6 text-center">Report Found Item</h1>
      <form @submit.prevent="submitFoundReport">
        <!-- Step 1: Dropdown only -->
        <div v-if="step === 1" class="mb-4">
          <label class="block font-semibold mb-2 text-white">Step 1: Choose Item Type</label>
          <p class="text-sm text-gray-300 mb-2">Is the found item a Student ID or a General Item?</p>
          <select v-model="foundItem.type" class="w-full p-2 rounded border bg-gray-800 text-white">
            <option disabled value="">Select type</option>
            <option value="Student ID">Student ID</option>
            <option value="General Item">General Item</option>
          </select>
          <button
            type="button"
            :disabled="!foundItem.type"
            @click="step = 2"
            class="mt-4 w-full py-2 rounded bg-green-600 text-white font-semibold hover:bg-green-700 disabled:opacity-50"
          >Next</button>
        </div>
        <!-- Steps 2-8: Show only after dropdown selection -->
        <div v-else>
          <!-- Step 2 -->
          <div v-if="step === 2" class="mb-4">
            <label class="block font-semibold mb-2 text-white">Step 2: Upload Item Image</label>
            <p class="text-sm text-gray-300 mb-2">Upload an image of the found item.</p>
            <input type="file" @change="handleImageUpload" accept="image/*" class="w-full bg-gray-800 text-white"/>
          </div>
          <!-- Step 3 -->
          <div v-else-if="step === 3" class="mb-4">
            <label class="block font-semibold mb-2 text-white">Step 3: Item Description</label>
            <p class="text-sm text-gray-300 mb-2">Provide a brief description (color, brand, size, marks).</p>
            <input v-model="foundItem.description" type="text" class="w-full p-2 rounded border bg-gray-800 text-white" placeholder="e.g., Red backpack, Samsung phone"/>
          </div>
          <!-- Step 4 -->
          <div v-else-if="step === 4" class="mb-4">
            <label class="block font-semibold mb-2 text-white">Step 4: Location Found</label>
            <p class="text-sm text-gray-300 mb-2">Where did you find the item?</p>
            <input v-model="foundItem.location" type="text" class="w-full p-2 rounded border bg-gray-800 text-white" placeholder="e.g., Library, Cafeteria"/>
          </div>
          <!-- Step 5 -->
          <div v-else-if="step === 5" class="mb-4">
            <label class="block font-semibold mb-2 text-white">Step 5: Date and Time Found</label>
            <p class="text-sm text-gray-300 mb-2">When did you find the item?</p>
            <input v-model="foundItem.datetime" type="datetime-local" class="w-full p-2 rounded border bg-gray-800 text-white"/>
          </div>
          <!-- Step 6 -->
          <div v-else-if="step === 6" class="mb-4">
            <label class="block font-semibold mb-2 text-white">Step 6: Found By (optional)</label>
            <p class="text-sm text-gray-300 mb-2">Enter your name (optional).</p>
            <input v-model="foundItem.foundBy" type="text" class="w-full p-2 rounded border bg-gray-800 text-white" placeholder="Your name (optional)"/>
          </div>
          <!-- Step 7 -->
          <div v-else-if="step === 7" class="mb-4">
            <label class="block font-semibold mb-2 text-white">Step 7: Additional Notes (optional)</label>
            <p class="text-sm text-gray-300 mb-2">Add any extra details (optional).</p>
            <textarea v-model="foundItem.notes" class="w-full p-2 rounded border bg-gray-800 text-white" placeholder="Any extra details"></textarea>
          </div>
          <!-- Step 8 -->
          <div v-else-if="step === 8" class="mb-4">
            <label class="block font-semibold mb-2 text-white">Step 8: Submit Report</label>
            <p class="mb-2 text-gray-300">Review your information before submitting.</p>
            <button type="submit" class="w-full py-2 rounded bg-green-600 text-white font-semibold hover:bg-green-700">Submit Report</button>
          </div>
          <!-- Step 9 -->
          <div v-else-if="step === 9" class="mb-4">
            <label class="block font-semibold mb-2 text-white">Step 9: Delivery and Claiming</label>
            <p class="text-gray-300">
              Please deliver the found item to
              <span v-if="foundItem.type === 'Student ID'">OSAS</span>
              <span v-else>the Security Office</span>
              for secure storage and claiming.
            </p>
            <button @click="resetForm" class="mt-4 w-full py-2 rounded bg-gray-700 text-white font-semibold hover:bg-gray-800">Done</button>
          </div>
          <!-- Navigation Buttons -->
          <div class="flex justify-between mt-4" v-if="step > 2 && step < 8">
            <button type="button" @click="step--" class="px-4 py-2 rounded bg-gray-300 text-black hover:bg-gray-400">Back</button>
            <button
              type="button"
              :disabled="!canProceed"
              @click="nextStep"
              class="px-4 py-2 rounded bg-green-600 text-white hover:bg-green-700 disabled:opacity-50"
            >Next</button>
          </div>
        </div>
      </form>
    </div>
  </div>
</template>

<script>
export default {
  name: 'ReportFound',
  data() {
    return {
      step: 1,
      foundItem: {
        type: '',
        image: null,
        description: '',
        location: '',
        datetime: '',
        foundBy: '',
        notes: ''
      }
    }
  },
  computed: {
    canProceed() {
      switch (this.step) {
        case 2: return !!this.foundItem.image;
        case 3: return !!this.foundItem.description;
        case 4: return !!this.foundItem.location;
        case 5: return !!this.foundItem.datetime;
        default: return true;
      }
    }
  },
  methods: {
    handleImageUpload(event) {
      const file = event.target.files[0];
      this.foundItem.image = file;
    },
    nextStep() {
      if (this.canProceed && this.step < 8) {
        this.step++;
      }
    },
    submitFoundReport() {
      // No backend integration yet
      this.step = 9;
    },
    resetForm() {
      this.step = 1;
      this.foundItem = {
        type: '',
        image: null,
        description: '',
        location: '',
        datetime: '',
        foundBy: '',
        notes: ''
      };
    }
  }
}
</script>