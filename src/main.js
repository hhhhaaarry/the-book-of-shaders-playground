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
        
        this.errorDrawer = document.getElementById('shader-error');
        this.errorContent = this.errorDrawer?.querySelector('.shader-error-content');
        
        const container = document.getElementById('shader-preview');
        if (!container) {
            throw new Error('No se encontró el contenedor del preview');
        }
        container.appendChild(this.renderer.domElement);
        this.renderer.setPixelRatio(window.devicePixelRatio);

        this.camera.position.z = 1;
        this.initShaders();
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
                fragmentShader: defaultFragmentShader
            });

            const geometry = new THREE.PlaneGeometry(2, 2);
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

        this.renderer.setSize(width, height);
        this.uniforms.u_resolution.value.set(width, height);

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

        const mouseSpan = document.getElementById('mouse-position');
        if (mouseSpan) {
            mouseSpan.textContent = `x: ${x.toFixed(2)}, y: ${y.toFixed(2)}`;
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
}

// Inicializar cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', () => {
    new ShaderPlayground();
});

export default ShaderPlayground; 