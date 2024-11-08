import { writable } from 'svelte/store';

interface Message {
    id: number;
    role: string;
    content: string;
    state: string;
}

interface ChatStore {
    messages: Message[];
}

const STORAGE_KEY = 'chat_history';

function loadFromStorage(): ChatStore {
    try {
        const stored = localStorage.getItem(STORAGE_KEY);
        if (stored) {
            const parsedData = JSON.parse(stored);
            if (Array.isArray(parsedData.messages)) {
                return parsedData;
            }
        }
    } catch (error) {
        console.error('Error loading chat history:', error);
    }
    
    return {
        messages: [
            { id: 1, content: "Que onda! En que te ayudo?", role: "assistant", state: "complete" }
        ]
    };
}

function saveToStorage(store: ChatStore) {
    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(store));
    } catch (error) {
        console.error('Error saving chat history:', error);
    }
}

function createChatStore() {
    const initialState = loadFromStorage();
    const { subscribe, update, set } = writable<ChatStore>(initialState);

    return {
        subscribe,
        addMessage: (message: Message) => update(store => {
            const newStore = {
                ...store,
                messages: [...store.messages, message]
            };
            saveToStorage(newStore);
            return newStore;
        }),
        updateLastMessage: (updatedMessage: Partial<Message>) => update(store => {
            const messages = [...store.messages];
            const lastIndex = messages.length - 1;
            if (lastIndex >= 0) {
                messages[lastIndex] = { ...messages[lastIndex], ...updatedMessage };
            }
            const newStore = { ...store, messages };
            saveToStorage(newStore);
            return newStore;
        }),
        reset: () => {
            const initialStore = { messages: [] };
            saveToStorage(initialStore);
            set(initialStore);
        },
        clearStorage: () => {
            try {
                localStorage.removeItem(STORAGE_KEY);
                set({
                    messages: [
                        { id: 1, content: "Que onda! En que te ayudo?", role: "assistant", state: "complete" }
                    ]
                });
            } catch (error) {
                console.error('Error clearing chat history:', error);
            }
        }
    };
}

export const chatStore = createChatStore();
