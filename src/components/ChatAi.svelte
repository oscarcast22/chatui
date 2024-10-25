<script>
	import autoAnimate from '@formkit/auto-animate';
    import { X, MessageCircle, Send } from "lucide-svelte";
	import { afterUpdate } from "svelte";
	import { fly } from 'svelte/transition';
  
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
			
      	  	const textarea = document.querySelector("textarea");

      	  	if (textarea) {
      	  	  	textarea.style.height = "2.7rem";
      	  	}
		  
      	  	setTimeout(() => {
      	  	  	messages = [...messages, { id: messages.length + 1, text: "Gracias por tu mensaje. Estoy procesando tu consulta.", sender: "bot" }];
      	  	}, 1000);
      	}
    };

	function handleKeyDown(event) {
    	if (event.key === 'Enter' && !event.shiftKey) {
      		event.preventDefault();
      		handleSendMessage();
    	}
  	}

	afterUpdate(() => {
      	if (isOpen) {
        	handleInputChange();
      	}

	  	if (chatBody) {
        	chatBody.scrollTop = chatBody.scrollHeight;
      	}
    });
</script>
  
<div class="chat-container">
    {#if isOpen}
		<div class="chat-box" transition:fly={{ y: 200, opacity: 0, duration: 300 }}>
			<div class="chat-header">
				<h3>Lobo AI</h3>
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
						on:keydown={handleKeyDown}
				  		placeholder="Escribe tu mensaje..."
					></textarea>
					<button class="send-button" type="submit">
				  		<Send size={20} />
					</button>
				</form>
			</div>
		</div>
    {/if}
  
    <button class="chat-toggle" on:click={() => isOpen = !isOpen} use:autoAnimate={false}>
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
	    display: flex;
	    flex-direction: column;
	    background-color: white;
	    border-radius: 0.5rem;
	    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
	    width: 25rem;
	    height: 600px;
	    overflow: hidden;
	    position: absolute;
	    bottom: 4.5rem;
	    right: 0;
	}
  
    .chat-header {
      	background-color: var(--primary);
      	color: white;
      	padding: 1rem;
      	display: flex;
      	justify-content: space-between;
		height: 4rem;
		flex-shrink: 0;
		align-items: center;

	  	button {
			cursor: pointer;
	  	}
    }
  
    .chat-body {
		flex-grow: 1; /* Ocupa todo el espacio restante */
      	overflow-y: auto;
      	padding: 1rem;
      	background-color: #f1f1f1;
	  	scroll-behavior: smooth;
    }
  
    .chat-footer {
      	padding: 1rem;
      	background-color: #f9f9f9;
		flex-shrink: 0; /* Evita que el footer se reduzca */
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
      	background-color: var(--primary);
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
      	background-color: var(--primary);
      	color: white;
      	padding: 0.5rem;
      	border-radius: 0.25rem;
      	cursor: pointer;
    }
  
    .send-button:hover {
      	background-color: var(--primary-hover);
    }
  
    .chat-toggle {
      	background-color: var(--primary);
      	color: white;
      	border-radius: 50%;
      	padding: 1rem;
      	cursor: pointer;
	  	position: fixed;
      	bottom: 1rem;
      	right: 1rem;
    }
  
    .chat-toggle:hover {
      	background-color: var(--primary-hover);
    }

	textarea::-webkit-scrollbar {
	  	width: 4px;
	}

	textarea::-webkit-scrollbar-track {
	  	background: #f1f1f1;
	  	border-radius: 10px;
	}

	textarea::-webkit-scrollbar-thumb {
	  	background: #888;
	  	border-radius: 10px;
	  	margin-right: 1px;
	}

	textarea::-webkit-scrollbar-thumb:hover {
	  	background: #555;
	}

	.chat-body::-webkit-scrollbar {
	  	width: 6px;
	}

	.chat-body::-webkit-scrollbar-track {
	  	background: #f1f1f1;
	  	border-radius: 10px;
	}

	.chat-body::-webkit-scrollbar-thumb {
	  	background: #888;
	  	border-radius: 10px;
	  	margin-right: 1px;
	}

	.chat-body::-webkit-scrollbar-thumb:hover {
	  	background: #555;
	}
  </style>
  