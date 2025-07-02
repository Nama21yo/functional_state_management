// Immutability utility functions (simple Immer-like implementation)
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

const produce = (state, updater) => {
  const draft = deepClone(state);
  updater(draft);
  return draft;
};

// 1. Single Source of Truth: appState
let appState = {
  todos: [],
  filter: "all", // 'all', 'completed', 'pending'
  user: {
    name: "Guest",
    preferences: {
      theme: "light",
    },
  },
  lastUpdated: new Date().toISOString(),
};

// History management for undo/redo
let stateHistory = {
  past: [],
  future: [],
};

// 3. Pure Reducer Function
const StateReducer = (state, event) => {
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

// 5. Action Logging (Curried Function)
const createLogger = (prefix) => (event) => {
  const timestamp = new Date().toISOString();
  console.log(`[${prefix}] ${timestamp} - Action:`, {
    type: event.type,
    payload: event.payload,
  });
  return event; // Return the event unchanged (pure function)
};

// Create specific loggers
const actionLogger = createLogger("STATE_MANAGER");
const debugLogger = createLogger("DEBUG");

// 4. Dispatch Mechanism
const dispatchAction = (event) => {
  // Log the action (pure function - no side effects on state)
  const loggedEvent = actionLogger(event);

  // Save current state to history before updating
  stateHistory = produce(stateHistory, (draft) => {
    draft.past.push(deepClone(appState));
    draft.future = []; // Clear future when new action is dispatched
  });

  // Apply the reducer (pure function)
  const newState = StateReducer(appState, loggedEvent);

  // Update the global state
  appState = newState;

  return appState;
};

// 6. Undo and Redo Functionality (Fixed Implementation)

// Pure function for undo logic
const createUndoAction = (currentHistory, currentState) => {
  if (currentHistory.past.length === 0) {
    console.warn("No actions to undo");
    return {
      newState: currentState,
      newHistory: currentHistory,
    };
  }

  const previousState = currentHistory.past[currentHistory.past.length - 1];
  const newHistory = produce(currentHistory, (draft) => {
    draft.past.pop();
    draft.future.unshift(deepClone(currentState));
  });

  return {
    newState: previousState,
    newHistory: newHistory,
  };
};

// Pure function for redo logic
const createRedoAction = (currentHistory, currentState) => {
  if (currentHistory.future.length === 0) {
    console.warn("No actions to redo");
    return {
      newState: currentState,
      newHistory: currentHistory,
    };
  }

  const nextState = currentHistory.future[0];
  const newHistory = produce(currentHistory, (draft) => {
    draft.future.shift();
    draft.past.push(deepClone(currentState));
  });

  return {
    newState: nextState,
    newHistory: newHistory,
  };
};

// Undo wrapper function
const performUndo = () => {
  const result = createUndoAction(stateHistory, appState);
  appState = result.newState;
  stateHistory = result.newHistory;
  console.log("Undo performed. Current state:", appState);
  return appState;
};

// Redo wrapper function
const performRedo = () => {
  const result = createRedoAction(stateHistory, appState);
  appState = result.newState;
  stateHistory = result.newHistory;
  console.log("Redo performed. Current state:", appState);
  return appState;
};

// Utility functions for state access (pure functions)
const getCurrentState = () => deepClone(appState);

const getFilteredTodos = (filter = null) => {
  const currentFilter = filter || appState.filter;
  const todos = appState.todos;

  switch (currentFilter) {
    case "completed":
      return todos.filter((todo) => todo.completed);
    case "pending":
      return todos.filter((todo) => !todo.completed);
    case "all":
    default:
      return todos;
  }
};

// Higher-order function for creating action creators (pure functions)
const createActionCreator = (type) => (payload) => ({
  type,
  payload,
});

// Action creators
const addTodo = createActionCreator("ADD_TODO");
const toggleTodo = createActionCreator("TOGGLE_TODO");
const deleteTodo = createActionCreator("DELETE_TODO");
const updateTodo = createActionCreator("UPDATE_TODO");
const setFilter = createActionCreator("SET_FILTER");
const updateUser = createActionCreator("UPDATE_USER");
const clearCompleted = createActionCreator("CLEAR_COMPLETED");

// Function composition utility
const compose =
  (...fns) =>
  (value) =>
    fns.reduceRight((acc, fn) => fn(acc), value);

// Pipeline utility for chaining operations
const pipe =
  (...fns) =>
  (value) =>
    fns.reduce((acc, fn) => fn(acc), value);

// Example usage and testing
console.log("=== Functional State Management System ===");
console.log("Initial state:", getCurrentState());

// Test the system
console.log("\n=== Testing the system ===");

// Add some todos
dispatchAction(addTodo({ text: "Learn functional programming" }));
dispatchAction(addTodo({ text: "Build a todo app" }));
dispatchAction(addTodo({ text: "Master React" }));

console.log("After adding todos:", getCurrentState());

// Toggle a todo
const firstTodoId = appState.todos[0].id;
dispatchAction(toggleTodo({ id: firstTodoId }));

console.log("After toggling first todo:", getCurrentState());

// Test filtering
console.log("\n=== Testing Filtering ===");
console.log("All todos:", getFilteredTodos("all").length);
console.log("Completed todos:", getFilteredTodos("completed").length);
console.log("Pending todos:", getFilteredTodos("pending").length);

// Test undo/redo
console.log("\n=== Testing Undo/Redo ===");
console.log("States in history before undo:", stateHistory.past.length);
performUndo(); // Should undo the toggle
console.log("States in history after first undo:", stateHistory.past.length);
performUndo(); // Should undo the last todo addition
console.log("States in history after second undo:", stateHistory.past.length);
performRedo(); // Should redo the last todo addition
console.log("States in history after redo:", stateHistory.past.length);

console.log("Final state after undo/redo:", getCurrentState());

// Test function composition
console.log("\n=== Testing Function Composition ===");
const getTodoCount = (state) => state.todos.length;
const isEven = (n) => n % 2 === 0;
const formatMessage = (isEven) =>
  isEven ? "Even number of todos" : "Odd number of todos";

const checkTodoCountParity = compose(formatMessage, isEven, getTodoCount);
console.log("Todo count parity:", checkTodoCountParity(getCurrentState()));

// Export the public API
const StateManager = {
  // State access
  getCurrentState,
  getFilteredTodos,

  // Actions
  dispatch: dispatchAction,

  // Action creators
  actions: {
    addTodo,
    toggleTodo,
    deleteTodo,
    updateTodo,
    setFilter,
    updateUser,
    clearCompleted,
  },

  // History management
  undo: performUndo,
  redo: performRedo,

  // Utilities
  createLogger,
  compose,
  pipe,
};

// For browser/module usage
if (typeof module !== "undefined" && module.exports) {
  module.exports = StateManager;
} else if (typeof window !== "undefined") {
  window.StateManager = StateManager;
}
