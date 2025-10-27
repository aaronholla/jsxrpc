import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import { cloudflare } from "@cloudflare/vite-plugin";
import { reactNativeCSS } from "vite-plugin-react-native-css";

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), cloudflare(), reactNativeCSS()],
  resolve: {
    dedupe: ["react", "react-dom"],
  },
});
