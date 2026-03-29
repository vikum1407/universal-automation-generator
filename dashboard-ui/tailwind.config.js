export default {
  darkMode: "class",
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          primary: "#7B3FF2",
          primaryDark: "#5A2BC2",
          primaryLight: "#A57CFF",
          secondary: "#2ED8A7",
          blue: "#3A7BFF",
          purple: "#7B3FF2",
        },
        neutral: {
          dark: "#1F2937",
          mid: "#6B7280",
          light: "#E5E7EB",
        }
      },

      borderRadius: {
        card: "12px",
      },

      boxShadow: {
        card: "0 2px 8px rgba(0,0,0,0.06)",
      },

      spacing: {
        section: "32px",
      },

      fontSize: {
        h1: ["28px", "1.2"],
        h2: ["22px", "1.3"],
        h3: ["18px", "1.4"],
        body: ["15px", "1.6"],
        caption: ["13px", "1.4"],
      },
    },
  },
  plugins: [],
};
