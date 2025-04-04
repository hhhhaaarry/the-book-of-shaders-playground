import shaderResources from './resources.js';
import * as THREE from 'three';
import { EditorView, basicSetup } from 'codemirror';
import { javascript } from '@codemirror/lang-javascript';
import { oneDark } from '@codemirror/theme-one-dark';

export class ShaderLoader {
    constructor() {
        this.chapters = new Map();
        this.currentChapter = '';
        this.currentExercise = '';
        this.editor = null;
        this.currentShader = null;
        this.shaderCache = new Map();
        this.resourcesList = document.getElementById('resources-list');
        this.initEditor();
    }

    async initialize() {
        console.log('Inicializando ShaderLoader...');
        // Cargar la estructura de shaders
        await this.loadShaderStructure();
        this.setupUI();
        this.setupResources();
        console.log('ShaderLoader inicializado correctamente');
    }

    async loadShaderStructure() {
        try {
            console.log('Cargando estructura de shaders...');
            this.chapters = new Map([
                ['chapter01', {
                    name: 'Capítulo 1: Formas Básicas',
                    exercises: new Map([
                        ['exercise01', { name: 'Círculo Interactivo' }]
                    ])
                }]
            ]);
            console.log('Estructura de shaders cargada:', this.chapters);
        } catch (error) {
            console.error('Error cargando la estructura de shaders:', error);
        }
    }

    setupUI() {
        console.log('Configurando UI...');
        const chapterSelect = document.getElementById('chapter-select');
        const exerciseSelect = document.getElementById('exercise-select');
        const applyButton = document.getElementById('apply-shader');
        const saveButton = document.getElementById('save-shader');
        
        if (!chapterSelect || !exerciseSelect) {
            console.error('No se encontraron los elementos select en el DOM');
            return;
        }

        // Poblar selector de capítulos
        chapterSelect.innerHTML = `
            <option value="">Selecciona un capítulo...</option>
            ${Array.from(this.chapters.entries()).map(([id, chapter]) => `
                <option value="${id}">${chapter.name}</option>
            `).join('')}
        `;

        // Eventos
        chapterSelect.addEventListener('change', (e) => {
            console.log('Capítulo seleccionado:', e.target.value);
            this.currentChapter = e.target.value;
            this.updateExerciseSelect();
        });

        exerciseSelect.addEventListener('change', (e) => {
            console.log('Ejercicio seleccionado:', e.target.value);
            this.currentExercise = e.target.value;
            this.loadShader();
        });

        // Botón para aplicar cambios
        applyButton.addEventListener('click', () => {
            this.applyShader();
        });

        // Botón para guardar shader
        saveButton.addEventListener('click', () => {
            this.saveShader();
        });
    }

    initEditor() {
        const editorElement = document.getElementById('shader-editor');
        if (!editorElement) {
            console.error('No se encontró el elemento editor');
            return;
        }

        this.editor = new EditorView({
            doc: '// Selecciona un shader para comenzar',
            extensions: [
                basicSetup,
                javascript(),
                oneDark,
                EditorView.updateListener.of(update => {
                    if (update.docChanged) {
                        this.onShaderChange(update.state.doc.toString());
                    }
                })
            ],
            parent: editorElement
        });
    }

    setupResources() {
        // Crear lista de recursos
        let resourcesHTML = '';
        
        for (const [category, data] of Object.entries(shaderResources)) {
            resourcesHTML += `<div class="resource-category">
                <h4>${data.name}</h4>
            `;
            
            for (const item of data.items) {
                resourcesHTML += `
                <div class="resource-item" data-code="${this.escapeHTML(item.code)}">
                    ${item.name}
                </div>`;
            }
            
            resourcesHTML += '</div>';
        }
        
        this.resourcesList.innerHTML = resourcesHTML;
        
        // Añadir eventos a los recursos
        const resourceItems = this.resourcesList.querySelectorAll('.resource-item');
        resourceItems.forEach(item => {
            item.addEventListener('click', () => {
                const code = item.getAttribute('data-code');
                this.insertResource(code);
            });
        });
    }

