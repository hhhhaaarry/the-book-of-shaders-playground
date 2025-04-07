import express from "express";
import { promises as fs } from "fs";
import path from "path";
import { fileURLToPath } from "url";
import cors from "cors";

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
app.use(express.static("src"));

// Función para obtener la estructura de shaders
async function getShaderStructure() {
  const shadersDir = path.join(__dirname, "src", "shaders");

  try {
    await fs.access(shadersDir);
  } catch (err) {
    await fs.mkdir(shadersDir, { recursive: true });
    return {};
  }

  const chapters = await fs.readdir(shadersDir);
  const structure = {};

  const chapterPromises = chapters.map(async (chapter) => {
    const chapterPath = path.join(shadersDir, chapter);
    try {
      const chapterStats = await fs.stat(chapterPath);
      if (!chapterStats.isDirectory()) return null;

      const exercises = await fs.readdir(chapterPath);
      const exercisePromises = exercises.map(async (exercise) => {
        const exercisePath = path.join(chapterPath, exercise);
        const fragmentPath = path.join(exercisePath, "fragment.glsl");

        try {
          const exerciseStats = await fs.stat(exercisePath);
          if (!exerciseStats.isDirectory()) return null;

          const fragmentStats = await fs.stat(fragmentPath);
          return {
            name: exercise,
            createdAt: fragmentStats.birthtime.toISOString(),
          };
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
            exercises: exerciseMap,
            createdAt: chapterStats.birthtime.toISOString(),
          },
        };
      }
    } catch (err) {
      return null;
    }
  });

  const results = await Promise.all(chapterPromises);
  results.forEach((result) => {
    if (result) {
      structure[result.chapter] = result.data;
    }
  });

  return structure;
}

// Endpoint para listar shaders
app.get("/api/list-shaders", async (req, res) => {
  try {
    const now = Date.now();

    // Usar caché si está disponible y no ha expirado
    if (shadersCache && now - lastCacheUpdate < CACHE_TTL) {
      return res.json({ success: true, structure: shadersCache });
    }

    // Actualizar caché
    shadersCache = await getShaderStructure();
    lastCacheUpdate = now;

    res.json({ success: true, structure: shadersCache });
  } catch (error) {
    console.error("Error listando shaders:", error);
    res.status(500).json({
      success: false,
      error: "Error interno del servidor: " + error.message,
    });
  }
});

// Función auxiliar para borrar un directorio recursivamente
async function removeDirectory(dirPath) {
  try {
    const items = await fs.readdir(dirPath);
    for (const item of items) {
      const itemPath = path.join(dirPath, item);
      const stat = await fs.stat(itemPath);

      if (stat.isDirectory()) {
        await removeDirectory(itemPath);
      } else {
        await fs.unlink(itemPath);
      }
    }
    await fs.rmdir(dirPath);
    console.log("Directorio borrado:", dirPath);
  } catch (err) {
    if (err.code !== "ENOENT") {
      throw err;
    }
  }
}

// Endpoint para guardar shaders
app.post("/api/save-shader", async (req, res) => {
  console.log("Recibida solicitud para guardar/borrar shader");
  try {
    const {
      content,
      path: filePath,
      delete: shouldDelete,
      chapter,
      exercise,
    } = req.body;
    console.log("Datos recibidos:", {
      filePath,
      chapter,
      exercise,
      shouldDelete,
    });

    // Si es una operación de borrado
    if (shouldDelete) {
      // Validar que tenemos chapter y exercise para borrado
      if (!chapter || !exercise) {
        return res.status(400).json({
          success: false,
          error: "Se requieren chapter y exercise para borrar",
        });
      }

      console.log("Operación de borrado para ejercicio:", {
        chapter,
        exercise,
      });

      // Construir la ruta del directorio del ejercicio
      const exercisePath = path.join(
        __dirname,
        "src",
        "shaders",
        chapter,
        exercise
      );
      console.log("Borrando directorio:", exercisePath);

      try {
        // Verificar si el directorio existe
        await fs.access(exercisePath);

        // Borrar todos los archivos en el directorio
        const files = await fs.readdir(exercisePath);
        for (const file of files) {
          await fs.unlink(path.join(exercisePath, file));
        }

        // Borrar el directorio vacío
        await fs.rmdir(exercisePath);
        console.log("Directorio del ejercicio borrado:", exercisePath);

        // Intentar borrar el directorio del capítulo si está vacío
        const chapterPath = path.join(__dirname, "src", "shaders", chapter);
        const remainingExercises = await fs.readdir(chapterPath);
        if (remainingExercises.length === 0) {
          await fs.rmdir(chapterPath);
          console.log("Directorio del capítulo borrado:", chapterPath);
        }

        // Invalidar caché
        shadersCache = null;

        return res.json({ success: true });
      } catch (err) {
        if (err.code === "ENOENT") {
          console.log("El directorio ya no existe:", exercisePath);
          return res.json({ success: true });
        }
        throw err;
      }
    }

    // Para operaciones de guardado normal
    if (!filePath) {
      return res.status(400).json({
        success: false,
        error: "Se requiere path para guardar",
      });
    }

    if (!content) {
      return res.status(400).json({
        success: false,
        error: "Se requiere content para guardar",
      });
    }

    // Asegurarse de que el directorio existe
    const dirPath = path.dirname(filePath);
    console.log("Creando directorio si no existe:", dirPath);
    await fs.mkdir(dirPath, { recursive: true });

    // Si es un nuevo shader, verificar que no existe
    if (shouldDelete) {
      console.log("Verificando si el shader ya existe");
      try {
        await fs.access(filePath);
        console.error("El shader ya existe:", filePath);
        return res.status(400).json({
          success: false,
          error: "El shader ya existe",
        });
      } catch (err) {
        console.log("El shader no existe, podemos continuar");
      }
    }

    // Guardar el archivo
    console.log("Guardando archivo en:", filePath);
    await fs.writeFile(filePath, content, "utf8");
    console.log("Archivo guardado correctamente");

    // Invalidar caché después de guardar
    shadersCache = null;

    res.json({ success: true });
  } catch (error) {
    console.error("Error en operación de shader:", error);
    res.status(500).json({
      success: false,
      error: "Error interno del servidor: " + error.message,
    });
  }
});

app.listen(PORT, () => {
  console.log(`Servidor corriendo en http://localhost:${PORT}`);
});
