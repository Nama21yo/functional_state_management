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
  past: [], //stack of previous application states
  future: [], // queue of state available for redo
};

// stateReducer Pure Function
const stateReducer = (state, event) => {
  const { type, payload } = event;

  switch (type) {
    case "ADD_TODO":
      return produce(state, (draft) => {
        draft.todos.push({
          id: Date.now() + Math.random(),
          text: payload.text,
          completed: false,
          createdAt: new Date().toISOString(),
        });
        draft.lastUpdated = new Date().toISOString();
      });
    case "TOGGLE_TODO":
      return produce(state, (draft) => {
        // ! check if this one is correct
        const todo = draft.todos.find((t) => t.id === payload.id);
        if (todo) {
          todo.completed = !todo.completed;
          draft.lastUpdated = new Date().toISOString();
        }
      });
    case "DELETE_TODO":
      return produce(state, (draft) => {
        draft.todos = draft.todos.filter((t) => t.id !== payload.id);
        draft.lastUpdated = new Date().toISOString();
      });
    case "UPDATE_TODO":
      return produce(state, (draft) => {
        const todo = draft.todos.find((t) => t.id === payload.id);
        if (todo) {
          todo.text = payload.text;
          draft.lastUpdated = new Date().toISOString();
        }
      });
    case "SET_FILTER":
      return produce(state, (draft) => {
        draft.filter = payload.filter;
        draft.lastUpdated = new Date().toISOString();
      });
    case "UPDATE_USER":
      return produce(state, (draft) => {
        // ! check this out
        Object.assign(draft.user, payload.user);
        draft.lastUpdated = new Date().toISOString();
      });
    case "CLEAR_COMPLETED":
      return produce(state, (draft) => {
        draft.todos = draft.todos.filter((t) => !t.completed);
        draft.lastUpdated = new Date().toISOString();
      });
    default:
      return state;
  }
};

//
