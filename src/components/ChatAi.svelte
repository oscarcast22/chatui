<script>
	import autoAnimate from '@formkit/auto-animate';
    import { X, MessageCircle, Send } from "lucide-svelte";
	import { afterUpdate  } from "svelte";
  
    let isOpen = false;
    let inputMessage = "";
	let chatBody;
    let messages = [
      { id: 1, text: "¡Hola! ¿En qué puedo ayudarte hoy?", sender: "bot" },
    ];

	function handleInputChange() {
		const textarea = document.querySelector("textarea");
		if (textarea) {
			const offset = textarea.offsetHeight - textarea.clientHeight;
			textarea.addEventListener("input", () => {
				textarea.style.height = "2.7rem";
				textarea.style.height = textarea.scrollHeight + offset + 'px';
			});
		}
	}

    const handleSendMessage = () => {
      if (inputMessage.trim() !== "") {
        messages = [...messages, { id: messages.length + 1, text: inputMessage, sender: "user" }];
        inputMessage = "";
  
        // Resetear la altura del textarea
        const textarea = document.querySelector("textarea");
        if (textarea) {
          textarea.style.height = "2.7rem";
        }
  
        // Simular respuesta automática del bot
        setTimeout(() => {
          messages = [...messages, { id: messages.length + 1, text: "Gracias por tu mensaje. Estoy procesando tu consulta.", sender: "bot" }];
        }, 1000);
      }
    };

	afterUpdate(() => {
      if (isOpen) {
        handleInputChange();
      }

	  if (chatBody) {
        chatBody.scrollTop = chatBody.scrollHeight;
      }
    });
</script>
  
<div class="chat-container" use:autoAnimate>
    {#if isOpen}
		<div class="chat-box">
			<div class="chat-header">
			  <h3>Chat de Asistencia</h3>
			  <button on:click={() => isOpen = false}>
				<X size={20} />
			  </button>
			</div>
		
			<div class="chat-body" use:autoAnimate bind:this={chatBody}>
			  {#each messages as message}
				<div class="message {message.sender === 'user' ? 'message-user' : 'message-bot'}">
				  <div class="message-text {message.sender === 'user' ? 'message-text-user' : 'message-text-bot'}">
					{message.text}
				  </div>
				</div>
			  {/each}
			</div>
		
			<div class="chat-footer">
			  <form
				on:submit|preventDefault={handleSendMessage}
				class="textarea-container"
			  >
				<textarea
				  bind:value={inputMessage}
				  placeholder="Escribe tu mensaje..."
				></textarea>
				<button class="send-button" type="submit">
				  <Send size={20} />
				</button>
			  </form>
			</div>
		</div>
    {/if}
  
    <button class="chat-toggle" on:click={() => isOpen = !isOpen}>
      <MessageCircle size={24} />
    </button>
</div>

<style>
    .chat-container {
      position: fixed;
      bottom: 1rem;
      right: 1rem;
      z-index: 50;
    }
    
    .chat-box {
      background-color: white;
      border-radius: 0.5rem;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
      width: 20rem;
      overflow: hidden;
      position: absolute;
      bottom: 4rem;
      right: 0;
    }
  
    .chat-header {
      background-color: #0d6efd;
      color: white;
      padding: 1rem;
      display: flex;
      justify-content: space-between;
      align-items: center;

	  button {
		cursor: pointer;
	  }
    }
  
    .chat-body {
      height: 20rem;
      overflow-y: auto;
      padding: 1rem;
      background-color: #f1f1f1;
	  scroll-behavior: smooth;
    }
  
    .chat-footer {
      padding: 1rem;
      background-color: #f9f9f9;
    }
  
    .message {
      margin-bottom: 1rem;
      display: flex;
    }
  
    .message-bot {
      justify-content: start;
    }
  
    .message-user {
      justify-content: end;
    }
  
    .message-text {
      padding: 0.75rem;
      border-radius: 0.5rem;
      max-width: 70%;
    }
  
    .message-text-bot {
      background-color: #f1f1f1;
      color: #333;
      border-top-left-radius: 0;
    }
  
    .message-text-user {
      background-color: #0d6efd;
      color: white;
      border-top-right-radius: 0;
    }
  
    .textarea-container {
      display: flex;
      align-items: flex-end;
      gap: 0.5rem;
    }
  
    textarea {
      flex-grow: 1;
      padding: 0.5rem;
      border: 1px solid #ddd;
      border-radius: 0.25rem;
      resize: none;
      overflow: auto;
      height: 2.7rem;
      max-height: 5.4rem;
    }
  
    .send-button {
      background-color: #0d6efd;
      color: white;
      padding: 0.5rem;
      border-radius: 0.25rem;
      cursor: pointer;
    }
  
    .send-button:hover {
      background-color: #0b5ed7;
    }
  
    .chat-toggle {
      background-color: #0d6efd;
      color: white;
      border-radius: 50%;
      padding: 1rem;
      cursor: pointer;
      position: fixed;
      bottom: 1rem;
      right: 1rem;
    }
  
    .chat-toggle:hover {
      background-color: #0b5ed7;
    }

	/* Estilo para la barra de scroll (Chrome, Safari y Edge) */
	textarea::-webkit-scrollbar {
	  width: 4px; /* Ancho del scroll */
	}

	/* Estilo para el "track" de la barra (la parte por donde se mueve la barra) */
	textarea::-webkit-scrollbar-track {
	  background: #f1f1f1; /* Color de fondo de la barra */
	  border-radius: 10px;  /* Bordes redondeados */
	}

	/* Estilo para el "thumb" (la barra que se mueve) */
	textarea::-webkit-scrollbar-thumb {
	  background: #888; /* Color de la barra */
	  border-radius: 10px;  /* Bordes redondeados */
	  margin-right: 1px;
	}

	/* Estilo para la barra cuando está en "hover" (cuando pasas el mouse por encima) */
	textarea::-webkit-scrollbar-thumb:hover {
	  background: #555; /* Cambia el color al hacer hover */
	}
  </style>
  