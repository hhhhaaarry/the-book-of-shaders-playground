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
        this.uniforms = {
            u_time: { value: 0 },
            u_resolution: { value: new THREE.Vector2() },
            u_mouse: { value: new THREE.Vector2() }
        };
        
        // Inicializar referencias al error drawer
        this.errorDrawer = document.getElementById('shader-error');
        this.errorContent = this.errorDrawer?.querySelector('.shader-error-content');
        
        // Configurar el renderer primero
        const container = document.getElementById('shader-preview');
        if (!container) {
            throw new Error('No se encontró el contenedor del preview');
        }
        container.appendChild(this.renderer.domElement);
        this.renderer.setPixelRatio(window.devicePixelRatio);

        // Configurar la cámara
        this.camera.position.z = 1;

        // Inicializar
        this.initShaders();
    }

    async initShaders() {
        try {
            // Cargar los shaders por defecto
            const [vertexResponse, fragmentResponse] = await Promise.all([
                fetch('/src/shaders/default.vertex.glsl'),
                fetch('/src/shaders/default.fragment.glsl')
            ]);

            const defaultVertexShader = await vertexResponse.text();
            const defaultFragmentShader = await fragmentResponse.text();

            // Crear el material con los shaders cargados
            const material = new THREE.ShaderMaterial({
                uniforms: this.uniforms,
                vertexShader: defaultVertexShader,
                fragmentShader: defaultFragmentShader
            });

            // Configurar la geometría y la malla
            const geometry = new THREE.PlaneGeometry(2, 2);
            this.mesh = new THREE.Mesh(geometry, material);
            this.scene.add(this.mesh);

            // Configurar eventos y comenzar la animación
            this.setupEventListeners();
            this.onResize(); // Llamar una vez para configurar el tamaño inicial
            this.animate();

        } catch (error) {
            console.error('Error cargando shaders por defecto:', error);
        }
    }

    setupEventListeners() {
        window.addEventListener('resize', this.onResize.bind(this));
        
        const container = this.renderer.domElement;
        container.addEventListener('mousemove', this.onMouseMove.bind(this));
        
        document.addEventListener('shaderChange', this.onShaderChange.bind(this));
        
        // Listener para el botón de reset de tiempo
        const resetTimeBtn = document.getElementById('reset-time');
        if (resetTimeBtn) {
            resetTimeBtn.addEventListener('click', () => {
                this.clock.start();
                this.uniforms.u_time.value = 0;
            });
        }

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

        // Configurar el resize handle
        const resizeHandle = document.querySelector('.resize-handle');
        const sidebar = document.querySelector('.sidebar');
        
        if (resizeHandle && sidebar) {
            let isResizing = false;
            let startX;
            let startWidth;

            resizeHandle.addEventListener('mousedown', (e) => {
                isResizing = true;
                startX = e.pageX;
                startWidth = parseInt(getComputedStyle(sidebar).width, 10);
                resizeHandle.classList.add('active');
            });

            document.addEventListener('mousemove', (e) => {
                if (!isResizing) return;
                
                const width = startWidth + (e.pageX - startX);
                sidebar.style.width = `${width}px`;
                
                // Forzar actualización del renderer
                this.onResize();
            });

            document.addEventListener('mouseup', () => {
                isResizing = false;
                resizeHandle.classList.remove('active');
            });
        }
    }

    onResize() {
        const container = this.renderer.domElement.parentElement;
        if (!container) return;

        const width = container.clientWidth;
        const height = container.clientHeight;

        this.renderer.setSize(width, height);
        this.uniforms.u_resolution.value.set(width, height);

        // Actualizar el span de resolución
        const resolutionSpan = document.getElementById('resolution');
        if (resolutionSpan) {
            resolutionSpan.textContent = `${width} x ${height}`;
        }
    }

    onMouseMove(event) {
        const rect = this.renderer.domElement.getBoundingClientRect();
        const x = (event.clientX - rect.left) / rect.width;
        const y = 1 - (event.clientY - rect.top) / rect.height;
        
        this.uniforms.u_mouse.value.set(x, y);

        // Actualizar el span de posición del mouse
        const mouseSpan = document.getElementById('mouse-position');
        if (mouseSpan) {
            mouseSpan.textContent = `x: ${x.toFixed(2)}, y: ${y.toFixed(2)}`;
        }
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

    onShaderChange(event) {
        const { vertex, fragment } = event.detail;
        this.updateMaterial(vertex, fragment);
    }

    updateMaterial(vertexShader, fragmentShader) {
        try {
            if (this.mesh && this.mesh.material) {
                if (this.mesh.material.program) {
                    const gl = this.renderer.getContext();
                    gl.deleteProgram(this.mesh.material.program.program);
                }

                this.mesh.material.dispose();

                const newMaterial = new THREE.ShaderMaterial({
                    uniforms: this.uniforms,
                    vertexShader,
                    fragmentShader
                });

                this.mesh.material = newMaterial;
            }
        } catch (error) {
            console.error('Error actualizando material:', error);
            this.showErrorDrawer(error.message);
        }
    }

    animate() {
        requestAnimationFrame(this.animate.bind(this));
        
        if (this.uniforms.u_time) {
            this.uniforms.u_time.value = this.clock.getElapsedTime();
            
            // Actualizar el span de tiempo
            const timeSpan = document.getElementById('time');
            if (timeSpan) {
                timeSpan.textContent = this.uniforms.u_time.value.toFixed(2);
            }
        }

        if (this.renderer && this.scene && this.camera) {
            this.renderer.render(this.scene, this.camera);
        }
    }
}

// Inicializar cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', () => {
    new ShaderPlayground();
}); 