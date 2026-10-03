import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        cream: "#FFF9F2",
        sand: "#F7EEDD",
        honey: "#FFB627",
        honeydark: "#E09A00",
        coral: "#FF6B6B",
        berry: "#7C5CBF",
        berrydeep: "#5B3E9E",
        leaf: "#4CAF7D",
        skypop: "#4AA8DE",
        cocoa: "#4A3728",
      },
      borderRadius: {
        "4xl": "2rem",
      },
      fontFamily: {
        rounded: ['"Nunito"', "ui-rounded", "SF Pro Rounded", "system-ui", "sans-serif"],
      },
      boxShadow: {
        soft: "0 8px 30px rgba(74, 55, 40, 0.10)",
        pop: "0 12px 40px rgba(255, 107, 107, 0.25)",
      },
    },
  },
  plugins: [],
};

export default config;
