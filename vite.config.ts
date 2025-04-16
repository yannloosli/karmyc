import react from "@vitejs/plugin-react";
import path from "path";
import { defineConfig } from "vite";

export default defineConfig({
    plugins: [react()],
    resolve: {
        alias: {
            "~": path.resolve(__dirname, "lib"),
        },
    },
    root: "examples", // Entry point for the development server
    build: {
        outDir: "../dist-examples",
    },
    publicDir: "examples/public",
});
