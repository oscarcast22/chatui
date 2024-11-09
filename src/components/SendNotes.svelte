<script lang="ts">
    import { onMount, afterUpdate } from 'svelte';
    import { writable } from 'svelte/store';


    const endpoint = 'https://worker-ai-test.oscar-cm.workers.dev/notes';

    interface Note {
        id: string;
        text: string;
    }

    const notes = writable<Note[]>([]);


    // Variable para la nota del usuario y para los mensajes de éxito/error
    let noteText = "";
    const responseMessage = writable("");
    const responseUpdate = writable("");

    // Función para enviar la nota al backend
    async function submitNote() {
        if (!noteText) {
            responseMessage.set("Por favor ingresa una nota.");
            return;
        }

        try {
            const response = await fetch(endpoint, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ text: noteText })
            });

            if (response.ok) {
                const data = await response.json();
                responseMessage.set(`Nota agregada con éxito. ID: ${data.id}`);
            } else {
                const errorText = await response.text();
                responseMessage.set(`Error: ${errorText}`);
            }
        } catch (error) {
            responseMessage.set("Error al conectar con el servidor");
        }
        
        // Limpia la nota después de enviarla
        fetchNotes();
        noteText = "";
    }

    async function fetchNotes() {
        try {
            const response = await fetch(`${endpoint}`);
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

    async function deleteNote(id: number | string) {
        try {
            const response = await fetch(`${endpoint}/${id}`, {
                method: 'DELETE'
            });
            console.log(response.status)
            if (response.ok) {
                // Si la nota se eliminó con éxito, actualiza la lista
                fetchNotes();
                responseUpdate.set(`Nota con ID ${id} eliminada.`);
            } else {
                responseUpdate.set("Error al eliminar la nota.");
            }
        } catch (error) {
            responseUpdate.set("Error al conectar con el servidor.");
        }
    }

    onMount(() => {
        fetchNotes();
    });

</script>

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
        justify-content: space-between;
        padding: 0.5rem 0;
        border-bottom: 1px solid #ccc;
    }
    .delete-button {
        color: red;
        cursor: pointer;
        border: none;
        background: none;
        font-weight: bold;
    }
</style>

<div class="note-section">
    <h2>Agregar una Nota</h2>
    <textarea
        class="input-field"
        placeholder="Escribe tu nota aquí"
        bind:value={noteText}
    ></textarea>
    <button class="submit-button" on:click={submitNote}>Enviar Nota</button>
    
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
                <span>{note.id}</span>
                <span>{note.text}</span>
                <button class="delete-button" on:click={() => deleteNote(note.id)}>Eliminar</button>
            </li>
        {/each}
    </ul>
</div>
