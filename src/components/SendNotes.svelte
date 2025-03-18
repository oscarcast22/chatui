<script lang="ts">
    import { onMount } from 'svelte';
    import { writable, derived } from 'svelte/store';

    // const endpoint = 'https://worker-ai-test.oscar-cm.workers.dev/notes';

    const endpoint = 'https://lobai-worker.diseno-web2.workers.dev/notes';

    interface Note {
        id: string;
        campus: string;
        ciudad: string | null;
        nombre: string;
        contenido: string;
    }


    const filterCampus = writable('');
    const filterNombre = writable('');
    const filterId = writable('');
    const filterCiudad = writable('');
    const notes = writable<Note[]>([]);

    let campus = "";
    let ciudad = "";
    let nombre = "";
    let contenido = "";
    let isEditing = false;
    let editingId: string | null = null;

    const responseMessage = writable("");
    const responseUpdate = writable("");

    const filteredNotes = derived(
        [notes, filterCampus, filterNombre, filterId, filterCiudad],
        ([$notes, $filterCampus, $filterNombre, $filterId, $filterCiudad]) => {
            if (!$notes) return [];

            return $notes.filter(note => {
                if (!note) return false;

                const matchCampus = !$filterCampus || note.campus.toLowerCase().includes($filterCampus.toLowerCase());
                const matchNombre = !$filterNombre || note.nombre.toLowerCase().includes($filterNombre.toLowerCase());
                const matchId = !$filterId || String(note.id).toLowerCase().includes($filterId.toLowerCase());
                const matchCiudad = !$filterCiudad || (note.ciudad && note.ciudad.toLowerCase().includes($filterCiudad.toLowerCase())); // <- Nuevo filtro

                return matchCampus && matchNombre && matchId && matchCiudad;
            });
        }
    );

    function clearFilters() {
        filterCampus.set('');
        filterNombre.set('');
        filterId.set('');
        filterCiudad.set('');
    }

    async function submitNote() {
        if (!campus || !nombre || !contenido) {
            responseMessage.set("Por favor llena todos los campos.");
            return;
        }

        try {
            const method = isEditing ? 'PUT' : 'POST';
            const url = isEditing ? `${endpoint}/${editingId}` : endpoint;

            const response = await fetch(url, {
                method,
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ campus, ciudad, nombre, contenido }),
            });

            if (response.ok) {
                const message = isEditing
                    ? "Nota actualizada con éxito."
                    : "Nota agregada con éxito.";
                responseMessage.set(message);
                clearFilters();
            } else {
                const errorText = await response.text();
                responseMessage.set(`Error: ${errorText}`);
            }
        } catch (error) {
            responseMessage.set("Error al conectar con el servidor");
        }

        fetchNotes();
        campus = "";
        ciudad = "";
        nombre = "";
        contenido = "";
        isEditing = false;
        editingId = null;
    }

    async function fetchNotes() {
        try {
            const response = await fetch(endpoint);
            if (response.ok) {
                const data = await response.json();
                notes.set(data);
            } else {
                responseUpdate.set("Error al obtener las notas.");
            }
        } catch (error) {
            responseUpdate.set("Error al conectar con el servidor.");
        }
    }

    async function deleteNote(id: string) {
        try {
            const response = await fetch(`${endpoint}/${id}`, {
                method: 'DELETE',
            });
            if (response.ok) {
                fetchNotes();
                responseUpdate.set(`Nota con ID ${id} eliminada.`);
            } else {
                responseUpdate.set("Error al eliminar la nota.");
            }
        } catch (error) {
            responseUpdate.set("Error al conectar con el servidor.");
        }
    }

    function editNote(note: Note) {
        campus = note.campus;
        ciudad = note.ciudad ? note.ciudad : "";
        nombre = note.nombre;
        contenido = note.contenido;
        editingId = note.id;
        isEditing = true;
    }

    function cancelEdit() {
        isEditing = false;
        campus = "";
        ciudad = "";
        nombre = "";
        contenido = "";
        editingId = null;
    }

    onMount(() => {
        fetchNotes();
    });
</script>

