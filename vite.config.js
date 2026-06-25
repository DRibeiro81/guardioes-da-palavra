import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
// content/ fica fora de src/ — o Felipe popula content/exercicios.json.
// Importamos o JSON diretamente (resolveJsonModule), então liberamos fs allow.
export default defineConfig({
    // base relativo pra funcionar em subpath (GitHub Pages: /guardioes-da-palavra/)
    base: "./",
    plugins: [react()],
    server: {
        fs: {
            allow: [".."],
        },
    },
});
