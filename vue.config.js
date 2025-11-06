const { defineConfig } = require('@vue/cli-service');

module.exports = defineConfig({
  transpileDependencies: true,
  devServer: {
    port: 5001, // Use port 5001 which is already authorized in Google OAuth
    proxy: {
      '/api': {
        target: 'http://localhost:5000', // Your Express backend
        changeOrigin: true,
        secure: false,
      },
    },
  },
});