<section class="container">
    <div class="note-section">
        <h2>{isEditing ? "Editar Nota" : "Agregar una Nota"}</h2>
        <input
            class="input-field"
            type="text"
            placeholder="Campus"
            bind:value={campus}
        />
        <input
            class="input-field"
            type="text"
            placeholder="Ciudad"
            bind:value={ciudad}
        />
        <input
            class="input-field"
            type="text"
            placeholder="Nombre de la Nota"
            bind:value={nombre}
        />
        <textarea
            class="input-field"
            placeholder="Contenido de la Nota"
            bind:value={contenido}
        ></textarea>
        <div class="submit-buttons">
            <button class="submit-button" on:click={submitNote}>
                {isEditing ? "Guardar Cambios" : "Enviar Nota"}
            </button>
            {#if isEditing}
                <button class="cancel-button" on:click={cancelEdit}>
                    Cancelar Edición
                </button>
            {/if}
        </div>
        {#if $responseMessage}
            <p>{$responseMessage}</p>
        {/if}
    </div>
    
    <div class="notes-section">
        <h2>Lista de Notas</h2>
        
        <div class="filters">
            <div class="filter-group">
                <input
                    type="text"
                    class="filter-input"
                    placeholder="Filtrar por campus..."
                    bind:value={$filterCampus}
                />
                <input 
                    type="text"
                    class="filter-input"
                    placeholder="Filtrar por ciudad..."
                    bind:value={$filterCiudad}
                />
                <input
                    type="text"
                    class="filter-input"
                    placeholder="Filtrar por nombre..."
                    bind:value={$filterNombre}
                />
                <input 
                    type="text"
                    class="filter-input"
                    placeholder="Filtrar por ID..."
                    bind:value={$filterId}
                />
                {#if $filterCampus || $filterNombre || $filterId || $filterCiudad}
                    <button class="clear-button" on:click={clearFilters}>
                        Limpiar filtros
                    </button>
                {/if}
            </div>
            {#if $filteredNotes.length === 0}
                <p class="no-results">No se encontraron notas con los filtros actuales</p>
            {/if}
        </div>

        {#if $responseUpdate}
            <p>{$responseUpdate}</p>
        {/if}
    
        <ul class="note-list">
            {#each $filteredNotes as note}
                <li class="note-item">
                    <span><strong>Campus:</strong> {note.campus}</span>
                    <span><strong>Nombre:</strong> {note.nombre}</span>
                    {#if note.ciudad}
                        <span><strong>Ciudad:</strong> {note.ciudad}</span>
                    {/if}
                    <span>
                        <strong>Contenido:</strong>
                        <pre>{note.contenido}</pre>
                    </span>
                    <div class="buttons">
                        <button class="edit-button" on:click={() => editNote(note)}>Editar</button>
                        <button class="delete-button" on:click={() => deleteNote(note.id)}>Eliminar</button>
                    </div>
                    <p class="note-id">ID: {note.id}</p>
                </li>
            {/each}
        </ul>
    </div>
</section>

<style>
    .container {
        display: flex;
        flex-direction: column;
        align-items: center;
        padding: 1rem;
    }

    .note-section {
        width: 100%;
        height: 70vh;
        margin: auto;
        padding: 2rem;
        background-color: #f5f5f5;
        border-radius: 8px;
        display: flex;
        flex-direction: column;
    }

    .filters {
        margin-bottom: 1rem;
    }

    .filter-group {
        display: flex;
        gap: 1rem;
        align-items: center;
        margin-bottom: 0.5rem;
    }

    .filter-input {
        flex: 1;
        padding: 0.5rem;
        border: 1px solid #ddd;
        border-radius: 4px;
        font-size: 0.9rem;
    }

    .clear-button {
        padding: 0.5rem 1rem;
        background-color: #f0f0f0;
        border: 1px solid #ddd;
        border-radius: 4px;
        cursor: pointer;
        font-size: 0.9rem;
    }

    .clear-button:hover {
        background-color: #e0e0e0;
    }

    .no-results {
        color: #666;
        font-style: italic;
        margin-top: 0.5rem;
    }

    textarea {
        height: auto;
        flex-grow: 1;
        resize: none;
    }

    .submit-buttons {
        display: flex;
        gap: 1rem;
        margin-top: 1rem;

        button {
            cursor: pointer;
            width: 150px;
            text-align: center;
            padding: 5px;
            border-radius: 5px;
        }
    }

    .submit-button {
        background-color: #ccc;

        &:hover {
            background-color: #aaa;
            transition: background-color 0.3s ease;
        }
    }

    .cancel-button {
        background-color: #df2424;
        color: white;

        &:hover {
            background-color: #a00f0f;
            transition: background-color 0.3s ease;
        }
    }

    .input-field {
        display: block;
        margin-bottom: 1rem;
        border-radius: 5px;
        border: none;
        padding: 5px;
    }

    .note-list {
        list-style: none;
        display: grid;
        grid-template-columns: repeat(2, minmax(0, 1fr));
        gap: 1rem;
        padding: 0;
    }

    .notes-section {
        width: 100%;
        margin: auto;
        padding: 3rem;
        background-color: #f5f5f5;
        border-radius: 8px;
    }

    pre {
        white-space: pre-wrap;
        font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, 'Open Sans', 'Helvetica Neue', sans-serif;
        background-color: #fcfcfc;
        padding: 1rem;
        border-radius: 15px;
        max-height: 700px;
        overflow-y: scroll;
    }

    .note-item {
        display: flex;
        flex-direction: column;
        padding: 1rem;
        border: 1px solid #ccc;
        border-radius: 15px;
        position: relative;
    }

    .note-item span {
        margin: 0.2rem 0;
    }

    .buttons {
        display: flex;
        gap: 1rem;
    }

    .delete-button, .edit-button {
        cursor: pointer;
        border: none;
        background: none;
        font-weight: bold;
        align-self: flex-start;
        margin-top: 0.5rem;
    }

    .delete-button {
        color: red;
    }

    .edit-button {
        color: blue;
    }

    .note-id {
        position: absolute;
        top: 0;
        right: 0;
        margin: 1rem;
        font-weight: 500;
    }

    @media screen and (max-width: 1080px) {
        .note-list {
            grid-template-columns: 1fr;
        }
    }
</style>