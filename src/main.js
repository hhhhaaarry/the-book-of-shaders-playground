import * as THREE from 'three';
import { ShaderLoader } from './ShaderLoader';

class ShaderPlayground {
    constructor() {
        this.scene = new THREE.Scene();
        this.camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0.1, 10);
        this.renderer = new THREE.WebGLRenderer({ antialias: true });
        this.shaderLoader = new ShaderLoader();
        this.mouse = new THREE.Vector2();
        this.clock = new THREE.Clock();
        
        // Inicializar referencias al error drawer
        this.errorDrawer = document.getElementById('shader-error');
        this.errorContent = this.errorDrawer?.querySelector('.shader-error-content');
        
        this.init();
        this.setupEventListeners();
        this.animate();
        
        // Inicializar el ShaderLoader después de que el DOM esté listo
        this.shaderLoader.initialize();
    }

    init() {
        // Configurar el renderer
        const container = document.getElementById('shader-preview');
        const size = Math.min(container.clientWidth, container.clientHeight);
        this.renderer.setSize(size, size);
        this.renderer.setPixelRatio(1); // Forzar pixelRatio a 1
        container.appendChild(this.renderer.domElement);

        // Configurar la cámara
        this.camera.position.z = 1;

        // Crear el plano para el shader
        const geometry = new THREE.PlaneGeometry(2, 2);
        const material = new THREE.ShaderMaterial({
            uniforms: {
                u_resolution: { value: new THREE.Vector2(size, size) },
                u_mouse: { value: new THREE.Vector2() },
                u_time: { value: 0 }
            },
            vertexShader: `
                void main() {
                    gl_Position = vec4(position, 1.0);
                }
            `,
            fragmentShader: `
                uniform vec2 u_resolution;
                uniform vec2 u_mouse;
                uniform float u_time;
                
                void main() {
                    vec2 uv = gl_FragCoord.xy/u_resolution.xy;
                    vec3 color = vec3(uv.x, uv.y, abs(sin(u_time)));
                    gl_FragColor = vec4(color, 1.0);
                }
            `
        });

        this.mesh = new THREE.Mesh(geometry, material);
        this.scene.add(this.mesh);

        // Actualizar resolución
        this.updateResolution();
    }

    setupEventListeners() {
        window.addEventListener('resize', () => this.updateResolution());
        window.addEventListener('mousemove', (event) => this.onMouseMove(event));
        document.addEventListener('shaderChange', (event) => this.onShaderChange(event));
        
        // Añadir evento para resetear el tiempo
        document.getElementById('reset-time').addEventListener('click', () => {
            this.clock.start();
            this.clock.elapsedTime = 0;
        });

        // Añadir eventos para el redimensionamiento del sidebar
        const resizeHandle = document.querySelector('.resize-handle');
        let isResizing = false;
        let startX;
        let startWidth;

        resizeHandle.addEventListener('mousedown', (e) => {
            isResizing = true;
            startX = e.clientX;
            startWidth = document.querySelector('.sidebar').offsetWidth;
            resizeHandle.classList.add('active');
            document.body.style.cursor = 'col-resize';
        });

        document.addEventListener('mousemove', (e) => {
            if (!isResizing) return;
            
            const sidebar = document.querySelector('.sidebar');
            const width = startWidth + (e.clientX - startX);
            sidebar.style.width = `${Math.min(Math.max(width, 200), 1920)}px`;
            
            // Actualizar el canvas después del redimensionamiento
            this.updateResolution();
        });

        document.addEventListener('mouseup', () => {
            isResizing = false;
            resizeHandle.classList.remove('active');
            document.body.style.cursor = '';
        });

        // Añadir evento para el botón de nuevo shader
        document.getElementById('new-shader-btn').addEventListener('click', () => {
            this.shaderLoader.createNewShader();
        });

        // Añadir evento para el botón de duplicar shader
        document.getElementById('duplicate-shader-btn').addEventListener('click', () => {
            this.shaderLoader.duplicateCurrentShader();
        });

        // Configurar el botón de cerrar del error drawer
        const closeButton = this.errorDrawer?.querySelector('.error-close');
        if (closeButton) {
            closeButton.addEventListener('click', () => {
                this.hideErrorDrawer();
            });
        }
    }

    updateResolution() {
        const container = document.getElementById('shader-preview');
        const size = Math.min(container.clientWidth, container.clientHeight);
        this.renderer.setSize(size, size);
        this.mesh.material.uniforms.u_resolution.value.set(size, size);
        
        // Actualizar UI
        document.getElementById('resolution').textContent = `${size} x ${size}`;
    }

    onMouseMove(event) {
        const canvas = this.renderer.domElement;
        const container = document.getElementById('shader-preview');
        const rect = container.getBoundingClientRect();
        
        // Calcular la posición relativa al contenedor
        const x = event.clientX - rect.left;
        const y = event.clientY - rect.top;
        
        // Normalizar las coordenadas del mouse de 0 a 1 usando las dimensiones del contenedor
        this.mouse.x = x / rect.width;
        this.mouse.y = 1.0 - (y / rect.height); // Invertir Y para que coincida con GLSL (0 abajo, 1 arriba)
        
        // Actualizar el uniform del shader
        this.mesh.material.uniforms.u_mouse.value.copy(this.mouse);
        
        // Actualizar UI
        document.getElementById('mouse-position').textContent = 
            `x: ${this.mouse.x.toFixed(2)}, y: ${this.mouse.y.toFixed(2)}`;
    }

    showErrorDrawer(errorMessage) {
        console.log('showErrorDrawer llamado con mensaje:', errorMessage);
        if (this.errorDrawer && this.errorContent) {
            console.log('Estado inicial del drawer:', {
                hasVisibleClass: this.errorDrawer.classList.contains('visible'),
                content: this.errorContent.textContent
            });
            this.errorContent.textContent = errorMessage;
            this.errorDrawer.classList.add('visible');
            console.log('Clase visible añadida al drawer');
        }
    }

    hideErrorDrawer() {
        console.log('hideErrorDrawer llamado');
        if (this.errorDrawer) {
            console.log('Estado antes de ocultar:', {
                hasVisibleClass: this.errorDrawer.classList.contains('visible')
            });
            this.errorDrawer.classList.remove('visible');
            console.log('Clase visible eliminada del drawer');
        }
    }

    updateShader(code) {
        const errorDrawer = document.querySelector('.shader-error-drawer');
        const errorContent = errorDrawer?.querySelector('.shader-error-content');

        console.log('updateShader iniciado:', {
            hasErrorDrawer: !!errorDrawer,
            hasVisibleClass: errorDrawer?.classList.contains('visible'),
            currentContent: errorContent?.textContent
        });

        // Actualizar el shader
        this.mesh.material.fragmentShader = code;
        this.mesh.material.needsUpdate = true;

        // Capturar los console.error originales
        const originalConsoleError = console.error;
        let shaderError = null;

        // Sobreescribir temporalmente console.error para capturar el error del shader
        console.error = (...args) => {
            const errorMessage = args.join(' ');
            if (errorMessage.includes('THREE.WebGLProgram: Shader Error')) {
                shaderError = errorMessage;
                console.log('Error de shader capturado:', errorMessage);
            }
            originalConsoleError.apply(console, args);
        };

        // Intentar renderizar
        this.renderer.render(this.scene, this.camera);

        // Restaurar console.error
        console.error = originalConsoleError;

        // Procesar el error si existe
        if (shaderError && errorDrawer && errorContent) {
            const errorLines = shaderError
                .split('\n')
                .filter(line => line.includes('ERROR:'))
                .map(line => {
                    const match = line.match(/ERROR: \d+:(\d+): (.+)/);
                    if (match) {
                        const [, lineNum, message] = match;
                        return `Línea ${lineNum}: ${message}`;
                    }
                    return line.trim();
                })
                .filter(Boolean);

            if (errorLines.length > 0) {
                console.log('Preparando para mostrar error:', {
                    errorLines,
                    hasVisibleClass: errorDrawer.classList.contains('visible')
                });
                
                errorContent.textContent = errorLines.join('\n');
                // Forzar un reflow antes de añadir la clase
                void errorDrawer.offsetHeight;
                errorDrawer.classList.add('visible');
                
                console.log('Estado después de mostrar error:', {
                    hasVisibleClass: errorDrawer.classList.contains('visible'),
                    content: errorContent.textContent
                });
            }
        } else if (!this.mesh.material.program && errorDrawer?.classList.contains('visible')) {
            // No ocultamos el drawer si no hay programa compilado y ya estaba visible
            console.log('Manteniendo drawer visible porque el shader aún no está compilado');
        } else if (errorDrawer && this.mesh.material.program) {
            // Solo ocultamos el drawer si el shader compiló correctamente
            console.log('Shader compilado correctamente, ocultando drawer');
            errorDrawer.classList.remove('visible');
        }

        console.log('updateShader finalizado:', {
            hasVisibleClass: errorDrawer?.classList.contains('visible'),
            content: errorContent?.textContent,
            hasProgram: !!this.mesh.material.program
        });
    }

    formatShaderError(errorMessage) {
        const lines = errorMessage.split('\n');
        let formattedError = '';

        for (const line of lines) {
            // Capturar líneas de error con número de línea
            if (line.match(/ERROR: \d+:\d+:/)) {
                const [, lineNum, message] = line.match(/ERROR: (\d+:\d+:)(.+)/) || [];
                if (lineNum && message) {
                    formattedError += `Error en línea ${lineNum}${message}\n`;
                }
            } else if (line.includes('ERROR:')) {
                // Otros errores generales
                formattedError += line.replace('ERROR:', 'Error:') + '\n';
            } else if (line.trim() !== '') {
                // Incluir otras líneas no vacías
                formattedError += line + '\n';
            }
        }

        return formattedError || 'Error desconocido en el shader';
    }

    onShaderChange(event) {
        const code = event.detail.code;
        // Asegurarnos de que el drawer mantiene su estado si hay un error
        this.updateShader(code);
    }

    animate() {
        requestAnimationFrame(() => this.animate());
        
        // Actualizar tiempo
        const elapsedTime = this.clock.getElapsedTime();
        this.mesh.material.uniforms.u_time.value = elapsedTime;
        
        // Actualizar UI
        document.getElementById('time').textContent = elapsedTime.toFixed(2);
        
        this.renderer.render(this.scene, this.camera);
    }
}

// Inicializar cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', () => {
    new ShaderPlayground();
}); 