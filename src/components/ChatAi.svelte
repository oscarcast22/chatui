<script lang="ts">
	import SvelteMarkdown from 'svelte-markdown';
	import { X, Trash } from "lucide-svelte";
	import Paw from '@/icons/Paw.svelte';
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
				<div class="title">
					<svg class="lobo" xmlns="http://www.w3.org/2000/svg" version="1.1" viewBox="0 0 60.42 54.9">
						<polygon points="46.16 21.78 46.15 21.78 46.16 21.78 46.16 21.78"/>
						<path d="M40.19,5.49c-.76,2.01-.07,3.88.25,5.78.7.2,1.41.39,2.11.58-1.22-3.23-2.32-6.46.42-9.8-2.58.71-4.5,1.71-5.76,2.99.08.85.17,1.71.25,2.56.64-1.17,1.24-2.44,2.74-2.12Z"/>
						<path d="M59.79,21.9c-3.13-1.23-2.73-.09-11.5-5.11-3.18-2.66-7.11-4.89-12-6.57-.1-3.45-1.2-6.81-1.71-10.23-3.56,2.91-5.1,5.21-7.44,9.49-1.56-1.24-8.73-2.9-19.02,1.09,3.8.26,6.13.89,5.85,1.88C6.63,15.05,1.84,18.74,0,25.03c7.13-3.74,15.85-3.64,21.36-2.33-2.06,2.9-1.76,5.52-1.51,6.74-4.22-1.49-8.95-1.09-14.2-.1,2.89-.2,6.6,1.1,7.99,2.2-6.54,5.09-10.19,9.79-12.69,15.54,3.38-3.88,5.18-8.01,14.91-10.83-2.12,3.6-4.19,8-4.33,11.94,1.94-7.06,7.18-14.24,13.08-16.01-1.41-1.18-2.89-2.03-4.44-2.62,1.47-4.56,3.05-4.69,4.65-3.54-1.69,5.33,3.56,7.03,5.29,8.67-.87-1.96-4.84-5.92-1.47-6.61,5.73,1.54,6.83.17,9.11-.46-10.45.59-16.48-7.74-5.95-9.67.03-.73,10.2,2.16,14.36,3.83-1.67-.98-3.09-1.97-3.57-3.04.28.2.68,0,1.21-.61-1.95-.86-2.53-1.85-5.83-2.14.11.42.23.83.34,1.24-3.81-.9-7.63-1.81-11.44-2.71,1.35.8,2.1,1.65,1.96,2.59-3.32,1.52-5.47,3.18-6.84,4.79-4.35-1.81-12.06-1.56-17.32-.77.35-4.41,8.8-7.9,14.56-7.92-1.52-1.33-4.26-2.31-5.73-3.15,5.79-.9,13.48,1.96,17.15,5.06-1.29-1.61-2.66-3.17-2.51-5.42,1.54-3.28,3.29-4.49,5.03-5.79-1.17,2.19-2.24,3.64-3.41,5.83,2.44.01,1.74,2.07,2.56,2.62-.47-.49.17-1.74-.07-3.07-.16-1.58.47-3.15,1.89-4.72.78,1.89,1.26,3.75,1.08,5.56.18,1.47-.2,2.78-1.8,3.77,6.06-.86,10.62.19,13.01,4.01,3.22,1.64,6.45,3.27,9.67,4.91-.85.46-1.04.59-1.35.99,1.15,1.49,1.98,2.1,2.74,2.27-1.07,3.23-3.46,5.24-4.82,5.51-13.38,1.97-20.87,3.99-27.94,17.36-1.56-4.13-.64-8.1,1.18-12.02-6.87,7-4.15,12.58-.06,17.96,3.47-15.01,11.48-20.8,27.4-21.65,2.28-.82,9.29-9.68,6.54-11.35Z"/>
					  </svg>
					<h3>LobAI</h3>
				</div>
				<div class="header-buttons">
					<button on:click={clearHistory} aria-label="Borrar historial">
						<Trash size={20} />
					</button>
					<button on:click={() => isOpen = false} aria-label="Cerrar chat">
						<X size={24} />
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
							class="message-text {message.role === 'user' ? 'user-bubble' : 'ia-bubble'}"
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
						<Paw size={"20px"} color={"white"} />
					</button>
				</form>
			</div>
		</div>
    {/if}
  
    <button class="chat-toggle" on:click={handleOpen}>
		<Paw size={"16px"} color={"white"} />
		Preguntar a LobAI
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
	    bottom: 3.2rem;
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
		z-index: 0;

	  	button {
			cursor: pointer;
	  	}
    }

	.title {
		display: flex;
		flex-direction: row;
		gap: .5rem;
		align-items: center;
	}

	.lobo {
		width: 2rem;
	}

	.header-buttons {
		display: flex;
		flex-direction: row;
		gap: .5rem;
		align-items: center;
	}

	.header-buttons button {
    	display: flex;
    	align-items: center;
    	justify-content: center;
		width: 29px;
		height: 29px;
    	padding: 2px;
    	margin: 0;
    	background: none;
    	border: none;
    	cursor: pointer;
		border-radius: 4px;
		transition: background-color .2s ease-in-out;
	}

	.header-buttons button:hover {
		background-color: #f0f0f0;
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
  
    .ia-bubble {
      	background-color: #f0f0f0;
      	color: #333;
		box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
    }

    :global(.ia-bubble > *:first-child) {
        margin-top: 0;
    }

    :global(.ia-bubble > *:last-child) {
        margin-bottom: 0;
    }
  
	.user-bubble {
	    background-image: linear-gradient(to bottom, rgba(233, 43, 43, 0.893) 50%, rgba(227, 36, 36, 0.859) 100%);
	    padding: 0.75rem;
	    border-radius: 18px;
	    max-width: 70%;
	    color: white;
		background-size: 100% 100%;
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
		background-color: rgba(227, 36, 36, 0.859);
		color: white;
		padding: 10px;
		border-radius: 50%;
		cursor: pointer;
		display: flex;
		align-items: center;
		justify-content: center;
		transition: background-color 0.5s ease;
		
		&[disabled] {
			background: rgb(157, 157, 157);
			opacity: .8;
			pointer-events: none;
		}
	}
  
    .send-button:hover {
      	background-color: rgba(211, 21, 21, 0.887);
    }
  
    .chat-toggle {
      	background-image: linear-gradient(to bottom, rgba(233, 43, 43, 0.893) 50%, rgba(227, 36, 36, 0.859) 100%);
      	color: white;
      	border-radius: 25px;
      	padding: .7rem 1.2rem;
      	cursor: pointer;
	  	position: fixed;
      	bottom: 1rem;
      	right: 1rem;
		display: flex;
    	align-items: center;
    	justify-content: center;
    	gap: 0.4rem;
		line-height: 1;
		font-weight: 650;
		transition: background .4s ease-in-out;
    }
  
    .chat-toggle:hover {
      	background-color: var(--primary-hover);
    }

	.waiting-indicator span {
		display: inline-block;
	    opacity: 0;
		transition: all .2s ease-in-out;
	    animation: blink 1.5s infinite; /* La duración total de la animación */
	} 

	/* Animación para hacer parpadear los puntos */
	@keyframes blink {
	    0%, 33% {
	        opacity: 0;
	        transform: translateY(5px) scale(0.5);
	    }
	    33%, 66% {
	        opacity: 1;
	        transform: translateY(0px) scale(1);
	    }
	    66%, 100% {
	        opacity: 0;
	        transform: translateY(5px) scale(0.5);
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
  