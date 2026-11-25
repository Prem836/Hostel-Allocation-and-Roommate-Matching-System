import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "var(--background)",
        foreground: "var(--foreground)",
        brand: {
          DEFAULT: '#659287',
          primary: '#659287',
          secondary: '#88BDA4',
          mint: '#B1D3B9',
          light: '#E6F2DD',
          dark: '#1e3831',
          forest: '#26463d',
        },
        palette: {
          deep: '#659287',
          sea: '#88BDA4',
          mint: '#B1D3B9',
          honeydew: '#E6F2DD',
        },
      },
    },
  },
  plugins: [],
};
export default config;
