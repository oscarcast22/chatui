<script lang="ts">
    import { onMount } from 'svelte';
    import SvelteMarkdown from 'svelte-markdown';
  
    let sessions: any[] = [];
    let page = 1;
    const limit = 10;
    let loading = false;
    let error: string | null = null;
  
    async function loadSessions() {
      loading = true;
      error = null;
      try {
        // Ajusta la URL si es necesario (por ejemplo, incluir dominio o base path)
        const response = await fetch(`https://lobai-worker.diseno-web2.workers.dev/conversations?page=${page}&limit=${limit}`);
        if (!response.ok) {
          throw new Error(`Error: ${response.status}`);
        }
        sessions = await response.json();
      } catch (err: any) {
        error = err.message;
        sessions = [];
      } finally {
        loading = false;
      }
    }
  
    function nextPage() {
      page += 1;
      loadSessions();
    }
  
    function prevPage() {
      if (page > 1) {
        page -= 1;
        loadSessions();
      }
    }
  
    // Cargamos las sesiones al montar el componente.
    onMount(loadSessions);
  </script>
  
  <div>
    <h2>Conversaciones</h2>
    
    {#if loading}
      <p>Cargando...</p>
    {:else if error}
      <p style="color: red;">{error}</p>
    {:else if sessions.length === 0}
      <p>No hay conversaciones.</p>
    {:else}
    <div class="sessions-grid">
        {#each sessions as session}
        <div class="session">
          <h3>Sesión: {session.sessionId}</h3>
          <p><strong>Origen:</strong> {session.origin}</p>
          <p><strong>Actualizado:</strong> {new Date(session.updated_at).toLocaleString()}</p>
          {#if session.messages && session.messages.length > 0}
            <ul class="messages">
              {#each session.messages as msg}
                <li class="message {msg.role === 'user' ? 'user-message' : 'ai-message'}">
                  <strong>{msg.role === 'user' ? 'Usuario' : 'LobAI'}:</strong>
                  {#if msg.role === 'assistant'}
                  <SvelteMarkdown source={msg.content} />
              {:else}
                  {msg.content}
              {/if}
                  <small>({new Date(msg.timestamp).toLocaleString()})</small>
                </li>
              {/each}
            </ul>
          {/if}
        </div>
      {/each}
    </div>

    {/if}
  
    <div class="pagination">
      <button on:click={prevPage} disabled={page === 1}>Anterior</button>
      <span>Página {page}</span>
      <button on:click={nextPage} disabled={sessions.length < limit}>Siguiente</button>
    </div>
  </div>

  <style>
    .session {
      padding: 1rem;
      border: 1px solid #ddd;
      border-radius: 4px;
      margin-bottom: 1rem;
    }
    .session h3 {
      margin: 0 0 0.5rem 0;
    }
    .pagination {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-top: 1rem;
    }
    button:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }

    .messages {
      list-style: none;
      padding: 0;
      height: 600px;
      overflow: auto;
    }

    .message {
      padding: 0.5rem;
      margin: 0.5rem 0;
      border-radius: 4px;
    }

    .user-message {
        background-color: #000000;
        color: white;
    }

    .ai-message {
        background-color: #f3f3f3;
    }

    .sessions-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(420px, 1fr));
      gap: 1rem;
    }

  </style>