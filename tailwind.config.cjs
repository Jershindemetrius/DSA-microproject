module.exports = {
  content: [
    "./index.html",
    "./src/**/*.{js,jsx,ts,tsx}"
  ],
  theme: {
    extend: {
      colors: {
        primary: "#1e3a8a", // navy blue
        secondary: "#f3f4f6", // light gray
        success: "#10b981", // green
        warning: "#f59e0b", // orange
        danger: "#ef4444", // red
        info: "#6b7280" // gray
      }
    }
  },
  plugins: []
};
