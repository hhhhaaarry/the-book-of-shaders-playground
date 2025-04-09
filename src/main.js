import * as THREE from 'three';
import { ShaderLoader } from './ShaderLoader';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';

class ShaderPlayground {
    constructor() {
        // Definir todas las constantes de configuración al inicio
        this.CAMERA_CONFIG = {
            perspective: {
                fov: 75,
                near: 0.1,
                far: 100,
                position: new THREE.Vector3(0, 0, 2),
                target: new THREE.Vector3(0, 0, 0)
            },
            ortho: {
                zoom: 1.2,
                near: 0.1,
                far: 10,
                position: new THREE.Vector3(0, 0, 1),
                target: new THREE.Vector3(0, 0, 0)
            }
        };

        // Inicializar escena
        this.scene = new THREE.Scene();
        
        // Inicializar cámaras con la configuración definida
        this.initializeCameras();
        
        this.renderer = new THREE.WebGLRenderer({ antialias: true });
        this.shaderLoader = new ShaderLoader();
        this.mouse = new THREE.Vector2();
        this.clock = new THREE.Clock();
        this.uniforms = {
            u_time: { value: 0 },
            u_resolution: { value: new THREE.Vector2() },
            u_mouse: { value: new THREE.Vector2() },
            u_mouse_world: { value: new THREE.Vector3() }
        };
        
        this.errorDrawer = document.getElementById('shader-error');
        this.errorContent = this.errorDrawer?.querySelector('.shader-error-content');
        
        const container = document.getElementById('shader-preview');
        if (!container) {
            throw new Error('No se encontró el contenedor del preview');
        }
        container.appendChild(this.renderer.domElement);
        this.renderer.setPixelRatio(window.devicePixelRatio);

        this.controls = new OrbitControls(this.camera, this.renderer.domElement);
        this.controls.enableDamping = true;
        this.controls.dampingFactor = 0.05;
        this.controls.screenSpacePanning = false;
        this.controls.minDistance = 1;
        this.controls.maxDistance = 5;
        this.controls.maxPolarAngle = Math.PI;
        this.controls.minPolarAngle = 0;
        this.controls.enabled = false;

        this.raycaster = new THREE.Raycaster();
        this.mousePosition = new THREE.Vector2();

        this.initShaders();

        // Bind del método onResize para mantener el contexto
        this.onResize = this.onResize.bind(this);
        
        // Asegurarnos de que el evento resize se añada después de la inicialización
        window.addEventListener('resize', this.onResize);

        // Configuración por defecto de la cámara
        this.defaultCameraPosition = new THREE.Vector3(0, 0, 2);
        this.defaultZoom = 2;
        this.isOrbitEnabled = false;
        
        // Inicializar controles después de configurar el renderer
        this.initializeControls();
    }

    initializeCameras() {
        const aspect = window.innerWidth / window.innerHeight;
        const config = this.CAMERA_CONFIG;

        // Inicializar cámara perspectiva
        this.perspectiveCamera = new THREE.PerspectiveCamera(
            config.perspective.fov,
            aspect,
            config.perspective.near,
            config.perspective.far
        );
        this.perspectiveCamera.position.copy(config.perspective.position);
        this.perspectiveCamera.lookAt(config.perspective.target);

        // Inicializar cámara ortográfica con el zoom correcto
        const orthoZoom = config.ortho.zoom;
        this.orthoCamera = new THREE.OrthographicCamera(
            -aspect * orthoZoom,
            aspect * orthoZoom,
            orthoZoom,
            -orthoZoom,
            config.ortho.near,
            config.ortho.far
        );
        this.orthoCamera.position.copy(config.ortho.position);
        this.orthoCamera.lookAt(config.ortho.target);

        // Empezar con la cámara ortográfica
        this.camera = this.orthoCamera;
    }

