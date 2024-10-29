<script lang="ts">
	import autoAnimate from '@formkit/auto-animate';
	import { X, MessageCircle, Send } from "lucide-svelte";
  	import { afterUpdate } from 'svelte';
	import { fly } from 'svelte/transition';

	let isOpen = false;
	let inputMessage = "";
	let chatBody: HTMLElement;
	let textArea: HTMLTextAreaElement;
	let messages = [
		{ id: 1, text: "¡Hola! ¿En qué puedo ayudarte hoy?", sender: "bot", state: "complete" },
	];
	let isDisabled = true;
	let isProcessing = false;
	let shouldAutoScroll = true;

	$: isDisabled = isProcessing || inputMessage.trim().length === 0;

	function isAtBottom(): boolean {
	    if (!chatBody) return false;
	    const threshold = 50;
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
			inputMessage = "";

			if (textArea) {
				textArea.style.height = "2.7rem";
			}
			isDisabled = true;
			simulateBotResponse();
		}
	};

	function simulateBotResponse() {
	    isProcessing = true;
	    const botMessage = { id: messages.length + 1, text: "", sender: "bot", state: "typing" };
	    messages = [...messages, botMessage];

	    const fullMessage = "Gracias por tu mensaje. Estoy procesando tu consulta... Un momento, por favor. Este es un mensaje de prueba largo para probar el scroll. Te gusta el chat? ¡Me encanta! 😊";
	    const chunks = fullMessage.split(" ");

	    setTimeout(() => {
	      	chunkBotResponse(chunks, botMessage);
	    }, 2000);
	}

	function chunkBotResponse(chunks: string[], botMessage: { id?: number; text: string; sender?: string; state?: string; }) {
	    chunks.forEach((chunk, index) => {
	      setTimeout(() => {
	        botMessage.text += (botMessage.text ? " " : "") + chunk;
	        messages = [...messages];

	        if (index === chunks.length - 1) {
	          botMessage.state = "complete";
	          isProcessing = false;
	          messages = [...messages];
	        }
	      }, 150 * index);
	    });
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
						<div class="message-text {message.sender === 'user' ? 'message-text-user' : 'message-text-bot'}">
							{message.text}
							{#if message.sender === 'bot' && message.state === 'typing'}
								<span class="typing-indicator">...</span>
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
					<button class="send-button" type="submit" disabled={isDisabled}>
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
      	padding: 1rem;
		flex-shrink: 0;
      	background-color: #f9f9f9;
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

		
		&[disabled] {
            background: var(--primary-hover);
            opacity: .8;
            pointer-events: none;
        }
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

	.typing-indicator {
		animation: typing 0.8s infinite;
	}

	@keyframes typing {
	    0% { opacity: 0; }
	    50% { opacity: 1; }
	    100% { opacity: 0; }
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
  