<script lang="ts">
	import autoAnimate from '@formkit/auto-animate';
	import { marked } from 'marked';
	import { X, MessageCircle } from "lucide-svelte";
  	import { afterUpdate } from 'svelte';
	import { fly } from 'svelte/transition';

	interface Message {
		id: number;
		text: string;
		sender: string;
		state: string;
	}

	let chatBody: HTMLElement;
	let textArea: HTMLTextAreaElement;
	let isOpen: boolean = true;
	let isDisabled: boolean = true;
	let isProcessing: boolean = false;
	let shouldAutoScroll: boolean = true;
	let inputMessage: string = "";
	let threshold: number = 50;

	let messages: Message[] = [
		{ id: 1, text: "¡Hola! ¿En qué puedo ayudarte hoy?", sender: "bot", state: "complete" },
	];

	$: isDisabled = isProcessing || inputMessage.trim().length === 0;

	function handleOpen() {
		let wasOpen: boolean = isOpen;
		isOpen = !isOpen;
		if (!wasOpen && isOpen) {
			shouldAutoScroll = true;
    	}
	}

	function isAtBottom(): boolean {
	    if (!chatBody) return false;
	    return chatBody.scrollHeight - chatBody.scrollTop - chatBody.clientHeight <= threshold;
	}

	function handleScroll() {
	    shouldAutoScroll = isAtBottom();
	}

	function scrollToBottom() {
	    if (!chatBody || (!shouldAutoScroll)) return;
	    chatBody.scrollTop = chatBody.scrollHeight;

	}

	function adjustTextareaHeight() {
		if (!textArea) return;
		const offset = textArea.offsetHeight - textArea.clientHeight;
		textArea.style.height = "2.7rem";
		textArea.style.height = textArea.scrollHeight + offset + 'px';
	}

	const handleSendMessage = () => {
		if (inputMessage.trim() !== "") {
			shouldAutoScroll = true;
			messages = [...messages, { id: messages.length + 1, text: inputMessage, sender: "user", state: "complete" }];
			
			invokeAIResponse();
			
			inputMessage = "";
			textArea.style.height = "2.7rem";

			isDisabled = true;

		}
	};

	// Invoca la API y muestra los fragmentos en tiempo real
	async function invokeAIResponse() {
	    isProcessing = true;
	    const botMessage = { id: messages.length + 1, text: "", sender: "bot", state: "waiting" };
	    messages = [...messages, botMessage];

	    const endpoint = `https://worker-ai-test.oscar-cm.workers.dev/query?text=${encodeURIComponent(inputMessage)}`;
		
	    try {
	        const response = await fetch(endpoint, {
	            method: "GET",
	            headers: {
	                "Content-Type": "application/json",
	            }
	        });

	        if (!response.ok) {
	            console.error("Error en la respuesta:", response.statusText);
	            botMessage.state = "error";
	            isProcessing = false;
	            messages = [...messages];
	            return;
	        }

			if (!response.body) {
				console.error("La respuesta no tiene cuerpo (response.body es null).");
				botMessage.state = "error";
				isProcessing = false;
				messages = [...messages];
				return;
			}

	        const reader = response.body.getReader();
	        const decoder = new TextDecoder("utf-8");
		
	        while (true) {
	            const { done, value } = await reader.read();
	            if (done) break;
			
	            const chunk = decoder.decode(value, { stream: true });
	            const lines = chunk.split("\n").filter(line => line.trim());
				console.log(lines);

	            for (const line of lines) {
	                if (line === "data: [DONE]") {
	                    botMessage.state = "complete";
	                    isProcessing = false;
	                    messages = [...messages];
	                    return;
	                }
				
	                const data = JSON.parse(line.replace(/^data:\s*/, ""));
	                botMessage.state = "typing";
	                botMessage.text += data.response;
	                messages = [...messages];
	                scrollToBottom();
	            }
	        }
	    } catch (error) {
	        console.error("Error en la conexión de fetch:", error);
	        botMessage.state = "error";
	    } finally {
	        isProcessing = false;
			botMessage.state = "complete";
			console.log(botMessage);
	        messages = [...messages];
	    }
	}

	function handleKeyDown(event: { key: string; shiftKey: any; preventDefault: () => void; }) {
	    if (!isDisabled && !isProcessing && event.key === 'Enter' && !event.shiftKey) {
	        event.preventDefault();
	        handleSendMessage();
	    } else if (isDisabled && event.key === 'Enter' && !event.shiftKey) {
	        event.preventDefault();
	    }
	}

	function handleInput() {
    	adjustTextareaHeight();
	}

	afterUpdate(() => {
		scrollToBottom();
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
		
			<div
				bind:this={chatBody}
				on:scroll={handleScroll}
				class="chat-body" 
				use:autoAnimate 
			>
				{#each messages as message}
					<div class="message {message.sender === 'user' ? 'message-user' : 'message-bot'}">
						<div 
							class="message-text {message.sender === 'user' ? 'message-text-user' : 'message-text-bot'}"
						>
							{#if message.sender === 'bot'}
								{@html marked(message.text)}
								{#if message.state === 'typing'}
									<span class="typing-indicator">&#11044;</span>
								{/if}
							{:else}
								{message.text}
							{/if}
							{#if message.sender === 'bot' && message.state === 'waiting'}
								<span class="waiting-indicator">
									<span>●</span>
									<span>●</span>
									<span>●</span>
								</span>
						  	{/if}
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
						bind:this={textArea}
						on:keydown={handleKeyDown}
						on:input={handleInput}
				  		placeholder="Escribe tu mensaje..."
					></textarea>
					<button class="send-button" type="submit" disabled={isDisabled} aria-label="Enviar mensaje">
						<svg aria-hidden="true" xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none" viewBox="0 0 24 24">
							<path stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v13m0-13 4 4m-4-4-4 4"/>
						</svg>  
					</button>
				</form>
			</div>
		</div>
    {/if}
  
    <button class="chat-toggle" on:click={handleOpen}>
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
		width: 90vw;
		height: 600px;
		max-width: 25rem;
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
      	overflow-y: auto;
		overflow-x: hidden;
		flex-grow: 1;
      	padding: 1rem;
      	background-color: #f1f1f1;
	  	scroll-behavior: smooth;
    }
  
    .chat-footer {
      	padding: .5rem;
		flex-shrink: 0;
      	background-color: #f1f1f1;
    }
  
    .message {
      	margin-bottom: 1rem;
      	display: flex;
		word-break: break-word;
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
		border-radius: 1.8rem;
		border: 1px solid #aaaaaa;
      	gap: 0.5rem;
		align-items: center;
		padding: 0.4rem;
		background-color: white;
    }
  
    textarea {
      	flex-grow: 1;
      	padding: 0.5rem;
		background-color: transparent;
      	border: none;
      	border-radius: 0.25rem;
		outline: none;
      	resize: none;
      	overflow: auto;
      	height: 2.7rem;
      	max-height: 5.4rem;
    }


  
	.send-button {
		background-color: var(--primary);
		color: white;
		padding: 0.4rem;
		border-radius: 50%;
		cursor: pointer;
		display: flex;
		align-items: center;
		justify-content: center;
		
		&[disabled] {
			background: var(--primary-hover);
			opacity: .8;
			pointer-events: none;
		}
	}
  
    .send-button:hover {
      	background-color: var(--primary-hover);
    }

	.send-button svg {
		height: 1.7rem;
		width: 1.7rem;
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

	.waiting-indicator span {
	    opacity: 0;
	    animation: blink 1.5s infinite; /* La duración total de la animación */
	}

	/* Animación para hacer parpadear los puntos */
	@keyframes blink {
	    0%, 20% {
	        opacity: 0; /* Comienza invisible */
	    }
	    30%, 50% {
	        opacity: 1; /* Visible en estos puntos */
	    }
	    100% {
	        opacity: 0; /* Termina invisible */
	    }
	}

	/* Agregar un delay a cada punto */
	.waiting-indicator span:nth-child(1) {
	    animation-delay: 0s; /* Sin retraso */
	}

	.waiting-indicator span:nth-child(2) {
	    animation-delay: 0.3s; /* 300ms de retraso */
	}

	.waiting-indicator span:nth-child(3) {
	    animation-delay: 0.6s; /* 600ms de retraso */
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
	  	width: 4px;
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
  