<template>
  <div
    class="min-h-screen flex flex-col justify-between bg-gradient-to-b from-gray-950 via-gray-900 to-gray-950 text-white"
  >
    <!-- Top Navigation -->
    <header class="flex justify-between items-center p-6">
      <div class="flex items-center space-x-2">
        <div
          class="w-10 h-10 rounded-full bg-brand-yellow flex items-center justify-center"
        >
          <span class="text-black text-2xl font-bold">🔍</span>
        </div>
        <h1 class="text-lg sm:text-xl font-bold">CSU Lost & Found</h1>
      </div>
    </header>

    <!-- Hero Section -->
    <main
      class="flex flex-col items-center justify-center text-center px-6 py-10 sm:py-20 animate-fade-in"
    >
      <div
        class="w-28 h-28 sm:w-32 sm:h-32 rounded-full bg-brand-yellow flex items-center justify-center mb-6 shadow-lg"
      >
        <span class="text-black text-5xl sm:text-6xl font-bold">🔍</span>
      </div>

      <h2 class="text-3xl sm:text-5xl font-extrabold mb-4">
        Lost Something? We’ll Help You Find It.
      </h2>
      <p
        class="text-gray-400 max-w-xl text-sm sm:text-base leading-relaxed"
      >
        The CSU Lost & Found System simplifies the process of reporting, locating, 
        and reclaiming lost belongings on campus. With AI-powered image recognition, 
        we help students reconnect with their items quickly, securely, and efficiently.
      </p>

      <!-- Call to Action -->
      <RouterLink
        to="/login"
        class="mt-8 px-6 py-3 sm:px-8 sm:py-3.5 bg-brand-yellow text-black font-semibold rounded-xl
               hover:bg-yellow-400 transition duration-300 transform hover:scale-105 shadow-lg"
      >
        🚀 Get Started – Sign In
      </RouterLink>
    </main>

    <!-- About Us Section -->
    <section
      class="px-6 py-14 bg-gray-900/40 backdrop-blur-sm text-center border-t border-gray-800"
    >
      <h3 class="text-2xl sm:text-3xl font-bold mb-4">About Us</h3>
      <p
        class="text-gray-400 max-w-3xl mx-auto text-sm sm:text-base leading-relaxed mb-6"
      >
        The CSU Lost & Found System was developed by a dedicated team of Caraga State University students 
        to enhance campus safety and accountability. We understand the frustration of losing important belongings— 
        that’s why our goal is to provide a digital platform that connects finders and owners seamlessly.  
      </p>

      <p
        class="text-gray-400 max-w-3xl mx-auto text-sm sm:text-base leading-relaxed"
      >
        Our system integrates modern technologies like AI-driven image recognition and intelligent data matching 
        to ensure accurate and fair identification of lost items. By digitizing the lost-and-found process, 
        CSU students and staff can report, verify, and claim items with ease — fostering a more organized and 
        trustworthy campus environment.
      </p>
    </section>

    <!-- Footer -->
    <footer class="text-center py-6 text-gray-500 text-sm border-t border-gray-800">
      © {{ new Date().getFullYear() }} Caraga State University • Lost & Found System
    </footer>
  </div>
</template>

<script setup>
// No additional logic yet
</script>

<style scoped>
@keyframes fade-in {
  from {
    opacity: 0;
    transform: translateY(15px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.animate-fade-in {
  animation: fade-in 1.2s ease-in-out;
}
</style>
