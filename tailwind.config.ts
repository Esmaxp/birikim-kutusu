import { brand } from "./src/lib/theme";
import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  safelist: [{ pattern: /^(bg|text|border|ring|from|to)-birikim-(50|100|200|300|400|500|600|700|800|900)$/ }],
  theme: {
    extend: {
      fontFamily: { sans: ["var(--font-sans)", "system-ui", "sans-serif"] },
      boxShadow: { card: "0 2px 10px rgb(15 23 42 / 0.035)" },
      colors: {
        birikim: brand,
      },
    },
  },
  plugins: [],
};

export default config;
