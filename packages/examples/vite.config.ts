import react from "@vitejs/plugin-react";
import path from "path";
import { defineConfig } from "vite";

export default defineConfig({
    plugins: [react()],
    resolve: {
        alias: {
            "@gamesberry/karmyc-core": path.resolve(__dirname, "../core/src"),
            "@gamesberry/karmyc-shared": path.resolve(__dirname, "../shared/src"),
            "@gamesberry/karmyc-area-projects": path.resolve(__dirname, "../area-projects/src"),
            "src": path.resolve(__dirname, "src")
        }
    },
    build: {
        outDir: "./dist"
    }
}); 
