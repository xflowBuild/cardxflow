// Local Storage Client - מחליף את Base44 SDK לפיתוח מקומי

const STORAGE_KEYS = {
  cards: 'app_cards',
  folders: 'app_folders',
  tags: 'app_tags',
  apiTemplates: 'app_api_templates',
  user: 'app_user',
};

// Helper functions
const generateId = () => `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

const getFromStorage = (key) => {
  try {
    const data = localStorage.getItem(key);
    return data ? JSON.parse(data) : [];
  } catch {
    return [];
  }
};

const saveToStorage = (key, data) => {
  localStorage.setItem(key, JSON.stringify(data));
};

// Create entity operations factory
const createEntityOperations = (storageKey) => ({
  list: async (sortBy) => {
    const items = getFromStorage(storageKey);
    if (sortBy) {
      const desc = sortBy.startsWith('-');
      const field = desc ? sortBy.slice(1) : sortBy;
      items.sort((a, b) => {
        const aVal = a[field] || '';
        const bVal = b[field] || '';
        return desc ? (bVal > aVal ? 1 : -1) : (aVal > bVal ? 1 : -1);
      });
    }
    return items;
  },

  create: async (data) => {
    const items = getFromStorage(storageKey);
    const newItem = {
      ...data,
      id: generateId(),
      created_date: new Date().toISOString(),
      updated_date: new Date().toISOString(),
    };
    items.push(newItem);
    saveToStorage(storageKey, items);
    return newItem;
  },

  update: async (id, data) => {
    const items = getFromStorage(storageKey);
    const index = items.findIndex(item => item.id === id);
    if (index !== -1) {
      items[index] = {
        ...items[index],
        ...data,
        updated_date: new Date().toISOString(),
      };
      saveToStorage(storageKey, items);
      return items[index];
    }
    throw new Error('Item not found');
  },

  delete: async (id) => {
    const items = getFromStorage(storageKey);
    const filtered = items.filter(item => item.id !== id);
    saveToStorage(storageKey, filtered);
    return { success: true };
  },

  get: async (id) => {
    const items = getFromStorage(storageKey);
    return items.find(item => item.id === id);
  },
});

// Local user for development
const localUser = {
  id: 'local-user',
  email: 'local@dev.com',
  full_name: 'משתמש מקומי',
};

// Export client that mimics Base44 SDK structure
export const base44 = {
  entities: {
    Card: createEntityOperations(STORAGE_KEYS.cards),
    Folder: createEntityOperations(STORAGE_KEYS.folders),
    Tag: createEntityOperations(STORAGE_KEYS.tags),
    ApiTemplate: createEntityOperations(STORAGE_KEYS.apiTemplates),
  },
  auth: {
    me: async () => localUser,
    logout: () => {
      console.log('Logout called (local mode)');
    },
  },
};

export default base44;
