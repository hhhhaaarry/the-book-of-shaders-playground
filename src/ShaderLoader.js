// import shaderResources from './resources.js';
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
        this.defaultShader = null;
        this.hasChanges = false;
        
        // Configurar el botón de guardar inmediatamente
        console.log('Configurando botones...');
        const saveButton = document.getElementById('save-shader-btn');
        const duplicateButton = document.getElementById('duplicate-shader-btn');
        const saveButtonContainer = document.getElementById('save-button-container');

        if (saveButton) {
            console.log('Botón de guardar encontrado, añadiendo evento click');
            saveButton.onclick = () => {
                console.log('Click en botón guardar detectado');
                this.saveShader();
            };
        }

        if (duplicateButton) {
            console.log('Botón de duplicar encontrado, añadiendo evento click');
            duplicateButton.onclick = () => {
                console.log('Click en botón duplicar detectado');
                this.duplicateCurrentShader();
            };
        }

        // Guardar referencia al contenedor del botón de guardar
        this.saveButtonContainer = saveButtonContainer;
        this.saveButton = saveButton;
        
        // Ocultar el botón de guardar inicialmente
        this.updateSaveButtonVisibility();

        this.loadDefaultShader();
        this.initEditor();
    }

    async initialize() {
        console.log('Inicializando ShaderLoader...');
        await this.loadShaderStructure();
        this.setupUI();
        
        // Cargar estado desde URL si existe
        const params = new URLSearchParams(window.location.search);
        const chapter = params.get('chapter');
        const exercise = params.get('exercise');
        
        if (chapter && exercise) {
            this.currentChapter = chapter;
            this.updateExerciseSelect();
            this.currentExercise = exercise;
            
            // Actualizar los selectores
            const chapterSelect = document.getElementById('chapter-select');
            const exerciseSelect = document.getElementById('exercise-select');
            if (chapterSelect) chapterSelect.value = chapter;
            if (exerciseSelect) exerciseSelect.value = exercise;
            
            await this.loadShader();
        }
        
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
            const selectedChapter = e.target.value;
            
            // Si se deselecciona el capítulo o se selecciona la opción vacía
            if (!selectedChapter) {
                this.currentChapter = '';
                this.currentExercise = '';
                exerciseSelect.value = '';
                this.updateExerciseSelect();
                
                // Limpiar la URL completamente
                const params = new URLSearchParams(window.location.search);
                params.delete('chapter');
                params.delete('exercise');
                const newURL = `${window.location.pathname}${params.toString() ? '?' + params.toString() : ''}`;
                window.history.pushState({}, '', newURL);
                console.log('URL actualizada:', newURL);
                
                this.updateSaveButtonVisibility();
                return;
            }
            
            // Si se selecciona un capítulo válido
            this.currentChapter = selectedChapter;
            this.currentExercise = '';
            exerciseSelect.value = '';
            this.updateExerciseSelect();
            this.updateURLParams();
            this.updateSaveButtonVisibility();
        });

        exerciseSelect.addEventListener('change', (e) => {
            console.log('Ejercicio seleccionado:', e.target.value);
            this.currentExercise = e.target.value;
            this.loadShader();
            this.updateURLParams();
            this.updateSaveButtonVisibility();
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
                        this.hasChanges = true;
                        this.updateSaveButtonVisibility();
                        this.onShaderChange(update.state.doc.toString());
                    }
                })
            ],
            parent: editorElement
        });
    }

    escapeHTML(str) {
        return str.replace(/&/g, '&amp;')
                 .replace(/</g, '&lt;')
                 .replace(/>/g, '&gt;')
                 .replace(/"/g, '&quot;')
                 .replace(/'/g, '&#039;');
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
            console.log('No hay shader seleccionado');
            this.updateSaveButtonVisibility();
            this.updateURLParams();
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
            
            // Resetear el estado de cambios al cargar un nuevo shader
            this.hasChanges = false;
            
            // Emitir evento para actualizar el shader en el preview
            this.onShaderChange(this.currentShader.fragment);
            
            // Actualizar visibilidad del botón y URL
            this.updateSaveButtonVisibility();
            this.updateURLParams();
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

    async saveShader() {
        if (!this.currentChapter || !this.currentExercise) {
            alert('Por favor, selecciona un capítulo y un ejercicio antes de guardar.');
            return;
        }

        const shaderCode = this.editor.state.doc.toString();
        const filePath = `src/shaders/${this.currentChapter}/${this.currentExercise}/fragment.glsl`;
        
        try {
            const response = await fetch('/api/save-shader', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    content: shaderCode,
                    path: filePath
                })
            });

            const result = await response.json();
            
            if (!result.success) {
                throw new Error(result.error || 'Error al guardar el shader');
            }

            // Limpiar la caché para forzar una recarga desde el archivo
            const cacheKey = `${this.currentChapter}-${this.currentExercise}`;
            this.shaderCache.delete(cacheKey);

            // Resetear el estado de cambios
            this.hasChanges = false;
            this.updateSaveButtonVisibility();

            console.log('Shader guardado exitosamente');
            alert('Shader guardado correctamente');
        } catch (error) {
            console.error('Error guardando el shader:', error);
            alert('Error al guardar el shader: ' + error.message);
        }
    }

    async loadDefaultShader() {
        try {
            const response = await fetch('/src/shaders/default.fragment.glsl');
            this.defaultShader = await response.text();
            this.setShader(this.defaultShader);
        } catch (error) {
            console.error('Error loading default shader:', error);
        }
    }

    createNewShader() {
        this.setShader(this.defaultShader);
        // Limpiar los selectores
        const chapterSelect = document.getElementById('chapter-select');
        const exerciseSelect = document.getElementById('exercise-select');
        if (chapterSelect) chapterSelect.value = '';
        if (exerciseSelect) exerciseSelect.value = '';
        
        // Resetear las variables internas
        this.currentChapter = '';
        this.currentExercise = '';
        
        // Actualizar visibilidad del botón y URL
        this.updateSaveButtonVisibility();
        this.updateURLParams();
    }

    duplicateCurrentShader() {
        // Guardar el código actual antes de resetear todo
        const currentCode = this.editor.state.doc.toString();
        
        // Resetear los selectores
        const chapterSelect = document.getElementById('chapter-select');
        const exerciseSelect = document.getElementById('exercise-select');
        if (chapterSelect) chapterSelect.value = '';
        if (exerciseSelect) exerciseSelect.value = '';
        
        // Resetear las variables internas
        this.currentChapter = '';
        this.currentExercise = '';
        
        // Actualizar el editor con el código actual
        this.setShader(currentCode);
        
        // Actualizar visibilidad del botón y URL
        this.updateSaveButtonVisibility();
        this.updateURLParams();
    }

    setShader(shaderCode) {
        this.currentShader = {
            fragment: shaderCode,
            uniforms: {
                u_resolution: { value: new THREE.Vector2() },
                u_mouse: { value: new THREE.Vector2() },
                u_time: { value: 0 }
            }
        };
        this.updateEditor(this.currentShader.fragment);
        this.onShaderChange(this.currentShader.fragment);
    }

    // Método para controlar la visibilidad del botón de guardar
    updateSaveButtonVisibility() {
        if (!this.saveButtonContainer || !this.saveButton) {
            console.error('No se encontró el contenedor o el botón de guardar');
            return;
        }
        
        // Si no hay capítulo o ejercicio seleccionado, ocultar el botón
        if (!this.currentChapter || !this.currentExercise) {
            this.saveButtonContainer.style.visibility = 'hidden';
            return;
        }

        // Si hay un ejercicio seleccionado, mostrar el botón
        this.saveButtonContainer.style.visibility = 'visible';
        console.log(this.saveButtonContainer, 'Estado del botón:', {
            visible: this.saveButtonContainer.style.visibility,
            disabled: this.saveButton.disabled,
            hasChanges: this.hasChanges,
            chapter: this.currentChapter,
            exercise: this.currentExercise
        });
        
        // El botón está deshabilitado si no hay cambios
        this.saveButton.disabled = !this.hasChanges;
        console.log('Estado del botón:', {
            visible: this.saveButtonContainer.style.visibility,
            disabled: this.saveButton.disabled,
            hasChanges: this.hasChanges,
            chapter: this.currentChapter,
            exercise: this.currentExercise
        });
    }

    updateURLParams() {
        const params = new URLSearchParams(window.location.search);
        
        // Limpiar ambos parámetros si no hay capítulo
        if (!this.currentChapter) {
            params.delete('chapter');
            params.delete('exercise');
        } else {
            params.set('chapter', this.currentChapter);
            // Solo mantener el ejercicio si hay uno seleccionado
            if (this.currentExercise) {
                params.set('exercise', this.currentExercise);
            } else {
                params.delete('exercise');
            }
        }
        
        const newURL = `${window.location.pathname}${params.toString() ? '?' + params.toString() : ''}`;
        window.history.pushState({}, '', newURL);
    }
} 