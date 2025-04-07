import { defineConfig } from 'vite';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

// Obtener la ruta del directorio raíz del proyecto
const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Función auxiliar para leer la estructura de directorios
async function readShaderStructure(dir) {
  const structure = {};
  
  try {
    const entries = await fs.readdir(dir, { withFileTypes: true });
    
    for (const entry of entries) {
      // Ignorar archivos y directorios que empiezan con punto
      if (entry.name.startsWith('.')) continue;
      
      if (entry.isDirectory()) {
        const chapterPath = path.join(dir, entry.name);
        const chapterStats = await fs.stat(chapterPath); // Obtener stats del capítulo
        const exercises = {};
        
        // Leer los ejercicios dentro del capítulo
        const exerciseEntries = await fs.readdir(chapterPath, { withFileTypes: true });
        
        for (const exerciseEntry of exerciseEntries) {
          if (exerciseEntry.isDirectory()) {
            const fragmentPath = path.join(chapterPath, exerciseEntry.name, 'fragment.glsl');
            try {
              const fragmentStats = await fs.stat(fragmentPath); // Obtener stats del archivo
              exercises[exerciseEntry.name] = {
                name: exerciseEntry.name,
                createdAt: fragmentStats.birthtime.toISOString() // Añadir fecha de creación
              };
            } catch (error) {
              // Si no existe fragment.glsl, ignorar este ejercicio
              continue;
            }
          }
        }
        
        // Solo añadir el capítulo si tiene ejercicios
        if (Object.keys(exercises).length > 0) {
          structure[entry.name] = {
            name: entry.name,
            exercises,
            createdAt: chapterStats.birthtime.toISOString() // Añadir fecha de creación
          };
        }
      }
    }
    
    return structure;
  } catch (error) {
    console.error('Error reading shader structure:', error);
    throw error;
  }
}

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
    name: 'shader-server',
    configureServer(server) {
      server.middlewares.use(async (req, res, next) => {
        if (req.url === '/api/list-shaders') {
          try {
            // Construir la ruta al directorio de shaders
            const shadersDir = path.join(__dirname, 'src', 'shaders');
            console.log('Reading shaders from:', shadersDir);
            
            // Leer la estructura de directorios
            const structure = await readShaderStructure(shadersDir);
            console.log('Shader structure:', JSON.stringify(structure, null, 2));
            
            // Enviar la respuesta
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify({
              success: true,
              structure
            }));
          } catch (error) {
            console.error('Error listing shaders:', error);
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify({
              success: false,
              error: error.message
            }));
          }
        } else if (req.url === '/api/save-shader' && req.method === 'POST') {
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