    escapeHTML(str) {
        return str.replace(/&/g, '&amp;')
                 .replace(/</g, '&lt;')
                 .replace(/>/g, '&gt;')
                 .replace(/"/g, '&quot;')
                 .replace(/'/g, '&#039;');
    }

    insertResource(code) {
        // Obtener la posición actual del cursor
        const cursorPos = this.editor.getCursor();
        
        // Insertar el código en la posición del cursor
        this.editor.dispatch({
            changes: {
                from: cursorPos.from,
                to: cursorPos.to,
                insert: code
            }
        });
        
        // Mover el cursor al final del código insertado
        const newCursorPos = {
            line: cursorPos.line + code.split('\n').length - 1,
            ch: code.split('\n').pop().length
        };
        this.editor.setCursor(newCursorPos);
    }

    updateExerciseSelect() {
        const exerciseSelect = document.getElementById('exercise-select');
        const chapter = this.chapters.get(this.currentChapter);

        if (!chapter) {
            exerciseSelect.innerHTML = '<option value="">Selecciona un ejercicio...</option>';
            return;
        }

        exerciseSelect.innerHTML = `
            <option value="">Selecciona un ejercicio...</option>
            ${Array.from(chapter.exercises.entries()).map(([id, exercise]) => `
                <option value="${id}">${exercise.name}</option>
            `).join('')}
        `;
    }

    async loadShader() {
        if (!this.currentChapter || !this.currentExercise) {
            console.log('No hay capítulo o ejercicio seleccionado');
            return;
        }

        console.log(`Cargando shader: ${this.currentChapter}/${this.currentExercise}`);
        
        try {
            const cacheKey = `${this.currentChapter}-${this.currentExercise}`;
            if (this.shaderCache.has(cacheKey)) {
                console.log('Usando shader en caché');
                this.currentShader = this.shaderCache.get(cacheKey);
            } else {
                console.log('Cargando shader desde archivo');
                const fragmentShader = await import(`./shaders/${this.currentChapter}/${this.currentExercise}/fragment.glsl?raw`);
                this.currentShader = {
                    fragment: fragmentShader.default,
                    uniforms: {
                        u_resolution: { value: new THREE.Vector2() },
                        u_mouse: { value: new THREE.Vector2() },
                        u_time: { value: 0 }
                    }
                };
                this.shaderCache.set(cacheKey, this.currentShader);
            }
            
            console.log('Shader cargado:', this.currentShader);
            this.updateEditor(this.currentShader.fragment);
            
            // Emitir evento para actualizar el shader en el preview
            this.onShaderChange(this.currentShader.fragment);
        } catch (error) {
            console.error('Error cargando el shader:', error);
            alert(`Error al cargar el shader: ${error.message}`);
        }
    }

    updateEditor(code) {
        if (!this.editor) return;
        
        this.editor.dispatch({
            changes: {
                from: 0,
                to: this.editor.state.doc.length,
                insert: code
            }
        });
    }

    onShaderChange(code) {
        const event = new CustomEvent('shaderChange', { detail: { code } });
        document.dispatchEvent(event);
    }

    applyShader() {
        const shaderCode = this.editor.state.doc.toString();
        console.log('Aplicando shader:', shaderCode);
        
        this.onShaderChange(shaderCode);
    }

    async saveShader() {
        if (!this.currentChapter || !this.currentExercise) {
            alert('Por favor, selecciona un capítulo y un ejercicio antes de guardar.');
            return;
        }

        const shaderCode = this.editor.state.doc.toString();
        
        try {
            // En un entorno real, esto sería una llamada a la API para guardar el archivo
            // Por ahora, solo mostraremos un mensaje
            alert(`Shader guardado en ${this.currentChapter}/${this.currentExercise}/fragment.glsl`);
            console.log('Shader guardado:', shaderCode);
        } catch (error) {
            console.error('Error guardando el shader:', error);
            alert('Error al guardar el shader.');
        }
    }
} 