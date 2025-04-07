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
        this.isDuplicatedShader = false;
        this.currentTab = 'fragment'; // Para trackear qué shader estamos editando
        this.previousTab = 'fragment';
        
        // Configurar el botón de guardar inmediatamente
        const saveButton = document.getElementById('save-shader-btn');
        const duplicateButton = document.getElementById('duplicate-shader-btn');
        const saveButtonContainer = document.getElementById('save-button-container');

        if (saveButton) {
            saveButton.onclick = () => {
                this.saveShader();
            };
        }

        if (duplicateButton) {
            duplicateButton.onclick = () => {
                this.duplicateCurrentShader();
            };
        }

        // Guardar referencia al contenedor del botón de guardar
        this.saveButtonContainer = saveButtonContainer;
        this.saveButton = saveButton;
        
        // Ocultar el botón de guardar inicialmente
        this.updateSaveButtonVisibility();

        // Inicializar el editor primero
        this.initEditor();
        
        // Cargar el shader por defecto
        this.loadDefaultShader().catch(error => { /* error handling */ });

        // Configurar el modal de guardar nuevo shader
        const saveNewButton = document.getElementById('save-new-shader-btn');
        const modal = document.getElementById('save-modal');
        const saveModalBtn = document.getElementById('save-modal-btn');
        const cancelModalBtn = document.getElementById('cancel-modal-btn');
        const chapterInput = document.getElementById('chapter-input');
        const exerciseInput = document.getElementById('exercise-input');
        const newChapterInput = document.getElementById('new-chapter-input');
        const newExerciseInput = document.getElementById('new-exercise-input');

        if (saveNewButton) {
            saveNewButton.onclick = () => {
                this.showSaveModal();
            };
        } else {
            // Manejo si no se encuentra el botón
        }

        if (cancelModalBtn) {
            cancelModalBtn.onclick = () => this.hideModal();
        }

        if (saveModalBtn) {
            saveModalBtn.onclick = () => this.saveNewShader();
        }

        if (chapterInput) {
            chapterInput.onchange = (e) => {
                newChapterInput.classList.toggle('hidden', e.target.value !== 'new');
                this.updateExerciseInputOptions(e.target.value);
            };
        }

        if (exerciseInput) {
            exerciseInput.onchange = (e) => {
                newExerciseInput.classList.toggle('hidden', e.target.value !== 'new');
            };
        }

        // Guardar referencias
        this.modal = modal;
        this.chapterInput = chapterInput;
        this.exerciseInput = exerciseInput;
        this.newChapterInput = newChapterInput;
        this.newExerciseInput = newExerciseInput;

        this.defaultShaders = {
            vertex: null,
            fragment: null
        };
        
        this.currentShaders = {
            vertex: null,
            fragment: null
        };

        this.exerciseSelect = document.querySelector('#exercise-select');

        this.initialize();
    }

    async initialize() {
        console.log('Iniciando inicialización...');
        try {
            // Cargar los shaders por defecto primero
            const [vertexResponse, fragmentResponse] = await Promise.all([
                fetch('/src/shaders/default.vertex.glsl'),
                fetch('/src/shaders/default.fragment.glsl')
            ]);

            this.defaultShaders.vertex = await vertexResponse.text();
            this.defaultShaders.fragment = await fragmentResponse.text();

            // Inicializar con los shaders por defecto
            this.currentShaders = {
                vertex: this.defaultShaders.vertex,
                fragment: this.defaultShaders.fragment
            };

            // Inicializar el editor y los botones
            await this.initEditor();
            this.setupButtons();
            this.setupTabListeners();
            await this.loadShaderStructure();
            this.setupUI();
            
            // Inicializar desde URL si hay parámetros
            await this.initializeFromURL();
            
            // Actualizar breadcrumb
            this.updateBreadcrumb();
            
            console.log('Inicialización completada');
        } catch (error) {
            console.error('Error durante la inicialización:', error);
        }
    }

    initializeModalElements() {
        this.modal = document.getElementById('save-modal');
        this.chapterInput = document.getElementById('chapter-input');
        this.exerciseInput = document.getElementById('exercise-input');
        this.newChapterInput = document.getElementById('new-chapter-input');
        this.newExerciseInput = document.getElementById('new-exercise-input');
        const saveNewButton = document.getElementById('save-new-shader-btn');
        const saveModalBtn = document.getElementById('save-modal-btn');
        const cancelModalBtn = document.getElementById('cancel-modal-btn');

        if (saveNewButton) {
            saveNewButton.onclick = () => this.showSaveModal();
        }

        if (cancelModalBtn) {
            cancelModalBtn.onclick = () => this.hideModal();
        }

        if (saveModalBtn) {
            saveModalBtn.onclick = () => this.saveNewShader();
        }

        if (this.chapterInput) {
            this.chapterInput.onchange = (e) => {
                this.newChapterInput.classList.toggle('hidden', e.target.value !== 'new');
                this.updateExerciseInputOptions(e.target.value);
            };
        }

        if (this.exerciseInput) {
            this.exerciseInput.onchange = (e) => {
                this.newExerciseInput.classList.toggle('hidden', e.target.value !== 'new');
            };
        }
    }

    async loadShaderStructure() {
        try {
            const chapterSelect = document.getElementById('chapter-select');
            const exerciseSelect = document.getElementById('exercise-select');
            const chapterSkeleton = chapterSelect?.nextElementSibling;
            const exerciseSkeleton = exerciseSelect?.nextElementSibling;
            
            // Limpiar la estructura actual
            this.chapters.clear();
            
            console.log('Cargando estructura de shaders...');
            const response = await fetch('/api/list-shaders');
            const result = await response.json();
            
            if (!result.success) {
                throw new Error(result.error || 'Error al cargar la estructura de shaders');
            }
            
            console.log('Estructura recibida:', result.structure);
            
            // Actualizar la estructura
            for (const [chapterId, chapterData] of Object.entries(result.structure)) {
                this.chapters.set(chapterId, {
                    name: chapterData.name,
                    exercises: chapterData.exercises,
                    createdAt: chapterData.createdAt
                });
            }
            
            // Actualizar los selectores
            this.updateChapterSelect();
            this.updateExerciseSelect();
            
            // Mostrar los selectores y ocultar los skeletons
            if (chapterSelect && exerciseSelect && chapterSkeleton && exerciseSkeleton) {
                chapterSelect.style.display = 'block';
                exerciseSelect.style.display = 'block';
                chapterSkeleton.style.display = 'none';
                exerciseSkeleton.style.display = 'none';
                chapterSelect.classList.remove('loading');
                exerciseSelect.classList.remove('loading');
            }
            
            console.log('Estructura de shaders actualizada correctamente');
        } catch (error) {
            console.error('Error cargando la estructura de shaders:', error);
            
            // Asegurarnos de que los selectores sean visibles incluso si hay un error
            const chapterSelect = document.getElementById('chapter-select');
            const exerciseSelect = document.getElementById('exercise-select');
            const chapterSkeleton = chapterSelect?.nextElementSibling;
            const exerciseSkeleton = exerciseSelect?.nextElementSibling;
            
            if (chapterSelect && exerciseSelect && chapterSkeleton && exerciseSkeleton) {
                chapterSelect.style.display = 'block';
                exerciseSelect.style.display = 'block';
                chapterSkeleton.style.display = 'none';
                exerciseSkeleton.style.display = 'none';
                chapterSelect.classList.remove('loading');
                exerciseSelect.classList.remove('loading');
            }
            
            throw error;
        }
    }

    updateChapterSelect() {
        console.log('Iniciando updateChapterSelect...');
        const chapterSelect = document.getElementById('chapter-select');
        if (!chapterSelect) {
            console.error('No se encontró el selector de capítulos');
            return;
        }

        console.log('Estado actual de chapters:', 
            Array.from(this.chapters.entries()).map(([id, chapter]) => ({
                id,
                name: chapter.name,
                exercises: Object.keys(chapter.exercises)
            }))
        );
        
        // Limpiar el selector
        chapterSelect.innerHTML = '';
        console.log('Selector limpiado');
        
        // Añadir la opción por defecto
        const defaultOption = document.createElement('option');
        defaultOption.value = '';
        defaultOption.textContent = 'Seleccionar capítulo...';
        chapterSelect.appendChild(defaultOption);
        
        // Convertir el Map a array y ordenar por fecha de creación
        const sortedChapters = Array.from(this.chapters.entries())
            .sort((a, b) => {
                const dateA = new Date(a[1].createdAt || 0);
                const dateB = new Date(b[1].createdAt || 0);
                return dateA - dateB;
            });
        
        // Añadir cada capítulo
        for (const [id, chapter] of sortedChapters) {
            const option = document.createElement('option');
            option.value = id;
            option.textContent = chapter.name;
            chapterSelect.appendChild(option);
        }

        // Mantener la selección actual si existe
        if (this.currentChapter && this.chapters.has(this.currentChapter)) {
            chapterSelect.value = this.currentChapter;
        }

        console.log('Opciones finales en el selector:', 
            Array.from(chapterSelect.options).map(opt => ({
                value: opt.value,
                text: opt.textContent
            }))
        );
    }

    setupUI() {
        console.log('Iniciando setupUI...');
        const chapterSelect = document.getElementById('chapter-select');
        const exerciseSelect = document.getElementById('exercise-select');
        
        if (!chapterSelect || !exerciseSelect) {
            console.log('No se encontraron los selectores');
            return;
        }

        // Guardar los valores actuales antes de modificar el HTML
        const currentChapterValue = this.currentChapter;
        const currentExerciseValue = this.currentExercise;
        
        console.log('Valores actuales antes de setupUI:', {
            currentChapter: currentChapterValue,
            currentExercise: currentExerciseValue
        });

        // Actualizar las opciones del selector de capítulos ordenados por fecha
        const sortedChapters = Array.from(this.chapters.entries())
            .sort((a, b) => {
                const dateA = new Date(a[1].createdAt || 0);
                const dateB = new Date(b[1].createdAt || 0);
                return dateA - dateB;
            });

        chapterSelect.innerHTML = `
            <option value="">Seleccionar Capítulo</option>
            ${sortedChapters.map(([id, chapter]) => `
                <option value="${id}">${chapter.name}</option>
            `).join('')}
        `;

        // Configurar event listeners solo si no existen ya
        if (!chapterSelect.hasEventListener) {
            chapterSelect.addEventListener('change', async (e) => {
                const selectedChapter = e.target.value;
                
                // Si no hay capítulo seleccionado, volver a los shaders por defecto
                if (!selectedChapter) {
                    this.currentChapter = '';
                    this.currentExercise = '';
                    
                    try {
                        // Cargar los shaders por defecto
                        const [fragmentResponse, vertexResponse] = await Promise.all([
                            fetch('/src/shaders/default.fragment.glsl'),
                            fetch('/src/shaders/default.vertex.glsl')
                        ]);

                        const defaultFragmentCode = await fragmentResponse.text();
                        const defaultVertexCode = await vertexResponse.text();

                        // Actualizar el editor con el shader correspondiente según la pestaña actual
                        if (this.currentTab === 'fragment') {
                            this.editor.dispatch({
                                changes: {
                                    from: 0,
                                    to: this.editor.state.doc.length,
                                    insert: defaultFragmentCode
                                }
                            });
                        } else {
                            this.editor.dispatch({
                                changes: {
                                    from: 0,
                                    to: this.editor.state.doc.length,
                                    insert: defaultVertexCode
                                }
                            });
                        }

                        // Actualizar estado
                        this.currentShaders = {
                            fragment: defaultFragmentCode,
                            vertex: defaultVertexCode
                        };

                        // Disparar evento de cambio
                        const event = new CustomEvent('shaderChange', {
                            detail: {
                                vertex: defaultVertexCode,
                                fragment: defaultFragmentCode
                            }
                        });
                        document.dispatchEvent(event);
                    } catch (error) {
                        console.error('Error cargando shaders por defecto:', error);
                    }
                    
                    // Resetear el select de ejercicios
                    exerciseSelect.innerHTML = '<option value="">Seleccionar Ejercicio</option>';
                    
                    // Limpiar URL y actualizar UI
                this.updateURLParams();
                    this.updateBreadcrumb();
                    return;
                }

                this.currentChapter = selectedChapter;
                this.updateExerciseSelect();
                this.updateURLParams();
                this.updateBreadcrumb();
            });
            chapterSelect.hasEventListener = true;
        }

        if (!exerciseSelect.hasEventListener) {
            exerciseSelect.addEventListener('change', async (e) => {
                this.currentExercise = e.target.value;
                this.updateBreadcrumb();
                await this.loadShader(this.currentChapter, this.currentExercise);
                this.updateURLParams();
                this.updateSaveButtonVisibility();
            });
            exerciseSelect.hasEventListener = true;
        }

        // Restaurar los valores si existían
        if (currentChapterValue && this.chapters.has(currentChapterValue)) {
            console.log('Restaurando valores previos:', {
                chapter: currentChapterValue,
                exercise: currentExerciseValue
            });
            
            chapterSelect.value = currentChapterValue;
            this.updateExerciseSelect();
            
            if (currentExerciseValue) {
                exerciseSelect.value = currentExerciseValue;
            }
        }
        
        console.log('setupUI completado');
    }

    async initEditor() {
        const editorElement = document.getElementById('shader-editor');
        if (!editorElement) return;

        // Ya tenemos los shaders por defecto cargados
            this.editor = new EditorView({
            doc: this.defaultShaders.fragment, // Empezamos con el fragment shader
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

    setupTabListeners() {
        console.log('Configurando listeners de tabs...');
        const fragmentTab = document.getElementById('fragment-tab');
        const vertexTab = document.getElementById('vertex-tab');

        if (!fragmentTab || !vertexTab) {
            console.error('No se encontraron los tabs');
            return;
        }

        // Remover listeners existentes
        const newFragmentTab = fragmentTab.cloneNode(true);
        const newVertexTab = vertexTab.cloneNode(true);
        fragmentTab.parentNode.replaceChild(newFragmentTab, fragmentTab);
        vertexTab.parentNode.replaceChild(newVertexTab, vertexTab);

        // Añadir nuevos listeners
        newFragmentTab.addEventListener('click', () => {
            console.log('Click en fragment tab');
            this.switchTab('fragment');
        });
        
        newVertexTab.addEventListener('click', () => {
            console.log('Click en vertex tab');
            this.switchTab('vertex');
        });

        console.log('Listeners de tabs configurados');
    }

    switchTab(tab) {
        console.log('Cambiando a tab:', tab);
        
        // Guardar el contenido actual antes de cambiar
        if (this.currentTab === 'fragment') {
            this.currentShaders.fragment = this.editor.state.doc.toString();
        } else {
            this.currentShaders.vertex = this.editor.state.doc.toString();
        }
        
        this.currentTab = tab;
        
        const fragmentTab = document.getElementById('fragment-tab');
        const vertexTab = document.getElementById('vertex-tab');

        if (tab === 'fragment') {
            fragmentTab.classList.add('active');
            vertexTab.classList.remove('active');
            this.editor.dispatch({
                changes: {
                    from: 0,
                    to: this.editor.state.doc.length,
                    insert: this.currentShaders.fragment || ''
                }
            });
        } else {
            vertexTab.classList.add('active');
            fragmentTab.classList.remove('active');
            this.editor.dispatch({
                changes: {
                    from: 0,
                    to: this.editor.state.doc.length,
                    insert: this.currentShaders.vertex || ''
                }
            });
        }
        
        console.log('Tab cambiado a:', tab, 'Contenido actualizado');
    }

    onShaderChange(code) {
        // Actualizar el shader que se está editando actualmente
        const previousContent = this.currentTab === 'fragment' ? 
            this.currentShaders.fragment : 
            this.currentShaders.vertex;

        if (this.currentTab === 'fragment') {
            this.currentShaders.fragment = code;
        } else {
            this.currentShaders.vertex = code;
        }

        // Marcar cambios solo si el contenido es diferente
        this.hasChanges = code !== previousContent;
        this.updateSaveButtonVisibility();

        // Disparar evento de cambio
        const event = new CustomEvent('shaderChange', {
            detail: {
                vertex: this.currentShaders.vertex,
                fragment: this.currentShaders.fragment
            }
        });
        document.dispatchEvent(event);
    }

    escapeHTML(str) {
        return str.replace(/&/g, '&amp;')
                 .replace(/</g, '&lt;')
                 .replace(/>/g, '&gt;')
                 .replace(/"/g, '&quot;')
                 .replace(/'/g, '&#039;');
    }

    updateExerciseSelect() {
        console.log('Iniciando updateExerciseSelect...');
        console.log('Estado actual:', {
            currentChapter: this.currentChapter,
            currentExercise: this.currentExercise
        });

        const exerciseSelect = document.getElementById('exercise-select');
        if (!exerciseSelect) {
            console.log('No se encontró el selector de ejercicios');
            return;
        }

        if (!this.currentChapter || !this.chapters.has(this.currentChapter)) {
            console.log('No hay capítulo seleccionado o el capítulo no existe');
            exerciseSelect.innerHTML = '<option value="">Seleccionar Ejercicio</option>';
            exerciseSelect.disabled = true;
            return;
        }

        const chapterData = this.chapters.get(this.currentChapter);
        console.log('Datos del capítulo para ejercicios:', chapterData);

        // Convertir ejercicios a array y ordenar por fecha
        const exercises = Object.entries(chapterData.exercises || {})
            .sort((a, b) => {
                const dateA = new Date(a[1].createdAt || 0);
                const dateB = new Date(b[1].createdAt || 0);
                return dateA - dateB;
            });

        // Actualizar las opciones
        exerciseSelect.innerHTML = `
            <option value="">Seleccionar Ejercicio</option>
            ${exercises.map(([id, exercise]) => `
                <option value="${id}">${exercise.name}</option>
            `).join('')}
        `;
        exerciseSelect.disabled = false;

        // Restaurar el valor si existía y está disponible
        if (this.currentExercise && chapterData.exercises[this.currentExercise]) {
            console.log('Restaurando ejercicio:', this.currentExercise);
            exerciseSelect.value = this.currentExercise;
        } else {
            console.log('No se pudo restaurar el ejercicio:', {
                current: this.currentExercise,
                available: exercises
            });
        }
    }

    async loadShader(chapter, exercise) {
        if (!chapter || !exercise) {
            this.setShader(this.defaultShaders.fragment);
            return;
        }

        try {
            // Intentar cargar el vertex shader del ejercicio
            const vertexResponse = await fetch(`/src/shaders/${chapter}/${exercise}/vertex.glsl`);
            const fragmentResponse = await fetch(`/src/shaders/${chapter}/${exercise}/fragment.glsl`);

            if (!fragmentResponse.ok) {
                throw new Error('No se pudo cargar el fragment shader');
            }

            // Cargar el fragment shader
            this.currentShaders.fragment = await fragmentResponse.text();

            // Si existe un vertex shader en el ejercicio, usarlo
            if (vertexResponse.ok) {
                this.currentShaders.vertex = await vertexResponse.text();
            } else {
                // Si no existe, usar el vertex shader por defecto
                const defaultVertexResponse = await fetch('/src/shaders/default.vertex.glsl');
                this.currentShaders.vertex = await defaultVertexResponse.text();
            }

            // Actualizar el editor con el shader actual según la pestaña
            this.updateEditorContent();
            
            // Disparar evento de cambio con los shaders actuales
            this.dispatchShaderChange();

            // Resetear hasChanges al cargar un nuevo shader
            this.hasChanges = false;
            this.updateSaveButtonVisibility();
        } catch (error) {
            console.error('Error cargando shader:', error);
            this.setShader(this.defaultShaders.fragment);
        }
    }

    updateEditorContent() {
        if (!this.editor) {
            console.error('Editor no inicializado');
            return;
        }
        
        const content = this.currentTab === 'fragment' ? 
            this.currentShaders.fragment : 
            this.currentShaders.vertex;
        
        console.log(`Actualizando editor con ${this.currentTab} shader`);
        
        try {
            this.editor.dispatch({
                changes: {
                    from: 0,
                    to: this.editor.state.doc.length,
                    insert: content || ''
                }
            });
            
            console.log('Editor actualizado correctamente');
        } catch (error) {
            console.error('Error actualizando el editor:', error);
        }
    }

    dispatchShaderChange() {
        const event = new CustomEvent('shaderChange', {
            detail: {
                vertex: this.currentShaders.vertex,
                fragment: this.currentShaders.fragment
            }
        });
            document.dispatchEvent(event);
    }

    async saveShader() {
        if (!this.currentChapter || !this.currentExercise) {
            alert('Por favor, selecciona un capítulo y un ejercicio antes de guardar.');
            return;
        }

        const fragmentPath = `/src/shaders/${this.currentChapter}/${this.currentExercise}/fragment.glsl`;
        const vertexPath = `/src/shaders/${this.currentChapter}/${this.currentExercise}/vertex.glsl`;
        
        try {
            // Guardar ambos shaders
            await Promise.all([
                // Guardar fragment shader
                fetch('/api/save-shader', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                        content: this.currentShaders.fragment,
                        path: fragmentPath
                    })
                }),
                // Guardar vertex shader
                fetch('/api/save-shader', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        content: this.currentShaders.vertex,
                        path: vertexPath
                    })
                })
            ]);

            const cacheKey = `${this.currentChapter}-${this.currentExercise}`;
            this.shaderCache.delete(cacheKey);
            this.hasChanges = false;
            this.updateSaveButtonVisibility();

            alert('Shaders guardados correctamente');
        } catch (error) {
            alert('Error al guardar los shaders: ' + error.message);
        }
    }

    async loadDefaultShader() {
        try {
            const response = await fetch('/src/shaders/default.fragment.glsl');
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            const defaultShaderCode = await response.text();
            this.defaultShaders.fragment = defaultShaderCode;
            
            if (!this.currentShader) {
                this.setShader(this.defaultShaders.fragment);
            }
        } catch (error) {
            const basicShader = `void main() {
    gl_FragColor = vec4(0.5, 0.5, 0.5, 1.0);
}`;
            this.defaultShaders.fragment = basicShader;
            
            if (!this.currentShader) {
                this.setShader(basicShader);
            }
        }
    }

    async createNewShader() {
        console.log('Creando nuevo shader...');
        
        // Resetear el estado de capítulo y ejercicio
        this.currentChapter = '';
        this.currentExercise = '';
        
        // Resetear los selectores
        const chapterSelect = document.getElementById('chapter-select');
        const exerciseSelect = document.getElementById('exercise-select');
        
        if (chapterSelect) {
            chapterSelect.value = '';
        }
        if (exerciseSelect) {
            exerciseSelect.value = '';
            exerciseSelect.disabled = true; // Deshabilitar hasta que se seleccione un capítulo
        }

        // Usar los shaders por defecto
        this.currentShaders = {
            vertex: this.defaultShaders.vertex,
            fragment: this.defaultShaders.fragment
        };

        // Actualizar el editor con el shader correspondiente a la pestaña actual
        this.updateEditorContent();

        // Limpiar la URL
        this.updateURLParams();

        // Actualizar el breadcrumb
        this.isDuplicatedShader = false; // Resetear el flag de duplicado
        this.updateBreadcrumb();

        // Resetear estado de cambios
        this.hasChanges = false;
        this.updateSaveButtonVisibility();

        // Disparar evento de cambio
        const event = new CustomEvent('shaderChange', {
            detail: {
                vertex: this.currentShaders.vertex,
                fragment: this.currentShaders.fragment
            }
        });
        document.dispatchEvent(event);

        console.log('Nuevo shader creado y estado reseteado');
    }

    duplicateCurrentShader() {
        const currentCode = this.editor.state.doc.toString();
        const chapterSelect = document.getElementById('chapter-select');
        const exerciseSelect = document.getElementById('exercise-select');
        if (chapterSelect) chapterSelect.value = '';
        if (exerciseSelect) exerciseSelect.value = '';
        this.currentChapter = '';
        this.currentExercise = '';
        this.setShader(currentCode);
        this.updateSaveButtonVisibility();
        this.updateURLParams();
        this.isDuplicatedShader = true;
        this.updateBreadcrumb();
    }

    setShader(shaderCode) {
        // Asegurarnos de que estamos usando los shaders correctos
        this.currentShaders = {
            fragment: shaderCode || this.defaultShaders.fragment,
            vertex: this.defaultShaders.vertex
        };
        
        // Actualizar el editor con el shader correspondiente según la pestaña actual
        if (this.currentTab === 'fragment') {
            this.updateEditor(this.currentShaders.fragment);
        } else {
            this.updateEditor(this.currentShaders.vertex);
        }

        // Disparar evento de cambio
        const event = new CustomEvent('shaderChange', {
            detail: {
                vertex: this.currentShaders.vertex,
                fragment: this.currentShaders.fragment
            }
        });
        document.dispatchEvent(event);

        this.hasChanges = false;
        this.updateSaveButtonVisibility();
    }

    updateSaveButtonVisibility() {
        console.log('Actualizando visibilidad del botón de guardar:', {
            currentChapter: this.currentChapter,
            currentExercise: this.currentExercise,
            hasChanges: this.hasChanges
        });
        
        const saveButtonContainer = document.getElementById('save-button-container');
        const saveButton = document.getElementById('save-shader-btn');
        
        if (!saveButtonContainer || !saveButton) {
            console.error('No se encontraron los elementos del botón de guardar');
            return;
        }
        
        // Mostrar el contenedor solo si hay un ejercicio seleccionado
        if (this.currentChapter && this.currentExercise) {
            saveButtonContainer.style.display = 'block';
            // Habilitar el botón SOLO si hay cambios sin guardar
            saveButton.disabled = !this.hasChanges;
            console.log(`Botón ${this.hasChanges ? 'habilitado' : 'deshabilitado'} porque ${this.hasChanges ? 'hay' : 'no hay'} cambios`);
        } else {
            saveButtonContainer.style.display = 'none';
            saveButton.disabled = true;
        }
    }

    updateURLParams() {
        const params = new URLSearchParams(window.location.search);
        
        // Si no hay capítulo, limpiamos todos los parámetros
        if (!this.currentChapter) {
            params.delete('chapter');
            params.delete('exercise');
        } else {
            params.set('chapter', this.currentChapter);
            
            // Si hay ejercicio lo añadimos, si no, lo eliminamos
            if (this.currentExercise) {
                params.set('exercise', this.currentExercise);
            } else {
                params.delete('exercise');
            }
        }
        
        // Actualizar la URL sin recargar la página
        const newURL = `${window.location.pathname}${params.toString() ? '?' + params.toString() : ''}`;
        window.history.pushState({}, '', newURL);
    }

    showSaveModal() {
        if (!this.modal || !this.chapterInput) {
            return;
        }
        
        // Ordenar capítulos por fecha de creación
        const sortedChapters = Array.from(this.chapters.entries())
            .sort((a, b) => {
                const dateA = new Date(a[1].createdAt || 0);
                const dateB = new Date(b[1].createdAt || 0);
                return dateA - dateB;
            });
        
        this.chapterInput.innerHTML = `
            <option value="">Seleccionar capítulo existente...</option>
            ${sortedChapters.map(([id, chapter]) => `
                <option value="${id}">${chapter.name}</option>
            `).join('')}
            <option value="new">Crear nuevo capítulo</option>
        `;

        this.modal.classList.add('show');
    }

    hideModal() {
        if (!this.modal) {
            return;
        }
        
        this.modal.classList.remove('show');
        
        if (this.newChapterInput) {
            this.newChapterInput.value = '';
            this.newChapterInput.classList.add('hidden');
        }
        
        if (this.newExerciseInput) {
            this.newExerciseInput.value = '';
            this.newExerciseInput.classList.add('hidden');
        }
        
        if (this.chapterInput) {
            this.chapterInput.value = '';
        }
        
        if (this.exerciseInput) {
            this.exerciseInput.value = '';
        }
    }

    updateExerciseInputOptions(chapterId) {
        if (!this.exerciseInput) {
            return;
        }
        
        if (!chapterId || chapterId === 'new') {
            this.exerciseInput.innerHTML = `
                <option value="">Seleccionar Ejercicio</option>
                <option value="new">Crear nuevo ejercicio</option>
            `;
            return;
        }

        const chapter = this.chapters.get(chapterId);
        if (!chapter) {
            return;
        }

        // Convertir ejercicios a array y ordenar por fecha
        const sortedExercises = Object.entries(chapter.exercises)
            .sort((a, b) => {
                const dateA = new Date(a[1].createdAt || 0);
                const dateB = new Date(b[1].createdAt || 0);
                return dateA - dateB;
            });

        this.exerciseInput.innerHTML = `
            <option value="">Seleccionar ejercicio existente...</option>
            ${sortedExercises.map(([id, exercise]) => `
                <option value="${id}">${exercise.name}</option>
            `).join('')}
            <option value="new">Crear nuevo ejercicio</option>
        `;
    }

    async updateExerciseList() {
        try {
            // Obtener la lista actualizada de ejercicios
            const response = await fetch(`/api/list-exercises?chapter=${this.currentChapter}`);
            if (!response.ok) {
                throw new Error('Error obteniendo la lista de ejercicios');
            }

            const exercises = await response.json();

            // Limpiar el select actual
            while (this.exerciseSelect.firstChild) {
                this.exerciseSelect.removeChild(this.exerciseSelect.firstChild);
            }

            // Añadir los ejercicios al select
            exercises.forEach(exercise => {
                const option = document.createElement('option');
                option.value = exercise;
                option.textContent = exercise;
                this.exerciseSelect.appendChild(option);
            });

            // Seleccionar el último ejercicio (el que acabamos de crear)
            if (exercises.length > 0) {
                this.exerciseSelect.value = exercises[exercises.length - 1];
                // Disparar evento de cambio
                this.exerciseSelect.dispatchEvent(new Event('change'));
            }

        } catch (error) {
            console.error('Error actualizando lista de ejercicios:', error);
        }
    }

    async saveNewShader() {
        const chapterInput = document.getElementById('chapter-input');
        const newChapterInput = document.getElementById('new-chapter-input');
        const newExerciseInput = document.getElementById('new-exercise-input');

        let finalChapterId;
        let exerciseName;

        // Determinar el capítulo
        if (chapterInput.value === 'new') {
            if (!newChapterInput.value.trim()) {
                alert('Por favor, introduce un nombre para el nuevo capítulo');
                return;
            }
            finalChapterId = this.sanitizeId(newChapterInput.value);
        } else {
            if (!chapterInput.value) {
                alert('Por favor, selecciona un capítulo');
                return;
            }
            finalChapterId = chapterInput.value;
        }

        // Obtener nombre del ejercicio
        if (!newExerciseInput.value.trim()) {
            alert('Por favor, introduce un nombre para el ejercicio');
            return;
        }
        exerciseName = this.sanitizeId(newExerciseInput.value);

        // Asegurarnos de que tenemos shaders válidos
        const fragmentCode = this.currentShaders.fragment || this.defaultShaders.fragment;
        const vertexCode = this.currentShaders.vertex || this.defaultShaders.vertex;
        
        const fragmentPath = `/src/shaders/${finalChapterId}/${exerciseName}/fragment.glsl`;
        const vertexPath = `/src/shaders/${finalChapterId}/${exerciseName}/vertex.glsl`;
        
        try {
            // Guardar ambos shaders
            await Promise.all([
                fetch('/api/save-shader', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                        content: fragmentCode,
                        path: fragmentPath,
                    isNew: true
                })
                }),
                fetch('/api/save-shader', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        content: vertexCode,
                        path: vertexPath,
                        isNew: true
                    })
                })
            ]);

            // Actualizar el estado
                this.currentChapter = finalChapterId;
            this.currentExercise = exerciseName;
            
            // Asegurarnos de que los shaders actuales son válidos
            this.currentShaders = {
                vertex: vertexCode,
                fragment: fragmentCode
            };

            // Recargar la estructura de shaders
            await this.loadShaderStructure();
            
            // Cerrar el modal
            this.hideModal();
            
            // Actualizar el resto de la UI
                this.hasChanges = false;
                this.updateSaveButtonVisibility();
                this.updateURLParams();
            this.updateBreadcrumb();

            // Disparar evento de cambio de shader
            const event = new CustomEvent('shaderChange', {
                detail: {
                    vertex: vertexCode,
                    fragment: fragmentCode
                }
            });
            document.dispatchEvent(event);

            alert('Shaders guardados correctamente');
            } catch (error) {
            alert('Error al guardar los shaders: ' + error.message);
        }
    }

    // Función auxiliar para sanitizar IDs
    sanitizeId(name) {
        return name.toLowerCase()
                   .replace(/\s+/g, '-')           // Espacios a guiones
                   .replace(/[^a-z0-9-]/g, '')     // Remover caracteres no permitidos
                   .replace(/-+/g, '-')            // Múltiples guiones a uno solo
                   .replace(/^-+|-+$/g, '');       // Remover guiones del inicio y final
    }

    async duplicateShader() {
        const sourceChapter = this.currentChapter;
        const sourceExercise = this.currentExercise;
        const targetExercise = this.generateNewExerciseId();
        const targetDir = `src/shaders/${sourceChapter}/${targetExercise}`;

        try {
            // Primero crear el directorio destino
            await fetch('/api/create-directory', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    path: targetDir
                })
            });

            // Duplicar ambos shaders
            await Promise.all([
                // Duplicar fragment shader
                fetch('/api/duplicate-shader', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        sourcePath: `src/shaders/${sourceChapter}/${sourceExercise}/fragment.glsl`,
                        targetPath: `${targetDir}/fragment.glsl`
                    })
                }),
                // Duplicar vertex shader
                fetch('/api/duplicate-shader', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        sourcePath: `src/shaders/${sourceChapter}/${sourceExercise}/vertex.glsl`,
                        targetPath: `${targetDir}/vertex.glsl`
                    })
                })
            ]);

            // Actualizar la lista de ejercicios
            await this.updateExerciseList();
            
            // Seleccionar el nuevo ejercicio
            await this.selectExercise(targetExercise);

            console.log(`Shaders duplicados en ${targetDir}`);

        } catch (error) {
            console.error('Error duplicando shaders:', error);
            alert('Error al duplicar los shaders: ' + error.message);
        }
    }

    generateNewExerciseId() {
        // ... código existente ...
    }

    updateBreadcrumb() {
        const breadcrumb = document.getElementById('shader-breadcrumb');
        if (!breadcrumb) return;

        let text = '';
        
        if (this.currentChapter && this.currentExercise) {
            // Caso normal: capítulo y ejercicio seleccionados
            text = `Capítulo: ${this.currentChapter} > Ejercicio: ${this.currentExercise}`;
        } else if (this.isDuplicatedShader) {
            // Caso de shader duplicado
            text = 'Shader duplicado';
        } else {
            // Caso por defecto
            text = 'Shader por defecto';
        }

        breadcrumb.textContent = text;
    }

    // Función auxiliar para obtener capítulos
    async getChapters() {
        const response = await fetch('/api/list-chapters');
        if (!response.ok) {
            throw new Error('Error obteniendo capítulos');
        }
        return await response.json();
    }

    // Función auxiliar para obtener ejercicios
    async getExercises(chapter) {
        const response = await fetch(`/api/list-exercises?chapter=${chapter}`);
        if (!response.ok) {
            throw new Error('Error obteniendo ejercicios');
        }
        return await response.json();
    }

    setupButtons() {
        console.log('Configurando botones...');
        
        // Configurar el botón de borrar
        const deleteButton = document.getElementById('delete-shader-btn');
        if (deleteButton) {
            console.log('Botón de borrar encontrado, añadiendo listener');
            deleteButton.addEventListener('click', () => {
                console.log('Click en botón de borrar');
                this.deleteCurrentShader();
            });
        } else {
            console.error('No se encontró el botón de borrar');
        }
    }

    // Método para manejar cambios en el select de capítulo
    async onChapterChange(event) {
        const selectedChapter = event.target.value;
        console.log('Cambio de capítulo:', selectedChapter);

        // Si se selecciona "null", resetear todo
        if (!selectedChapter || selectedChapter === "null") {
            this.currentChapter = '';
            this.currentExercise = '';
            this.updateExerciseSelect();
            this.updateURLParams();
            this.updateBreadcrumb();
            
            // Cargar shaders por defecto
            this.currentShaders = {
                vertex: this.defaultShaders.vertex,
                fragment: this.defaultShaders.fragment
            };
            
            // Actualizar editor con shader por defecto
            this.updateEditorContent();
            return;
        }

        this.currentChapter = selectedChapter;
        this.currentExercise = '';  // Reset exercise when chapter changes
        
        // Actualizar el select de ejercicios
        await this.updateExerciseSelect();
        
        // Actualizar URL y breadcrumb
        this.updateURLParams();
        this.updateBreadcrumb();
    }

    // Método para manejar cambios en el select de ejercicio
    async onExerciseChange(event) {
        const selectedExercise = event.target.value;
        console.log('Cambio de ejercicio:', selectedExercise);

        // Si se selecciona "null", resetear solo el ejercicio
        if (!selectedExercise || selectedExercise === "null") {
            this.currentExercise = '';
            this.updateURLParams();
            this.updateBreadcrumb();
            
            // Cargar shaders por defecto
            this.currentShaders = {
                vertex: this.defaultShaders.vertex,
                fragment: this.defaultShaders.fragment
            };
            
            // Actualizar editor con shader por defecto
            this.updateEditorContent();
            return;
        }

        this.currentExercise = selectedExercise;
        
        // Cargar el shader seleccionado
        await this.loadShader(this.currentChapter, selectedExercise);
        
        // Actualizar URL y breadcrumb
        this.updateURLParams();
        this.updateBreadcrumb();
    }

    // Método para inicializar los selects con los valores de la URL
    async initializeFromURL() {
        const params = new URLSearchParams(window.location.search);
        const urlChapter = params.get('chapter');
        const urlExercise = params.get('exercise');
        
        console.log('Inicializando desde URL:', { urlChapter, urlExercise });
        
        if (urlChapter) {
            // Actualizar el select de capítulo
            const chapterSelect = document.getElementById('chapter-select');
            if (chapterSelect) {
                chapterSelect.value = urlChapter;
                this.currentChapter = urlChapter;
                
                // Actualizar el select de ejercicios
                await this.updateExerciseSelect();
                
                if (urlExercise) {
                    const exerciseSelect = document.getElementById('exercise-select');
                    if (exerciseSelect) {
                        exerciseSelect.value = urlExercise;
                        this.currentExercise = urlExercise;
                        
                        // Cargar el shader
                        await this.loadShader(urlChapter, urlExercise);
                    }
                }
            }
        }
    }
} 