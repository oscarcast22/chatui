<script lang="ts">
	import SvelteMarkdown from 'svelte-markdown';
	import { X, MessageCircle, Trash } from "lucide-svelte";
  	import { afterUpdate } from 'svelte';
	import { fly } from 'svelte/transition';
	import { chatStore } from '@/stores/chatStore';

	let chatBody: HTMLElement;
	let textArea: HTMLTextAreaElement;
	let isOpen: boolean = true;
	let isDisabled: boolean = true;
	let isProcessing: boolean = false;
	let shouldAutoScroll: boolean = true;
	let inputMessage: string = "";
	let threshold: number = 30;

	$: isDisabled = isProcessing || inputMessage.trim().length === 0;

	interface Message {
    	id: number;
    	content: string;
    	role: string;
    	state: string;
	}

    let messages: Message[] = [];
    chatStore.subscribe(store => {
        messages = store.messages;
    });

	function clearHistory() {
        if (confirm('¿Estás seguro de que deseas borrar todo el historial de chat?')) {
            chatStore.clearStorage();
        }
    }

	function formatMessagesForApi(messages: Message[]) {
	    return messages.slice(0, -1).map(({ role, content }) => ({
	        role,
	        content,
	    }));
	}

    const handleSendMessage = () => {
        if (inputMessage.trim() !== "") {
            shouldAutoScroll = true;
			scrollToBottom();
            
            chatStore.addMessage({
                id: messages.length + 1,
                content: inputMessage,
                role: "user",
                state: "complete"
            });
            
            invokeAIResponse();
            
            inputMessage = "";
            textArea.style.height = "2rem";
            isDisabled = true;
        }
    };

    async function invokeAIResponse() {
        isProcessing = true;
        
        chatStore.addMessage({
            id: messages.length + 1,
            content: "",
            role: "assistant",
            state: "waiting"
        });

        const endpoint = `https://worker-ai-test.oscar-cm.workers.dev/`;

		const formattedMessages = formatMessagesForApi(messages);
        
        try {
			const response = await fetch(endpoint, {
    		    method: "POST",
    		    headers: {
    		        "Content-Type": "application/json",
    		    },
    		    body: JSON.stringify({ messages: formattedMessages })
    		});

            if (!response.ok) {
                console.error("Error en la respuesta:", response.statusText);
                chatStore.updateLastMessage({ state: "error" });
                isProcessing = false;
                return;
            }

            if (!response.body) {
                console.error("La respuesta no tiene cuerpo (response.body es null).");
                chatStore.updateLastMessage({ state: "error" });
                isProcessing = false;
                return;
            }

            const reader = response.body.getReader();
            const decoder = new TextDecoder("utf-8");

            while (true) {
                const { done, value } = await reader.read();
                if (done) break;

                const chunk = decoder.decode(value, { stream: true });
                const lines = chunk.split("\n").filter(line => line.trim());

                for (const line of lines) {
                    if (line === "data: [DONE]") {
                        isProcessing = false;
                        return;
                    }

                    const data = JSON.parse(line.replace(/^data:\s*/, ""));
                    const currentText = messages[messages.length - 1].content;

                    chatStore.updateLastMessage({
                        state: "typing",
                        content: currentText + data.response
                    });
                    scrollToBottom();
                }
            }
        } catch (error) {
            console.error("Error en la conexión de fetch:", error);
            chatStore.updateLastMessage({ state: "error" });
        } finally {
            isProcessing = false;
            chatStore.updateLastMessage({
                state: "complete",
                content: messages[messages.length - 1].content
            });
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
		textArea.style.height = "2rem";
		textArea.style.height = textArea.scrollHeight + offset + 'px';
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
				<div>
					<button on:click={clearHistory} aria-label="Borrar historial">
						<Trash size={20} />
					</button>
					<button on:click={() => isOpen = false} aria-label="Cerrar chat">
						<X size={20} />
					</button>
				</div>
			</div>
		
			<div
				bind:this={chatBody}
				on:scroll={handleScroll}
				class="chat-body" 
			>
				{#each messages as message}
					<div class="message {message.role === 'user' ? 'message-user' : 'message-ia'}" transition:fly={{ y: 200, opacity: 0, duration: 380 }}>
						{#if message.role === 'assistant'}
							<svg class="lobo-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 129.04 129.04">
								<g>
									<path d="M64.53,0A64.52,64.52,0,1,0,129,64.53,64.52,64.52,0,0,0,64.53,0ZM86.44,20.85c-4.71,5.73-2.82,11.29-.72,16.84l-3.63-1c-.54-3.27-1.73-6.48-.42-9.93-2.59-.56-3.61,1.62-4.72,3.63L76.53,26Q79.79,22.68,86.44,20.85Zm17.7,53.64C76.78,76,63,85.91,57,111.71c-7-9.24-11.7-18.84.1-30.87-3.12,6.74-4.69,13.57-2,20.67,12.17-23,25-26.47,48-29.85,2.33-.47,6.44-3.93,8.28-9.48-1.31-.3-2.75-1.34-4.72-3.9A5.5,5.5,0,0,1,109,56.57L92.39,48.13c-4.11-6.56-12-8.36-22.37-6.89a6.08,6.08,0,0,0,3.09-6.48,20.35,20.35,0,0,0-1.86-9.56q-3.65,4-3.24,8.12c.42,2.29-.69,4.44.12,5.28-1.41-1-.2-4.49-4.39-4.52,2-3.77,3.84-6.24,5.85-10-3,2.23-6,4.31-8.64,10-.27,3.87,2.1,6.56,4.31,9.32C59,38,45.73,33.08,35.78,34.63,38.3,36.06,43,37.76,45.62,40c-9.89,0-24.42,6-25,13.62,9-1.37,22.3-1.8,29.77,1.32,2.37-2.77,6.06-5.62,11.77-8.24.23-1.61-1.05-3.08-3.38-4.46L78.42,47c-.19-.71-.38-1.42-.58-2.14,5.68.5,6.69,2.21,10,3.68-.91,1-1.6,1.39-2.08,1,.83,1.84,3.26,3.55,6.14,5.23h0c-7.14-2.89-24.63-7.85-24.68-6.59-18.1,3.31-7.74,17.63,10.23,16.62-3.93,1.08-5.82,3.45-15.66.79-5.79,1.2,1,8,2.53,11.37-3-2.82-12-5.75-9.09-14.9-2.76-2-5.47-1.76-8,6.08a26.18,26.18,0,0,1,7.63,4.5c-10.13,3-19.14,15.38-22.48,27.52.22-6.76,3.78-14.33,7.43-20.52C23.12,84.49,20,91.6,14.21,98.27c4.31-9.9,10.58-18,21.83-26.73-2.4-1.89-8.78-4.11-13.74-3.77,9-1.71,17.16-2.4,24.41.16A14.38,14.38,0,0,1,49.3,56.34c-9.48-2.26-24.46-2.42-36.72,4,3.17-10.8,11.39-17.15,24-21.6.48-1.71-3.51-2.79-10-3.23,17.7-6.86,30-4,32.7-1.88,4-7.35,6.66-11.31,12.79-16.32C72.92,23.19,74.81,29,75,34.9A64.54,64.54,0,0,1,95.61,46.19C110.68,54.81,110,52.86,115.38,55,120.1,57.85,108.05,73.08,104.14,74.49Z"/>
								</g>
							</svg>
						{/if}
						<div 
							class="message-text {message.role === 'user' ? 'message-text-user' : 'message-text-ia'}"
						>
							{#if message.role === 'assistant'}
								<SvelteMarkdown source={message.content} />
							{:else}
								{message.content}
							{/if}
							{#if message.role === 'assistant' && message.state === 'waiting'}
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
		scroll-behavior: smooth;
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
      	background-color: var(--chat-body-bg);
      	padding: 1rem;
      	display: flex;
      	justify-content: space-between;
		height: 4rem;
		flex-shrink: 0;
		align-items: center;
		box-shadow: 
			0 1px 2px rgba(0, 0, 0, .1),
			0 -1px rgba(0, 0, 0, .1) inset,
			0 2px 1px 1px rgba(255, 255, 255, .5) inset;

	  	button {
			cursor: pointer;
	  	}
    }
  
    .chat-body {
      	overflow-y: auto;
		overflow-x: hidden;
		flex-grow: 1;
      	background-color: var(--chat-body-bg);
		padding: 0 1rem 0;
    }

	.chat-body > :last-child {
		margin-bottom: 1rem;
	}
  
    .chat-footer {
      	padding: .8rem .5rem;
		flex-shrink: 0;
      	background-color: var(--chat-body-bg);
    }
  
    .message {
      	display: flex;
		word-break: break-word;
		margin-top: 1rem;
    }
  
    .message-ia {
      	justify-content: start;
		gap: .6rem; 
    }

	.lobo-icon {
		fill: #333;
		width: 25px;
		align-self: flex-end;
		flex-shrink: 0;
		margin-bottom: .5rem;
		filter: drop-shadow(0 2px 10px rgba(0, 0, 0, 0.1));
	}
  
    .message-user {
      	justify-content: end;
    }
  
    .message-text {
      	padding: 0.75rem;
      	border-radius: 18px;
    }
  
    .message-text-ia {
      	background-color: #f0f0f0;
      	color: #333;
		box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
    }

    :global(.message-text-ia > *:first-child) {
        margin-top: 0;
    }

    :global(.message-text-ia > *:last-child) {
        margin-bottom: 0;
    }
  
	.message-text-user {
	    background-image: linear-gradient(to bottom, #c1278a 0%, rgba(244, 52, 52, 0.893) 30%, rgba(155, 7, 7, 0.859) 100%);
		background-attachment: fixed;
	    padding: 0.75rem;
	    border-radius: 18px;
	    max-width: 70%;
	    color: white;
		background-size: 100% 100%;
	    border: 1px solid rgba(255, 255, 255, 0.1);
	    box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
	}

  
    .textarea-container {
      	display: flex;
		border-radius: 1.8rem;
      	gap: 0.5rem;
		align-items: center;
		padding: 0.5rem;
		background-color: #f0f0f0;
    }
  
    textarea {
      	flex-grow: 1;
		background-color: transparent;
		margin-left: .2rem;
      	border: none;
		outline: none;
      	resize: none;
      	overflow: auto;
      	height: 2rem;
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
	  	background: var(--chat-body-bg);
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
  