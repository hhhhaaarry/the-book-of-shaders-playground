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

        // Configurar el modal de guardar nuevo shader
        console.log('Configurando modal de guardar nuevo shader...');
        const saveNewButton = document.getElementById('save-new-shader-btn');
        const modal = document.getElementById('save-modal');
        const saveModalBtn = document.getElementById('save-modal-btn');
        const cancelModalBtn = document.getElementById('cancel-modal-btn');
        const chapterInput = document.getElementById('chapter-input');
        const exerciseInput = document.getElementById('exercise-input');
        const newChapterInput = document.getElementById('new-chapter-input');
        const newExerciseInput = document.getElementById('new-exercise-input');

        console.log('Elementos del modal:', {
            saveNewButton: saveNewButton ? 'encontrado' : 'no encontrado',
            modal: modal ? 'encontrado' : 'no encontrado',
            saveModalBtn: saveModalBtn ? 'encontrado' : 'no encontrado',
            cancelModalBtn: cancelModalBtn ? 'encontrado' : 'no encontrado',
            chapterInput: chapterInput ? 'encontrado' : 'no encontrado',
            exerciseInput: exerciseInput ? 'encontrado' : 'no encontrado',
            newChapterInput: newChapterInput ? 'encontrado' : 'no encontrado',
            newExerciseInput: newExerciseInput ? 'encontrado' : 'no encontrado'
        });

        if (saveNewButton) {
            console.log('Botón de guardar nuevo shader encontrado, añadiendo evento click');
            saveNewButton.onclick = () => {
                console.log('Click en botón guardar nuevo shader detectado');
                this.showSaveModal();
            };
        } else {
            console.error('No se encontró el botón de guardar nuevo shader');
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
        console.log('Inicializando ShaderLoader...');
        
        // Cargar la estructura de shaders primero
        await this.loadShaderStructure();
        
        // Luego configurar la UI
        this.setupUI();
        
        // Reinicializar los elementos del modal
        console.log('Reinicializando elementos del modal...');
        this.modal = document.getElementById('save-modal');
        this.chapterInput = document.getElementById('chapter-input');
        this.exerciseInput = document.getElementById('exercise-input');
        this.newChapterInput = document.getElementById('new-chapter-input');
        this.newExerciseInput = document.getElementById('new-exercise-input');
        const saveNewButton = document.getElementById('save-new-shader-btn');
        const saveModalBtn = document.getElementById('save-modal-btn');
        const cancelModalBtn = document.getElementById('cancel-modal-btn');

        console.log('Elementos del modal reinicializados:', {
            modal: this.modal ? 'encontrado' : 'no encontrado',
            chapterInput: this.chapterInput ? 'encontrado' : 'no encontrado',
            exerciseInput: this.exerciseInput ? 'encontrado' : 'no encontrado',
            newChapterInput: this.newChapterInput ? 'encontrado' : 'no encontrado',
            newExerciseInput: this.newExerciseInput ? 'encontrado' : 'no encontrado',
            saveNewButton: saveNewButton ? 'encontrado' : 'no encontrado',
            saveModalBtn: saveModalBtn ? 'encontrado' : 'no encontrado',
            cancelModalBtn: cancelModalBtn ? 'encontrado' : 'no encontrado'
        });

        if (saveNewButton) {
            console.log('Reconfigurando botón de guardar nuevo shader');
            saveNewButton.onclick = () => {
                console.log('Click en botón guardar nuevo shader detectado');
                this.showSaveModal();
            };
        }

        if (cancelModalBtn) {
            console.log('Reconfigurando botón de cancelar modal');
            cancelModalBtn.onclick = () => {
                console.log('Click en botón cancelar modal detectado');
                this.hideModal();
            };
        }

        if (saveModalBtn) {
            console.log('Reconfigurando botón de guardar modal');
            saveModalBtn.onclick = () => {
                console.log('Click en botón guardar modal detectado');
                this.saveNewShader();
            };
        }

        if (this.chapterInput) {
            console.log('Reconfigurando input de capítulo');
            this.chapterInput.onchange = (e) => {
                console.log('Cambio en input de capítulo detectado:', e.target.value);
                this.newChapterInput.classList.toggle('hidden', e.target.value !== 'new');
                this.updateExerciseInputOptions(e.target.value);
            };
        }

        if (this.exerciseInput) {
            console.log('Reconfigurando input de ejercicio');
            this.exerciseInput.onchange = (e) => {
                console.log('Cambio en input de ejercicio detectado:', e.target.value);
                this.newExerciseInput.classList.toggle('hidden', e.target.value !== 'new');
            };
        }
        
        console.log('ShaderLoader inicializado correctamente');
    }

    async loadShaderStructure() {
        try {
            console.log('Cargando estructura de shaders...');
            
            // Mostrar skeleton loaders y ocultar selectores
            const chapterSelect = document.getElementById('chapter-select');
            const exerciseSelect = document.getElementById('exercise-select');
            const chapterSkeleton = chapterSelect.nextElementSibling;
            const exerciseSkeleton = exerciseSelect.nextElementSibling;
            
            chapterSelect.style.display = 'none';
            exerciseSelect.style.display = 'none';
            chapterSkeleton.style.display = 'block';
            exerciseSkeleton.style.display = 'block';
            
            // Inicializar la estructura de shaders
            this.chapters = new Map();
            
            // Obtener la lista de capítulos
            console.log('Solicitando estructura de shaders al servidor...');
            const response = await fetch('/api/list-shaders');
            console.log('Respuesta recibida:', response.status);
            const result = await response.json();
            console.log('Resultado:', result);
            
            if (!result.success) {
                throw new Error(result.error || 'Error al cargar la estructura de shaders');
            }
            
            // Procesar la estructura de shaders
            console.log('Procesando estructura de shaders...');
            for (const [chapterId, chapterData] of Object.entries(result.structure)) {
                console.log(`Procesando capítulo ${chapterId}:`, chapterData);
                this.chapters.set(chapterId, {
                    name: chapterData.name,
                    exercises: chapterData.exercises
                });
            }
            
            console.log('Estructura de shaders cargada:', this.chapters);
            
            // Actualizar los selectores
            console.log('Actualizando selectores...');
            this.updateChapterSelect();
            this.updateExerciseSelect();
            
            // Ocultar skeleton loaders y mostrar selectores
            chapterSelect.style.display = 'block';
            exerciseSelect.style.display = 'block';
            chapterSkeleton.style.display = 'none';
            exerciseSkeleton.style.display = 'none';
            
            // Asegurarnos de que los selectores sean interactivos en caso de error
            chapterSelect.classList.remove('loading');
            exerciseSelect.classList.remove('loading');
            
            // Cargar estado desde URL si existe
            const params = new URLSearchParams(window.location.search);
            const chapter = params.get('chapter');
            const exercise = params.get('exercise');
            
            if (chapter && exercise) {
                this.currentChapter = chapter;
                this.updateExerciseSelect();
                this.currentExercise = exercise;
                
                // Actualizar los selectores
                if (chapterSelect) chapterSelect.value = chapter;
                if (exerciseSelect) exerciseSelect.value = exercise;
                
                await this.loadShader();
            }
        } catch (error) {
            console.error('Error cargando la estructura de shaders:', error);
            
            // Ocultar skeleton loaders y mostrar selectores en caso de error
            const chapterSelect = document.getElementById('chapter-select');
            const exerciseSelect = document.getElementById('exercise-select');
            const chapterSkeleton = chapterSelect.nextElementSibling;
            const exerciseSkeleton = exerciseSelect.nextElementSibling;
            
            chapterSelect.style.display = 'block';
            exerciseSelect.style.display = 'block';
            chapterSkeleton.style.display = 'none';
            exerciseSkeleton.style.display = 'none';
            
            throw error;
        }
    }

    updateChapterSelect() {
        const chapterSelect = document.getElementById('chapter-select');
        console.log('Elemento chapter-select:', chapterSelect ? 'encontrado' : 'no encontrado');
        if (!chapterSelect) return;
        
        console.log('Capítulos disponibles:', Array.from(this.chapters.entries()));
        
        chapterSelect.innerHTML = `
            <option value="">Selecciona un capítulo...</option>
            ${Array.from(this.chapters.entries()).map(([id, chapter]) => `
                <option value="${id}">${chapter.name}</option>
            `).join('')}
        `;
        
        // Mantener la selección actual si existe
        if (this.currentChapter && this.chapters.has(this.currentChapter)) {
            chapterSelect.value = this.currentChapter;
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
        console.log('Poblando selector de capítulos...');
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

        exerciseSelect.addEventListener('change', async (e) => {
            console.log('Ejercicio seleccionado:', e.target.value);
            this.currentExercise = e.target.value;
            await this.loadShader();
            this.updateURLParams();
            this.updateSaveButtonVisibility();
        });

        // Mantener la selección actual si existe
        if (this.currentChapter && this.chapters.has(this.currentChapter)) {
            chapterSelect.value = this.currentChapter;
            this.updateExerciseSelect();
            if (this.currentExercise) {
                exerciseSelect.value = this.currentExercise;
            }
        }
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
        console.log('Elemento exercise-select:', exerciseSelect ? 'encontrado' : 'no encontrado');
        const chapter = this.chapters.get(this.currentChapter);
        console.log('Capítulo actual:', this.currentChapter);
        console.log('Capítulo encontrado:', chapter ? 'sí' : 'no');

        if (!chapter) {
            exerciseSelect.innerHTML = '<option value="">Selecciona un ejercicio...</option>';
            return;
        }

        console.log('Ejercicios disponibles:', Object.entries(chapter.exercises));

        exerciseSelect.innerHTML = `
            <option value="">Selecciona un ejercicio...</option>
            ${Object.entries(chapter.exercises).map(([id, exercise]) => `
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
            this.saveButtonContainer.style.display = 'none';
            return;
        }

        // Si hay un ejercicio seleccionado, mostrar el botón
        this.saveButtonContainer.style.display = 'block';
      
        
        // El botón está deshabilitado si no hay cambios
        this.saveButton.disabled = !this.hasChanges;
     
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

    showSaveModal() {
        console.log('Mostrando modal de guardar nuevo shader');
        if (!this.modal) {
            console.error('Modal no encontrado');
            return;
        }
        
        // Actualizar la lista de capítulos
        if (!this.chapterInput) {
            console.error('Input de capítulo no encontrado');
            return;
        }
        
        console.log('Actualizando lista de capítulos');
        this.chapterInput.innerHTML = `
            <option value="">Seleccionar capítulo existente...</option>
            ${Array.from(this.chapters.entries()).map(([id, chapter]) => `
                <option value="${id}">${chapter.name}</option>
            `).join('')}
            <option value="new">Crear nuevo capítulo</option>
        `;

        this.modal.classList.add('show');
        console.log('Modal mostrado');
    }

    hideModal() {
        console.log('Ocultando modal');
        if (!this.modal) {
            console.error('Modal no encontrado');
            return;
        }
        
        this.modal.classList.remove('show');
        console.log('Clase show removida del modal');
        
        // Limpiar inputs
        if (this.newChapterInput) {
            this.newChapterInput.value = '';
            this.newChapterInput.classList.add('hidden');
            console.log('Input de nuevo capítulo limpiado y ocultado');
        }
        
        if (this.newExerciseInput) {
            this.newExerciseInput.value = '';
            this.newExerciseInput.classList.add('hidden');
            console.log('Input de nuevo ejercicio limpiado y ocultado');
        }
        
        if (this.chapterInput) {
            this.chapterInput.value = '';
            console.log('Input de capítulo limpiado');
        }
        
        if (this.exerciseInput) {
            this.exerciseInput.value = '';
            console.log('Input de ejercicio limpiado');
        }
        
        console.log('Modal ocultado correctamente');
    }

    updateExerciseInputOptions(chapterId) {
        console.log('Actualizando opciones de ejercicio para capítulo:', chapterId);
        
        if (!this.exerciseInput) {
            console.error('Input de ejercicio no encontrado');
            return;
        }
        
        if (!chapterId || chapterId === 'new') {
            console.log('Capítulo no seleccionado o nuevo, mostrando opciones por defecto');
            this.exerciseInput.innerHTML = `
                <option value="">Seleccionar ejercicio...</option>
                <option value="new">Crear nuevo ejercicio</option>
            `;
            return;
        }

        const chapter = this.chapters.get(chapterId);
        if (!chapter) {
            console.error('Capítulo no encontrado:', chapterId);
            return;
        }

        console.log('Capítulo encontrado, actualizando opciones de ejercicio');
        this.exerciseInput.innerHTML = `
            <option value="">Seleccionar ejercicio existente...</option>
            ${Object.entries(chapter.exercises).map(([id, exercise]) => `
                <option value="${id}">${exercise.name}</option>
            `).join('')}
            <option value="new">Crear nuevo ejercicio</option>
        `;
    }

    async saveNewShader() {
        console.log('Guardando nuevo shader...');
        
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
        
        // Validar datos
        if (chapterId === 'new' && !newChapterName) {
            console.error('Nombre de capítulo no proporcionado');
            alert('Por favor, proporciona un nombre para el nuevo capítulo');
            return;
        }
        
        if (exerciseId === 'new' && !newExerciseName) {
            console.error('Nombre de ejercicio no proporcionado');
            alert('Por favor, proporciona un nombre para el nuevo ejercicio');
            return;
        }
        
        // Determinar el ID del capítulo y ejercicio
        const finalChapterId = chapterId === 'new' ? newChapterName : chapterId;
        const finalExerciseId = exerciseId === 'new' ? newExerciseName : exerciseId;
        
        if (!finalChapterId || !finalExerciseId) {
            console.error('Capítulo o ejercicio no seleccionados');
            alert('Por favor, selecciona o crea un capítulo y ejercicio');
            return;
        }

        const shaderCode = this.editor.state.doc.toString();
        const filePath = `src/shaders/${finalChapterId}/${finalExerciseId}/fragment.glsl`;
        
        console.log('Guardando shader en:', filePath);

        try {
            console.log('Enviando solicitud al servidor');
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

            console.log('Respuesta recibida:', response.status);
            const result = await response.json();
            console.log('Resultado:', result);
            
            if (!result.success) {
                throw new Error(result.error || 'Error al guardar el shader');
            }

            // Actualizar la estructura de shaders
            console.log('Actualizando estructura de shaders');
            this.hideModal(); // Ocultar el modal inmediatamente
            
            // Actualizar los selectores
            console.log('Actualizando selectores');
            this.currentChapter = finalChapterId;
            this.currentExercise = finalExerciseId;
            
            // Actualizar los selectores principales
            const chapterSelect = document.getElementById('chapter-select');
            const exerciseSelect = document.getElementById('exercise-select');
            if (chapterSelect) chapterSelect.value = finalChapterId;
            this.updateExerciseSelect();
            if (exerciseSelect) exerciseSelect.value = finalExerciseId;

            // Actualizar URL y estado
            console.log('Actualizando URL y estado');
            this.updateURLParams();
            this.updateSaveButtonVisibility();
            
            // Cargar el shader recién creado
            console.log('Cargando shader recién creado');
            await this.loadShader();
            
            // Recargar la estructura de shaders en segundo plano
            this.loadShaderStructure().catch(error => {
                console.error('Error recargando la estructura de shaders:', error);
            });
            
            console.log('Shader guardado correctamente');
        } catch (error) {
            console.error('Error guardando shader:', error);
            alert('Error al guardar el shader: ' + error.message);
        }
    }
} 