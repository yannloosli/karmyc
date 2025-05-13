import react from "@vitejs/plugin-react";
import path from "path";
import { defineConfig } from "vite";

export default defineConfig({
    plugins: [react()],
    resolve: {
        alias: {
            "@gamesberry/karmyc-core": path.resolve(__dirname, "../karmyc-core"),
            "@gamesberry/karmyc-shared": path.resolve(__dirname, "../karmyc-shared"),
            "src": path.resolve(__dirname, "src")
        }
        // preserveSymlinks: true // Je commente cette ligne
    },
    build: {
        outDir: "./dist"
    }
}); 
