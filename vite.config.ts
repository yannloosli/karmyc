import react from "@vitejs/plugin-react";
import path from "path";
import { defineConfig, Plugin } from "vite";

// Notre propre plugin d'édition simplifié
function customEditorPlugin(): Plugin {
    return {
        name: 'custom-editor-plugin',
        configureServer(server) {
            // Injecter un script dans toutes les pages HTML servies
            server.middlewares.use((req, res, next) => {
                // Ne pas interférer avec les requêtes non-HTML
                if (req.url && !req.url.endsWith('.html') && !req.url.endsWith('/')) {
                    return next();
                }

                // Le middleware transform de Vite est appelé après cette fonction
                const originalTransform = res.write;

                // @ts-ignore
                res.write = function (chunk, ...args) {
                    if (chunk && typeof chunk === 'string') {
                        // Injecter notre script personnalisé juste avant la fermeture du body
                        const customScript = `
            <script>
              // Script pour personnaliser les erreurs en runtime et permettre d'ouvrir les fichiers
              window.addEventListener('error', function(event) {
                console.log('Captured error:', event);
                
                // Intercepter les clics sur les liens d'erreur stack trace
                document.addEventListener('click', function(e) {
                  const target = e.target;
                  if (target && target.tagName === 'A' && target.textContent && target.textContent.includes('.tsx')) {
                    e.preventDefault();
                    
                    // Extraire le chemin du fichier et la ligne du lien
                    const match = target.textContent.match(/([\\w\\.-]+\\.(tsx|jsx|ts|js)(?::[\\d]+(?::[\\d]+)?)?)/);
                    if (match) {
                      const fileParts = match[1].split(':');
                      const filePath = fileParts[0];
                      const line = fileParts[1];
                      const column = fileParts[2];
                      
                      console.log('Opening file via custom server:', filePath, line, column);
                      
                      // Appeler notre serveur custom pour ouvrir le fichier
                      fetch(\`http://localhost:9310/open?file=\${encodeURIComponent(filePath)}&line=\${line || ''}&column=\${column || ''}\`)
                        .then(response => {
                          if (!response.ok) {
                            throw new Error('Failed to open file');
                          }
                          console.log('File opened successfully');
                        })
                        .catch(error => {
                          console.error('Error opening file:', error);
                        });
                    }
                  }
                });
              });
            </script>`;

                        const finalHtml = chunk.replace('</body>', `${customScript}</body>`);
                        // @ts-ignore
                        return originalTransform.call(this, finalHtml, ...args);
                    }
                    // @ts-ignore
                    return originalTransform.call(this, chunk, ...args);
                };

                next();
            });
        }
    };
}

export default defineConfig({
    plugins: [
        react(),
        customEditorPlugin()
    ],
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