    async initShaders() {
        try {
            const [vertexResponse, fragmentResponse] = await Promise.all([
                fetch('/src/shaders/default.vertex.glsl'),
                fetch('/src/shaders/default.fragment.glsl')
            ]);

            const defaultVertexShader = await vertexResponse.text();
            const defaultFragmentShader = await fragmentResponse.text();

            const material = new THREE.ShaderMaterial({
                uniforms: this.uniforms,
                vertexShader: defaultVertexShader,
                fragmentShader: defaultFragmentShader,
            });

            const geometry = new THREE.PlaneGeometry(2, 2, 512, 512);
            this.mesh = new THREE.Mesh(geometry, material);
            this.scene.add(this.mesh);

            this.setupEventListeners();
            this.onResize();
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
        
        const resetTimeBtn = document.getElementById('reset-time');
        if (resetTimeBtn) {
            resetTimeBtn.addEventListener('click', () => {
                this.clock.start();
                this.uniforms.u_time.value = 0;
            });
        }

        document.getElementById('new-shader-btn')?.addEventListener('click', () => {
            this.shaderLoader.createNewShader();
        });

        document.getElementById('duplicate-shader-btn')?.addEventListener('click', () => {
            this.shaderLoader.duplicateCurrentShader();
        });

        const closeButton = this.errorDrawer?.querySelector('.error-close');
        if (closeButton) {
            closeButton.addEventListener('click', () => this.hideErrorDrawer());
        }

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
        const aspect = width / height;

        this.renderer.setSize(width, height);

        if (this.isOrbitEnabled) {
            // Actualizar cámara perspectiva
            this.perspectiveCamera.aspect = aspect;
            this.perspectiveCamera.updateProjectionMatrix();
        } else {
            // Actualizar cámara ortográfica usando siempre los valores de configuración
            const zoom = this.CAMERA_CONFIG.ortho.zoom;
            this.orthoCamera.left = -aspect * zoom;
            this.orthoCamera.right = aspect * zoom;
            this.orthoCamera.top = zoom;
            this.orthoCamera.bottom = -zoom;
            this.orthoCamera.updateProjectionMatrix();
        }

        this.uniforms.u_resolution.value.set(width, height);
        
        if (this.controls && this.isOrbitEnabled) {
            this.controls.update();
        }

        // Forzar una actualización del raycaster en la posición actual del mouse
        const lastMouseEvent = this.lastMouseEvent;
        if (lastMouseEvent) {
            this.onMouseMove(lastMouseEvent);
        }

        // Actualizar el display de resolución en el sidebar
        const resolutionSpan = document.getElementById('resolution');
        if (resolutionSpan) {
            resolutionSpan.textContent = `${width} x ${height}`;
        }

        // Forzar un render para actualizar la vista
        this.renderer.render(this.scene, this.camera);
    }

    onMouseMove(event) {
        // Guardar el último evento del mouse para poder recrearlo en resize
        this.lastMouseEvent = event;

        const rect = this.renderer.domElement.getBoundingClientRect();
        
        // Calcular coordenadas normalizadas para el raycaster (-1 a 1)
        this.mousePosition.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
        this.mousePosition.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
        
        this.raycaster.setFromCamera(this.mousePosition, this.camera);
        
        const intersects = this.raycaster.intersectObject(this.mesh);
        
        if (intersects.length > 0) {
            const intersection = intersects[0];
            
            const uv = intersection.uv;
            if (uv) {
                const normalizedX = (uv.x * 2.0) - 1.0;
                const normalizedY = (uv.y * 2.0) - 1.0;
                
                this.uniforms.u_mouse.value.set(normalizedX, normalizedY);
                
                const mouseSpan = document.getElementById('mouse-position');
                if (mouseSpan) {
                    mouseSpan.textContent = `x: ${uv.x.toFixed(2)}, y: ${uv.y.toFixed(2)}`;
                }
            }
        }
    }

    showErrorDrawer(errorMessage) {
        if (this.errorDrawer && this.errorContent) {
            this.errorContent.textContent = errorMessage;
            this.errorDrawer.classList.add('visible');
        }
    }

    hideErrorDrawer() {
        if (this.errorDrawer) {
            this.errorDrawer.classList.remove('visible');
        }
    }

    onShaderChange(event) {
        const shaderCode = event instanceof CustomEvent ? event.detail : event;
        if (typeof shaderCode === 'object' && shaderCode.fragment && shaderCode.vertex) {
            this.updateMaterial({
                fragmentShader: shaderCode.fragment,
                vertexShader: shaderCode.vertex
            });
        } else {
            console.error('Formato de shader inválido:', shaderCode);
        }
    }

    updateMaterial(shaderCode) {
        if (!this.mesh || !this.mesh.material) return;

        const originalConsoleError = console.error;
        let shaderError = null;

        console.error = function(...args) {
            const errorMessage = args.join(' ');
            if (errorMessage.includes('THREE.WebGLProgram: Shader Error')) {
                shaderError = errorMessage;
            }
            originalConsoleError.apply(console, args);
        };

        try {
            if (this.mesh.material.program) {
                const gl = this.renderer.getContext();
                gl.deleteProgram(this.mesh.material.program.program);
            }

            this.mesh.material.dispose();
            
            const material = new THREE.ShaderMaterial({
                uniforms: this.uniforms,
                vertexShader: shaderCode.vertexShader,
                fragmentShader: shaderCode.fragmentShader
            });

            this.mesh.material = material;
            this.renderer.render(this.scene, this.camera);
            
            this.hideErrorDrawer();
        } catch (error) {
            console.error('Error al actualizar el material:', error);
            this.showErrorDrawer(`Error: ${error.message}`);
        } finally {
            console.error = originalConsoleError;
            
            if (shaderError) {
                const errorLines = shaderError
                    .split('\n')
                    .filter(line => line.includes('ERROR:'))
                    .map(line => {
                        const match = line.match(/ERROR: \d+:(\d+): (.+)/);
                        return match ? `Línea ${match[1]}: ${match[2]}` : line.trim();
                    })
                    .filter(Boolean);

                if (errorLines.length > 0) {
                    this.showErrorDrawer(errorLines.join('\n'));
                }
            }
        }
    }

    animate() {
        requestAnimationFrame(() => this.animate());
        
        if (this.controls && this.isOrbitEnabled) {
            this.controls.update();
        }
        
        if (this.uniforms.u_time) {
            this.uniforms.u_time.value = this.clock.getElapsedTime();
            
            const timeSpan = document.getElementById('time');
            if (timeSpan) {
                timeSpan.textContent = this.uniforms.u_time.value.toFixed(2);
            }
        }

        if (this.renderer && this.scene && this.camera) {
            this.renderer.render(this.scene, this.camera);
        }
    }

    initializeControls() {
        // Crear los orbit controls
        this.controls = new OrbitControls(this.perspectiveCamera, this.renderer.domElement);
        this.controls.enableDamping = true;
        this.controls.dampingFactor = 0.05;
        this.controls.screenSpacePanning = false;
        this.controls.minDistance = 1;
        this.controls.maxDistance = 5;
        this.controls.maxPolarAngle = Math.PI;
        this.controls.minPolarAngle = 0;
        this.controls.enabled = false; // Desactivados por defecto
        
        // Guardar la posición inicial de la cámara perspectiva
        this.controls.saveState();
        
        // Configurar el checkbox
        const orbitCheckbox = document.getElementById('orbit-control');
        if (orbitCheckbox) {
            orbitCheckbox.checked = false;
            orbitCheckbox.addEventListener('change', this.toggleOrbitControls.bind(this));
        }
    }

    toggleOrbitControls(event) {
        this.isOrbitEnabled = event.target.checked;
        this.controls.enabled = this.isOrbitEnabled;

        if (this.isOrbitEnabled) {
            // Cambiar a cámara perspectiva
            this.camera = this.perspectiveCamera;
            // Asegurar que la cámara perspectiva está en su posición inicial
            this.controls.reset();
        } else {
            // Cambiar a cámara ortográfica
            this.camera = this.orthoCamera;
            
            // Resetear completamente la cámara ortográfica
            const config = this.CAMERA_CONFIG.ortho;
            const aspect = this.renderer.domElement.width / this.renderer.domElement.height;
            
            // Resetear posición y orientación
            this.orthoCamera.position.copy(config.position);
            this.orthoCamera.lookAt(config.target);
            
            // Resetear zoom y frustum
            const zoom = config.zoom;
            this.orthoCamera.left = -aspect * zoom;
            this.orthoCamera.right = aspect * zoom;
            this.orthoCamera.top = zoom;
            this.orthoCamera.bottom = -zoom;
            this.orthoCamera.zoom = 1; // Importante: resetear el zoom a 1
            this.orthoCamera.updateProjectionMatrix();
        }

        // Actualizar el tamaño y las proporciones
        this.onResize();
    }

    // Asegurarnos de limpiar los event listeners cuando se destruya la instancia
    destroy() {
        window.removeEventListener('resize', this.onResize);
        // ... cualquier otra limpieza necesaria ...
    }
}

// Inicializar cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', () => {
    new ShaderPlayground();
});

export default ShaderPlayground; 