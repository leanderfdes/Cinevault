/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        bg: "rgb(var(--bg))",
        card: "rgb(var(--card))",
        text: "rgb(var(--text))",
        muted: "rgb(var(--muted))",
        border: "rgb(var(--border))",
        accent: "rgb(var(--accent))",
      },
      boxShadow: {
        glow: "0 0 0 1px rgba(255,255,255,.06), 0 20px 60px rgba(0,0,0,.55)",
      },
    },
  },
  plugins: [],
};
