import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        birikim: {
          DEFAULT: "#c1272d",
          dark: "#8f1418",
          light: "#e6a4a8",
          track: "#f1d9da",
        },
      },
    },
  },
  plugins: [],
};

export default config;
