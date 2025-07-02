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
// action logging curring function
const createLogger = (prefix) => (event) => {
  const timestamp = new Date().toISOString();
  console.log(`[${prefix}] ${timestamp} - Action:`, {
    type: event.type,
    payload: event.payload,
  });
  return event;
};

// sepcific loggers
const actionLogger = createLogger("STATE_MANAGER");
const debugLogger = createLogger("DEBUG");

// dispatch
const dispatchAction = (event) => {
  const loggedEvent = actionLogger(event);
  // before updating save current History
  stateHistory = produce(stateHistory, (draft) => {
    draft.past.push(deepClone(appState));
    draft.future = [];
  });

  // apply the reducer
  const newState = stateReducer(appState, loggedEvent);

  //! check this out
  appState = newState;
  return appState;
};
// curried undo function
const createUndoAction = (currentHistory) => (currentState) => {
  if (currentHistory.past.length === 0) {
    //! check this out
    console.warn("No action to undo");
    return {
      newState: currentState,
      newHistory: currentHistory,
    };
  }

  const newHistory = produce(currentHistory, (draft) => {
    const previousState = draft.past.pop();
    draft.future.unshift(currentState); // prepend on the first
    return { previousState };
  });

  return {
    newState: newHistory.previousState,
    newHistory: {
      past: newHistory.past,
      future: newHistory.future,
    },
  };
};

// curried redo function
const createRedoAction = (currentHistory) => (currentState) => {
  if (currentHistory.future.length == 0) {
    // ! check this out
    console.warn("No action to redo");
    return {
      newState: currentState,
      newHistory: currentHistory,
    };
  }

  const newHistory = produce(currentHistory, (draft) => {
    const nextState = draft.future.shift();
    draft.past.push(currentState);
    return { nextState };
  });

  return {
    newState: newHistory.nextState,
    newHistory: {
      past: newHistory.past,
      future: newHistory.future,
    },
  };
};

// apply undo and redo functionality
const undoAction = createUndoAction(stateHistory);
const redoAction = createRedoAction(stateHistory);

//
