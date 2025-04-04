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
        document.addEventListener('shaderChange', (event) => this.updateShader(event.detail.code));
        
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

    updateShader(code) {
        try {
            this.mesh.material.fragmentShader = code;
            this.mesh.material.needsUpdate = true;
        } catch (error) {
            console.error('Error al actualizar el shader:', error);
        }
    }

    animate() {
        requestAnimationFrame(() => this.animate());
        const time = this.clock.getElapsedTime();
        this.mesh.material.uniforms.u_time.value = time;
        
        // Actualizar UI del tiempo
        document.getElementById('time').textContent = time.toFixed(2);
        
        this.renderer.render(this.scene, this.camera);
    }
}

// Inicializar el playground cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', () => {
    new ShaderPlayground();
}); 