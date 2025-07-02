// Immutability System Implementation
const deepClone = (obj) => {
  if (obj === null || typeof obj !== "object") return obj;
  if (obj instanceof Date) return new Date(obj.getTime());
  if (obj instanceof Array) return obj.map((item) => deepClone(item));
  if (typeof obj === "object") {
    const clonedObj = {};
    for (const key in obj) {
      if (obj.hasOwnProperty(key)) {
        clonedObj[key] = deepClone(obj[key]);
      }
    }
    return clonedObj;
  }
};

// implementing Immer
const produce = (state, updater) => {
  const draft = deepClone(state);
  updater(draft);
  return draft;
};

// single source of Truth: appState
let appState = {
  todos: [],
  filter: "all", // 'all', 'completed', 'pending'
  user: {
    name: "Guest",
    preferences: {
      theme: "Light",
    },
  },
  lastUpdated: new Date().toISOString(),
};

// history management for undo/redo
let stateHistory = {
    past : [], //stack of previous application states
    future : [] // queue of state available for redo
}


//
