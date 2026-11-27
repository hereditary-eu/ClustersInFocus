import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  base: "/cif",
  // the compute worker imports wasm-bindgen output, which locates its .wasm through import.meta.url
  worker: { format: "es" },
});
