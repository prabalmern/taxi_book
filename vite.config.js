import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// Replace 'your-repo-name' with your actual GitHub repository name
export default defineConfig({
  base: "/taxi_book/",
  plugins: [react()],
});
