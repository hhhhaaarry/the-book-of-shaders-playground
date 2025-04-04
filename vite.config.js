import { defineConfig } from 'vite';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

// Obtener la ruta del directorio raíz del proyecto
const __dirname = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  server: {
    open: true,
    proxy: {
      '/api': {
        target: 'http://localhost:5173',
        changeOrigin: true
      }
    }
  },
  plugins: [{
    name: 'shader-save',
    configureServer(server) {
      server.middlewares.use(async (req, res, next) => {
        if (req.url === '/api/save-shader' && req.method === 'POST') {
          let data = '';
          
          // Recoger los datos de la petición
          req.on('data', chunk => {
            data += chunk;
          });

          // Cuando termine de recibir datos
          req.on('end', async () => {
            try {
              const { content, path: filePath } = JSON.parse(data);
              
              if (!content || !filePath) {
                res.setHeader('Content-Type', 'application/json');
                res.end(JSON.stringify({
                  success: false,
                  error: 'Missing content or path'
                }));
                return;
              }

              // Construir la ruta absoluta
              const absolutePath = path.join(__dirname, filePath);
              console.log('Guardando shader en:', absolutePath);
              
              // Asegurarse de que el directorio existe
              await fs.mkdir(path.dirname(absolutePath), { recursive: true });
              
              // Guardar el archivo
              await fs.writeFile(absolutePath, content, 'utf-8');
              
              // Enviar respuesta de éxito
              res.setHeader('Content-Type', 'application/json');
              res.end(JSON.stringify({
                success: true,
                path: absolutePath
              }));
            } catch (error) {
              console.error('Error saving shader:', error);
              res.setHeader('Content-Type', 'application/json');
              res.end(JSON.stringify({
                success: false,
                error: error.message
              }));
            }
          });
        } else {
          next();
        }
      });
    }
  }],
  assetsInclude: ['**/*.glsl'],
  build: {
    rollupOptions: {
      output: {
        assetFileNames: (assetInfo) => {
          if (assetInfo.name.endsWith('.glsl')) {
            return 'assets/shaders/[name][extname]';
          }
          return 'assets/[name]-[hash][extname]';
        }
      }
    }
  }
}); 