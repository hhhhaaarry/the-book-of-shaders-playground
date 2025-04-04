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
    }

    async initialize() {
        console.log('Iniciando initialize...');
        
        // Mostrar skeleton loaders inmediatamente
        const chapterSelect = document.getElementById('chapter-select');
        const exerciseSelect = document.getElementById('exercise-select');
        const chapterSkeleton = chapterSelect?.nextElementSibling;
        const exerciseSkeleton = exerciseSelect?.nextElementSibling;
        
        if (chapterSelect && exerciseSelect && chapterSkeleton && exerciseSkeleton) {
            chapterSelect.style.display = 'none';
            exerciseSelect.style.display = 'none';
            chapterSkeleton.style.display = 'block';
            exerciseSkeleton.style.display = 'block';
        }
        
        try {
            const params = new URLSearchParams(window.location.search);
            const urlChapter = params.get('chapter');
            const urlExercise = params.get('exercise');
            
            console.log('Parámetros de URL:', { urlChapter, urlExercise });
            
            await this.loadShaderStructure();
            
            console.log('Estructura de capítulos:', this.chapters);
            
            this.setupUI();
            
            if (urlChapter && this.chapters.has(urlChapter)) {
                console.log('Capítulo encontrado, estableciendo...');
                this.currentChapter = urlChapter;
                const chapterData = this.chapters.get(urlChapter);
                
                console.log('Datos del capítulo:', chapterData);
                
                // Actualizar selector de capítulo
                if (chapterSelect) {
                    console.log('Actualizando selector de capítulo a:', urlChapter);
                    chapterSelect.value = urlChapter;
                }
                
                // Verificar si el ejercicio existe en el capítulo
                const exercises = Object.keys(chapterData.exercises || {});
                console.log('Ejercicios disponibles:', exercises);
                
                if (urlExercise && exercises.includes(urlExercise)) {
                    console.log('Ejercicio encontrado, estableciendo:', urlExercise);
                    this.currentExercise = urlExercise;
                    
                    // Actualizar ejercicios disponibles
                    this.updateExerciseSelect();
                    
                    // Asegurarnos de que el ejercicio esté seleccionado
                    if (exerciseSelect) {
                        exerciseSelect.value = urlExercise;
                    }
                    
                    // Cargar el shader
                    console.log('Cargando shader...');
                    await this.loadShader();
                } else {
                    console.log('Ejercicio no encontrado:', {
                        urlExercise,
                        availableExercises: exercises
                    });
                    this.updateExerciseSelect();
                }
            }
            
            // Mostrar selectores y ocultar skeletons
            if (chapterSelect && exerciseSelect && chapterSkeleton && exerciseSkeleton) {
                chapterSelect.style.display = 'block';
                exerciseSelect.style.display = 'block';
                chapterSkeleton.style.display = 'none';
                exerciseSkeleton.style.display = 'none';
            }
            
            console.log('ShaderLoader inicializado correctamente');
        } catch (error) {
            console.error('Error durante la inicialización:', error);
            // Asegurarse de que los selectores sean visibles en caso de error
            if (chapterSelect && exerciseSelect && chapterSkeleton && exerciseSkeleton) {
                chapterSelect.style.display = 'block';
                exerciseSelect.style.display = 'block';
                chapterSkeleton.style.display = 'none';
                exerciseSkeleton.style.display = 'none';
            }
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
                    exercises: chapterData.exercises
                });
            }
            
            console.log('Estructura actualizada:', this.chapters);
            
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
        
        // Añadir cada capítulo
        for (const [id, chapter] of this.chapters.entries()) {
            console.log('Añadiendo capítulo:', { id, name: chapter.name });
            const option = document.createElement('option');
            option.value = id;
            option.textContent = chapter.name;
            chapterSelect.appendChild(option);
        }

        // Si hay un capítulo seleccionado, mantenerlo
        if (this.currentChapter && this.chapters.has(this.currentChapter)) {
            console.log('Manteniendo capítulo seleccionado:', this.currentChapter);
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

        // Actualizar las opciones del selector de capítulos
        chapterSelect.innerHTML = `
            <option value="">Seleccionar Capítulo</option>
            ${Array.from(this.chapters.entries()).map(([id, chapter]) => `
                <option value="${id}">${chapter.name}</option>
            `).join('')}
        `;

        // Configurar event listeners solo si no existen ya
        if (!chapterSelect.hasEventListener) {
            chapterSelect.addEventListener('change', async (e) => {
                const selectedChapter = e.target.value;
                this.currentChapter = selectedChapter;
                this.currentExercise = '';
                exerciseSelect.value = '';
                this.updateExerciseSelect();
                
                if (!selectedChapter) {
                    console.log('Capítulo deseleccionado, volviendo al shader por defecto');
                    await this.loadShader();
                }
                
                this.updateURLParams();
                this.updateSaveButtonVisibility();
            });
            chapterSelect.hasEventListener = true;
        }

        if (!exerciseSelect.hasEventListener) {
            exerciseSelect.addEventListener('change', async (e) => {
                this.currentExercise = e.target.value;
                await this.loadShader();
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
        if (!editorElement) {
            return;
        }

        try {
            const response = await fetch('/src/shaders/default.fragment.glsl');
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            const defaultShaderCode = await response.text();
            this.defaultShader = defaultShaderCode;
            
            this.editor = new EditorView({
                doc: defaultShaderCode,
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
            
            this.currentShader = {
                fragment: defaultShaderCode,
                uniforms: {
                    u_resolution: { value: new THREE.Vector2() },
                    u_mouse: { value: new THREE.Vector2() },
                    u_time: { value: 0 }
                }
            };
            
            this.onShaderChange(defaultShaderCode);
            
            this.hasChanges = false;
            this.updateSaveButtonVisibility();
        } catch (error) {
            const basicShader = `void main() {
    gl_FragColor = vec4(0.5, 0.5, 0.5, 1.0);
}`;
            this.defaultShader = basicShader;
            
            this.editor = new EditorView({
                doc: basicShader,
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
            
            this.currentShader = {
                fragment: basicShader,
                uniforms: {
                    u_resolution: { value: new THREE.Vector2() },
                    u_mouse: { value: new THREE.Vector2() },
                    u_time: { value: 0 }
                }
            };
            
            this.onShaderChange(basicShader);
            
            this.hasChanges = false;
            this.updateSaveButtonVisibility();
        }
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

        // Obtener ejercicios del objeto
        const exercises = Object.keys(chapterData.exercises || {});
        console.log('Ejercicios disponibles:', exercises);

        // Actualizar las opciones
        exerciseSelect.innerHTML = `
            <option value="">Seleccionar Ejercicio</option>
            ${exercises.map(exercise => `
                <option value="${exercise}">${exercise}</option>
            `).join('')}
        `;
        exerciseSelect.disabled = false;

        // Restaurar el valor si existía y está disponible
        if (this.currentExercise && exercises.includes(this.currentExercise)) {
            console.log('Restaurando ejercicio:', this.currentExercise);
            exerciseSelect.value = this.currentExercise;
        } else {
            console.log('No se pudo restaurar el ejercicio:', {
                current: this.currentExercise,
                available: exercises
            });
        }
    }

    async loadShader() {
        if (!this.currentChapter || !this.currentExercise) {
            console.log('No hay shader seleccionado, volviendo al shader por defecto');
            // Si tenemos el shader por defecto, lo usamos
            if (this.defaultShader) {
                this.currentShader = {
                    fragment: this.defaultShader,
                    uniforms: {
                        u_resolution: { value: new THREE.Vector2() },
                        u_mouse: { value: new THREE.Vector2() },
                        u_time: { value: 0 }
                    }
                };
                this.updateEditor(this.defaultShader);
                this.onShaderChange(this.defaultShader);
            } else {
                // Si no tenemos el shader por defecto, intentamos cargarlo
                try {
                    const response = await fetch('/src/shaders/default.fragment.glsl');
                    if (!response.ok) {
                        throw new Error(`HTTP error! status: ${response.status}`);
                    }
                    const defaultShaderCode = await response.text();
                    this.defaultShader = defaultShaderCode;
                    this.currentShader = {
                        fragment: defaultShaderCode,
                        uniforms: {
                            u_resolution: { value: new THREE.Vector2() },
                            u_mouse: { value: new THREE.Vector2() },
                            u_time: { value: 0 }
                        }
                    };
                    this.updateEditor(defaultShaderCode);
                    this.onShaderChange(defaultShaderCode);
                } catch (error) {
                    console.error('Error cargando shader por defecto:', error);
                    // En caso de error, usar un shader básico
                    const basicShader = `void main() {
    gl_FragColor = vec4(0.5, 0.5, 0.5, 1.0);
}`;
                    this.currentShader = {
                        fragment: basicShader,
                        uniforms: {
                            u_resolution: { value: new THREE.Vector2() },
                            u_mouse: { value: new THREE.Vector2() },
                            u_time: { value: 0 }
                        }
                    };
                    this.updateEditor(basicShader);
                    this.onShaderChange(basicShader);
                }
            }
            
            this.hasChanges = false;
            this.updateSaveButtonVisibility();
            this.updateURLParams();
            return;
        }
        
        try {
            const cacheKey = `${this.currentChapter}-${this.currentExercise}`;
            if (this.shaderCache.has(cacheKey)) {
                console.log('Usando shader en caché');
                this.currentShader = this.shaderCache.get(cacheKey);
            } else {
                console.log('Cargando shader desde archivo');
                try {
                    // Primero intentamos usar import
                    const fragmentShader = await import(`../shaders/${this.currentChapter}/${this.currentExercise}/fragment.glsl?raw`);
                    this.currentShader = {
                        fragment: fragmentShader.default,
                        uniforms: {
                            u_resolution: { value: new THREE.Vector2() },
                            u_mouse: { value: new THREE.Vector2() },
                            u_time: { value: 0 }
                        }
                    };
                } catch (importError) {
                    // Si falla el import, intentamos con fetch
                    console.log('Import falló, intentando con fetch');
                    const response = await fetch(`/src/shaders/${this.currentChapter}/${this.currentExercise}/fragment.glsl`);
                    if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
                    const shaderCode = await response.text();
                    this.currentShader = {
                        fragment: shaderCode,
                        uniforms: {
                            u_resolution: { value: new THREE.Vector2() },
                            u_mouse: { value: new THREE.Vector2() },
                            u_time: { value: 0 }
                        }
                    };
                }
                this.shaderCache.set(cacheKey, this.currentShader);
            }
            
            this.updateEditor(this.currentShader.fragment);
            this.onShaderChange(this.currentShader.fragment);
            this.hasChanges = false;
            this.updateSaveButtonVisibility();
            this.updateURLParams();
        } catch (error) {
            console.error('Error cargando el shader:', error);
            alert(`Error al cargar el shader: ${error.message}`);
        }
    }

    updateEditor(code) {
        if (!this.editor) {
            console.error('Editor no inicializado');
            return;
        }
        
        console.log('Actualizando editor con nuevo código:', code.substring(0, 50) + '...');
        
        try {
            // Crear una transacción simple para reemplazar todo el contenido
            this.editor.dispatch({
                changes: {
                    from: 0,
                    to: this.editor.state.doc.length,
                    insert: code
                }
            });
            
            console.log('Editor actualizado correctamente');
        } catch (error) {
            console.error('Error actualizando el editor:', error);
            
            // Si falla la actualización, recreamos el editor como fallback
            const editorElement = document.getElementById('shader-editor');
            if (editorElement) {
                editorElement.innerHTML = '';
                this.editor = new EditorView({
                    doc: code,
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
        }
    }

    onShaderChange(code) {
        const event = new CustomEvent('shaderChange', { detail: { code } });
        document.dispatchEvent(event);
    }

    async saveShader() {
        if (!this.currentChapter || !this.currentExercise) {
            alert('Por favor, Selecciona un capítulo y un ejercicio antes de guardar.');
            return;
        }

        const shaderCode = this.editor.state.doc.toString();
        const filePath = `/src/shaders/${this.currentChapter}/${this.currentExercise}/fragment.glsl`;
        
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

            const cacheKey = `${this.currentChapter}-${this.currentExercise}`;
            this.shaderCache.delete(cacheKey);
            this.hasChanges = false;
            this.updateSaveButtonVisibility();

            alert('Shader guardado correctamente');
        } catch (error) {
            alert('Error al guardar el shader: ' + error.message);
        }
    }

    async loadDefaultShader() {
        try {
            const response = await fetch('/src/shaders/default.fragment.glsl');
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            const defaultShaderCode = await response.text();
            this.defaultShader = defaultShaderCode;
            
            if (!this.currentShader) {
                this.setShader(defaultShaderCode);
            }
        } catch (error) {
            const basicShader = `void main() {
    gl_FragColor = vec4(0.5, 0.5, 0.5, 1.0);
}`;
            this.defaultShader = basicShader;
            
            if (!this.currentShader) {
                this.setShader(basicShader);
            }
        }
    }

    createNewShader() {
        if (this.defaultShader) {
            this.updateEditor(this.defaultShader);
            this.currentShader = {
                fragment: this.defaultShader,
                uniforms: {
                    u_resolution: { value: new THREE.Vector2() },
                    u_mouse: { value: new THREE.Vector2() },
                    u_time: { value: 0 }
                }
            };
            this.onShaderChange(this.defaultShader);
        } else {
            const basicShader = `void main() {
    gl_FragColor = vec4(0.5, 0.5, 0.5, 1.0);
}`;
            this.updateEditor(basicShader);
            this.currentShader = {
                fragment: basicShader,
                uniforms: {
                    u_resolution: { value: new THREE.Vector2() },
                    u_mouse: { value: new THREE.Vector2() },
                    u_time: { value: 0 }
                }
            };
            this.onShaderChange(basicShader);
        }
        
        const chapterSelect = document.getElementById('chapter-select');
        const exerciseSelect = document.getElementById('exercise-select');
        if (chapterSelect) chapterSelect.value = '';
        if (exerciseSelect) exerciseSelect.value = '';
        
        this.currentChapter = '';
        this.currentExercise = '';
        this.hasChanges = false;
        this.updateSaveButtonVisibility();
        this.updateURLParams();
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
        this.hasChanges = false;
        this.updateSaveButtonVisibility();
    }

    updateSaveButtonVisibility() {
        if (!this.saveButtonContainer || !this.saveButton) {
            return;
        }
        
        if (!this.currentChapter || !this.currentExercise) {
            this.saveButtonContainer.style.display = 'none';
            return;
        }

        this.saveButtonContainer.style.display = 'block';
        this.saveButton.disabled = !this.hasChanges;
    }

    updateURLParams() {
        const params = new URLSearchParams(window.location.search);
        
        if (!this.currentChapter) {
            params.delete('chapter');
            params.delete('exercise');
        } else {
            params.set('chapter', this.currentChapter);
            if (this.currentExercise) {
                params.set('exercise', this.currentExercise);
            } else {
                params.delete('exercise');
            }
        }
        
        const newURL = `${window.location.pathname}${params.toString() ? '?' + params.toString() : ''}`;
        window.history.pushState({}, '', newURL);
    }

    showSaveModal() {
        if (!this.modal) {
            return;
        }
        
        if (!this.chapterInput) {
            return;
        }
        
        this.chapterInput.innerHTML = `
            <option value="">Seleccionar capítulo existente...</option>
            ${Array.from(this.chapters.entries()).map(([id, chapter]) => `
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

        this.exerciseInput.innerHTML = `
            <option value="">Seleccionar ejercicio existente...</option>
            ${Object.entries(chapter.exercises).map(([id, exercise]) => `
                <option value="${id}">${exercise.name}</option>
            `).join('')}
            <option value="new">Crear nuevo ejercicio</option>
        `;
    }

    async saveNewShader() {
        console.log('Iniciando saveNewShader...');
        const chapterId = this.chapterInput.value;
        const exerciseId = this.exerciseInput.value;
        const newChapterName = this.newChapterInput.value;
        const newExerciseName = this.newExerciseInput.value;
        
        console.log('Datos del formulario:', {
            chapterId,
            exerciseId,
            newChapterName,
            newExerciseName
        });
        
        if (chapterId === 'new' && !newChapterName) {
            alert('Por favor, proporciona un nombre para el nuevo capítulo');
            return;
        }
        
        if (exerciseId === 'new' && !newExerciseName) {
            alert('Por favor, proporciona un nombre para el nuevo ejercicio');
            return;
        }
        
        const finalChapterId = chapterId === 'new' ? newChapterName : chapterId;
        const finalExerciseId = exerciseId === 'new' ? newExerciseName : exerciseId;
        
        console.log('IDs finales:', { finalChapterId, finalExerciseId });

        const shaderCode = this.editor.state.doc.toString();
        const filePath = `src/shaders/${finalChapterId}/${finalExerciseId}/fragment.glsl`;
        
        console.log('Guardando shader en:', filePath);

        try {
            // Ocultar el modal inmediatamente
            this.hideModal();

            // Mostrar skeletons y ocultar selectores ANTES de guardar
            const chapterSelect = document.getElementById('chapter-select');
            const exerciseSelect = document.getElementById('exercise-select');
            const chapterSkeleton = chapterSelect?.nextElementSibling;
            const exerciseSkeleton = exerciseSelect?.nextElementSibling;
            console.log('Skeletons encontrados:', { chapterSkeleton, exerciseSkeleton });

            if (chapterSelect && exerciseSelect && chapterSkeleton && exerciseSkeleton) {
                chapterSelect.style.display = 'none';
                exerciseSelect.style.display = 'none';
                chapterSkeleton.style.display = 'block';
                exerciseSkeleton.style.display = 'block';
                console.log('Skeletons mostrados');
            }
            

            // Guardar el shader
            console.log('Guardando shader...');
            const response = await fetch('/api/save-shader', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    content: shaderCode,
                    path: filePath,
                    isNew: true
                })
            });

            const result = await response.json();
            if (!result.success) {
                throw new Error(result.error || 'Error al guardar el shader');
            }

            // Actualizar la estructura y los selectores
            try {
                await this.loadShaderStructure();
                
                // Actualizar los selectores con los nuevos valores
                this.currentChapter = finalChapterId;
                this.currentExercise = finalExerciseId;
                
                if (chapterSelect) chapterSelect.value = finalChapterId;
                this.updateExerciseSelect();
                if (exerciseSelect) exerciseSelect.value = finalExerciseId;

                // Establecer el shader actual
                this.currentShader = {
                    fragment: shaderCode,
                    uniforms: {
                        u_resolution: { value: new THREE.Vector2() },
                        u_mouse: { value: new THREE.Vector2() },
                        u_time: { value: 0 }
                    }
                };

                // Actualizar el editor y preview
                this.updateEditor(shaderCode);
                this.onShaderChange(shaderCode);

                // Actualizar caché y estado
                const cacheKey = `${finalChapterId}-${finalExerciseId}`;
                this.shaderCache.set(cacheKey, this.currentShader);
                this.hasChanges = false;
                this.updateSaveButtonVisibility();
                this.updateURLParams();

                // Mostrar selectores y ocultar skeletons al final
                if (chapterSelect && exerciseSelect && chapterSkeleton && exerciseSkeleton) {
                    chapterSelect.style.display = 'block';
                    exerciseSelect.style.display = 'block';
                    chapterSkeleton.style.display = 'none';
                    exerciseSkeleton.style.display = 'none';
                }

            } catch (error) {
                console.error('Error actualizando la estructura:', error);
                // Asegurar que los selectores sean visibles en caso de error
                if (chapterSelect && exerciseSelect && chapterSkeleton && exerciseSkeleton) {
                    chapterSelect.style.display = 'block';
                    exerciseSelect.style.display = 'block';
                    chapterSkeleton.style.display = 'none';
                    exerciseSkeleton.style.display = 'none';
                }
                throw error;
            }

        } catch (error) {
            console.error('Error en saveNewShader:', error);
            alert('Error al guardar el shader: ' + error.message);
        }
    }
} 