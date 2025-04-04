# The Book of Shaders Playground

Un playground interactivo para experimentar con los shaders del libro "The Book of Shaders".

## Características

- Visualización en tiempo real de shaders
- Uniforms automáticos:
  - `u_time`: Tiempo transcurrido
  - `u_resolution`: Resolución de la pantalla
  - `u_mouse`: Posición del mouse
- Redimensionamiento automático del canvas
- Interfaz de usuario con información de uniforms
- Organización por capítulos y ejercicios

## Estructura del Proyecto

```
src/
  ├── shaders/
  │   └── chapter01/
  │       ├── exercise01/
  │       │   └── fragment.glsl
  │       └── exercise02/
  │           └── fragment.glsl
  └── main.js
```

## Cómo Usar

1. Instala las dependencias:
   ```bash
   npm install
   ```

2. Inicia el servidor de desarrollo:
   ```bash
   npm run dev
   ```

3. Para crear un nuevo ejercicio:
   - Crea un nuevo directorio en `src/shaders/chapterXX/exerciseYY`
   - Añade tu shader en `fragment.glsl`
   - Los uniforms están disponibles automáticamente

## Uniforms Disponibles

- `u_time`: Tiempo transcurrido en segundos
- `u_resolution`: Vector2 con la resolución de la pantalla
- `u_mouse`: Vector2 con la posición normalizada del mouse (-1 a 1)

## Tecnologías

- Three.js para el renderizado
- Vite para el desarrollo
- GLSL para los shaders 