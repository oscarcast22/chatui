<script lang="ts">
    import { onMount } from 'svelte';
    import { writable } from 'svelte/store';

    const endpoint = 'https://worker-ai-test.oscar-cm.workers.dev/notes';

    interface Note {
        id: string;
        campus: string;
        nombre: string;
        contenido: string;
    }

    const notes = writable<Note[]>([]);

    // Variables para la nueva nota
    let campus = "";
    let nombre = "";
    let contenido = "";

    // Variables para editar notas
    let isEditing = false;
    let editingId: string | null = null;

    const responseMessage = writable("");
    const responseUpdate = writable("");

    // Función para enviar la nota al backend (Agregar)
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
                body: JSON.stringify({ campus, nombre, contenido }),
            });

            if (response.ok) {
                const message = isEditing
                    ? "Nota actualizada con éxito."
                    : "Nota agregada con éxito.";
                responseMessage.set(message);
            } else {
                const errorText = await response.text();
                responseMessage.set(`Error: ${errorText}`);
            }
        } catch (error) {
            responseMessage.set("Error al conectar con el servidor");
        }

        // Reinicia los valores después de guardar
        fetchNotes();
        campus = "";
        nombre = "";
        contenido = "";
        isEditing = false;
        editingId = null;
    }

    // Función para cargar las notas desde el backend
    async function fetchNotes() {
        try {
            const response = await fetch(endpoint);
            if (response.ok) {
                const data = await response.json();
                notes.set(data); // Actualiza las notas con los datos del servidor
            } else {
                responseUpdate.set("Error al obtener las notas.");
            }
        } catch (error) {
            responseUpdate.set("Error al conectar con el servidor.");
        }
    }

    // Función para eliminar una nota
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

    // Función para cargar datos de una nota para edición
    function editNote(note: Note) {
        campus = note.campus;
        nombre = note.nombre;
        contenido = note.contenido;
        editingId = note.id;
        isEditing = true;
    }

    onMount(() => {
        fetchNotes();
    });
</script>

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
        placeholder="Nombre de la Nota"
        bind:value={nombre}
    />
    <textarea
        class="input-field"
        placeholder="Contenido de la Nota"
        bind:value={contenido}
    ></textarea>
    <button class="submit-button" on:click={submitNote}>
        {isEditing ? "Guardar Cambios" : "Enviar Nota"}
    </button>
    <p>{$responseMessage}</p>
</div>

<div class="notes-section">
    <h2>Lista de Notas</h2>
    {#if $responseUpdate}
        <p>{$responseUpdate}</p>
    {/if}

    <ul>
        {#each $notes as note}
            <li class="note-item">
                <span><strong>Campus:</strong> {note.campus}</span>
                <span><strong>Nombre:</strong> {note.nombre}</span>
                <span><strong>Contenido:</strong> <pre>{note.contenido}</pre></span>
                <button class="edit-button" on:click={() => editNote(note)}>Editar</button>
                <button class="delete-button" on:click={() => deleteNote(note.id)}>Eliminar</button>
            </li>
        {/each}
    </ul>
</div>


<style>
    .note-section {
        max-width: 600px;
        margin: auto;
        padding: 1rem;
        background-color: #f5f5f5;
        border-radius: 8px;
    }
    .input-field, .submit-button {
        display: block;
        width: 100%;
        margin-bottom: 1rem;
    }

    .notes-section {
        max-width: 600px;
        margin: auto;
        padding: 1rem;
        background-color: #f5f5f5;
        border-radius: 8px;
    }
    .note-item {
        display: flex;
        flex-direction: column;
        padding: 0.5rem 0;
        border-bottom: 1px solid #ccc;
    }
    .note-item span {
        margin: 0.2rem 0;
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
</style>
