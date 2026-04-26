export interface ChatMessage {
  id: string;
  role: 'system' | 'user' | 'assistant';
  content: string;
  timestamp: number;
  conversationId: string;
}

export interface Conversation {
  id: string;
  title: string;
  createdAt: number;
  updatedAt: number;
  messageCount: number;
}

const DB_NAME = 'three-kingdoms-ai';
const DB_VERSION = 1;
const CONVOS_STORE = 'conversations';
const MESSAGES_STORE = 'messages';

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);
    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(CONVOS_STORE)) {
        db.createObjectStore(CONVOS_STORE, { keyPath: 'id' });
      }
      if (!db.objectStoreNames.contains(MESSAGES_STORE)) {
        const store = db.createObjectStore(MESSAGES_STORE, { keyPath: 'id' });
        store.createIndex('conversationId', 'conversationId', { unique: false });
        store.createIndex('timestamp', 'timestamp', { unique: false });
      }
    };
  });
}

function genId(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
}

// ===== Conversation CRUD =====

export async function createConversation(title?: string): Promise<Conversation> {
  const db = await openDB();
  const convo: Conversation = {
    id: genId(),
    title: title || '新对话',
    createdAt: Date.now(),
    updatedAt: Date.now(),
    messageCount: 0,
  };
  return new Promise((resolve, reject) => {
    const tx = db.transaction(CONVOS_STORE, 'readwrite');
    tx.objectStore(CONVOS_STORE).put(convo);
    tx.oncomplete = () => resolve(convo);
    tx.onerror = () => reject(tx.error);
  });
}

export async function getConversations(): Promise<Conversation[]> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(CONVOS_STORE, 'readonly');
    const request = tx.objectStore(CONVOS_STORE).getAll();
    request.onsuccess = () => {
      const convos = request.result as Conversation[];
      convos.sort((a, b) => b.updatedAt - a.updatedAt);
      resolve(convos);
    };
    request.onerror = () => reject(request.error);
  });
}

export async function deleteConversation(id: string): Promise<void> {
  const db = await openDB();
  // Delete messages first
  const messages = await getMessages(id);
  await new Promise<void>((resolve, reject) => {
    const tx = db.transaction(MESSAGES_STORE, 'readwrite');
    const store = tx.objectStore(MESSAGES_STORE);
    messages.forEach(m => store.delete(m.id));
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
  // Then delete conversation
  return new Promise((resolve, reject) => {
    const tx = db.transaction(CONVOS_STORE, 'readwrite');
    tx.objectStore(CONVOS_STORE).delete(id);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

export async function updateConversationTitle(id: string, title: string): Promise<void> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(CONVOS_STORE, 'readwrite');
    const store = tx.objectStore(CONVOS_STORE);
    const getReq = store.get(id);
    getReq.onsuccess = () => {
      const convo = getReq.result as Conversation;
      if (convo) {
        convo.title = title;
        convo.updatedAt = Date.now();
        store.put(convo);
      }
    };
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

// ===== Message CRUD =====

export async function addMessage(conversationId: string, role: ChatMessage['role'], content: string): Promise<ChatMessage> {
  const db = await openDB();
  const msg: ChatMessage = {
    id: genId(),
    role,
    content,
    timestamp: Date.now(),
    conversationId,
  };
  return new Promise((resolve, reject) => {
    const tx = db.transaction([MESSAGES_STORE, CONVOS_STORE], 'readwrite');
    tx.objectStore(MESSAGES_STORE).put(msg);
    // Update conversation timestamp and message count
    const convStore = tx.objectStore(CONVOS_STORE);
    const getReq = convStore.get(conversationId);
    getReq.onsuccess = () => {
      const convo = getReq.result as Conversation;
      if (convo) {
        convo.updatedAt = Date.now();
        convo.messageCount = (convo.messageCount || 0) + 1;
        // Auto-title from first user message
        if (role === 'user' && convo.messageCount === 1 && convo.title === '新对话') {
          convo.title = content.slice(0, 30) + (content.length > 30 ? '...' : '');
        }
        convStore.put(convo);
      }
    };
    tx.oncomplete = () => resolve(msg);
    tx.onerror = () => reject(tx.error);
  });
}

export async function getMessages(conversationId: string): Promise<ChatMessage[]> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(MESSAGES_STORE, 'readonly');
    const index = tx.objectStore(MESSAGES_STORE).index('conversationId');
    const request = index.getAll(conversationId);
    request.onsuccess = () => {
      const msgs = request.result as ChatMessage[];
      msgs.sort((a, b) => a.timestamp - b.timestamp);
      resolve(msgs);
    };
    request.onerror = () => reject(request.error);
  });
}

export async function clearAllData(): Promise<void> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction([CONVOS_STORE, MESSAGES_STORE], 'readwrite');
    tx.objectStore(CONVOS_STORE).clear();
    tx.objectStore(MESSAGES_STORE).clear();
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}
