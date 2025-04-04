import express from 'express';
import { promises as fs } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import cors from 'cors';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 5173; // Usar el mismo puerto que Vite

// Cache para la estructura de shaders
let shadersCache = null;
let lastCacheUpdate = 0;
const CACHE_TTL = 300000; // 5 minutos de tiempo de vida para la caché

// Middleware para parsear JSON
app.use(express.json());

// Configurar CORS
app.use(cors());

// Servir archivos estáticos
app.use(express.static('src'));

// Función para obtener la estructura de shaders
async function getShaderStructure() {
    const shadersDir = path.join(__dirname, 'src', 'shaders');
    
    try {
        await fs.access(shadersDir);
    } catch (err) {
        await fs.mkdir(shadersDir, { recursive: true });
        return {};
    }
    
    const chapters = await fs.readdir(shadersDir);
    const structure = {};
    
    // Leer todos los directorios en paralelo
    const chapterPromises = chapters.map(async (chapter) => {
        const chapterPath = path.join(shadersDir, chapter);
        try {
            const chapterStats = await fs.stat(chapterPath);
            if (!chapterStats.isDirectory()) return null;
            
            const exercises = await fs.readdir(chapterPath);
            const exercisePromises = exercises.map(async (exercise) => {
                const exercisePath = path.join(chapterPath, exercise);
                const fragmentPath = path.join(exercisePath, 'fragment.glsl');
                
                try {
                    const exerciseStats = await fs.stat(exercisePath);
                    if (!exerciseStats.isDirectory()) return null;
                    
                    await fs.access(fragmentPath);
                    return { name: exercise };
                } catch (err) {
                    return null;
                }
            });
            
            const exerciseResults = await Promise.all(exercisePromises);
            const exerciseMap = {};
            
            exerciseResults.forEach((result, index) => {
                if (result) {
                    exerciseMap[exercises[index]] = result;
                }
            });
            
            if (Object.keys(exerciseMap).length > 0) {
                return {
                    chapter,
                    data: {
                        name: chapter,
                        exercises: exerciseMap
                    }
                };
            }
        } catch (err) {
            return null;
        }
        return null;
    });
    
    const results = await Promise.all(chapterPromises);
    results.forEach(result => {
        if (result) {
            structure[result.chapter] = result.data;
        }
    });
    
    return structure;
}

// Endpoint para listar shaders
app.get('/api/list-shaders', async (req, res) => {
    try {
        const now = Date.now();
        
        // Usar caché si está disponible y no ha expirado
        if (shadersCache && (now - lastCacheUpdate) < CACHE_TTL) {
            return res.json({ success: true, structure: shadersCache });
        }
        
        // Actualizar caché
        shadersCache = await getShaderStructure();
        lastCacheUpdate = now;
        
        res.json({ success: true, structure: shadersCache });
    } catch (error) {
        console.error('Error listando shaders:', error);
        res.status(500).json({ 
            success: false, 
            error: 'Error interno del servidor: ' + error.message 
        });
    }
});

// Endpoint para guardar shaders
app.post('/api/save-shader', async (req, res) => {
    console.log('Recibida solicitud para guardar shader');
    try {
        const { content, path: filePath, isNew } = req.body;
        console.log('Datos recibidos:', { filePath, isNew: !!isNew, contentLength: content ? content.length : 0 });

        // Validar datos
        if (!content || !filePath) {
            console.error('Datos inválidos:', { content: !!content, filePath: !!filePath });
            return res.status(400).json({ 
                success: false, 
                error: 'Contenido y ruta son requeridos' 
            });
        }

        // Asegurarse de que el directorio existe
        const dirPath = path.dirname(filePath);
        console.log('Creando directorio si no existe:', dirPath);
        await fs.mkdir(dirPath, { recursive: true });

        // Si es un nuevo shader, verificar que no existe
        if (isNew) {
            console.log('Verificando si el shader ya existe');
            try {
                await fs.access(filePath);
                console.error('El shader ya existe:', filePath);
                return res.status(400).json({ 
                    success: false, 
                    error: 'El shader ya existe' 
                });
            } catch (err) {
                console.log('El shader no existe, podemos continuar');
            }
        }

        // Guardar el archivo
        console.log('Guardando archivo en:', filePath);
        await fs.writeFile(filePath, content, 'utf8');
        console.log('Archivo guardado correctamente');

        // Invalidar caché después de guardar
        shadersCache = null;

        res.json({ success: true });
    } catch (error) {
        console.error('Error guardando shader:', error);
        res.status(500).json({ 
            success: false, 
            error: 'Error interno del servidor: ' + error.message 
        });
    }
});

app.listen(PORT, () => {
    console.log(`Servidor corriendo en http://localhost:${PORT}`);
}); 