import { writable } from 'svelte/store';

interface Message {
    id: number;
    content: string;
    role: string;
    state: string;
}

interface ChatStore {
    messages: Message[];
}

function createChatStore() {
    const { subscribe, update, set } = writable<ChatStore>({
        messages: [
            { id: 1, content: "¡Hola! ¿En qué puedo ayudarte hoy?", role: "assistant", state: "complete" }
        ]
    });

    return {
        subscribe,
        addMessage: (message: Message) => update(store => ({
            ...store,
            messages: [...store.messages, message]
        })),
        updateLastMessage: (updatedMessage: Partial<Message>) => update(store => {
            const messages = [...store.messages];
            const lastIndex = messages.length - 1;
            if (lastIndex >= 0) {
                messages[lastIndex] = { ...messages[lastIndex], ...updatedMessage };
            }
            return { ...store, messages };
        }),
        reset: () => set({ messages: [] })
    };
}

export const chatStore = createChatStore();