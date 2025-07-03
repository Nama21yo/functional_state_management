// creates deepcopy of any object
const deepClone = (obj) => {
  // for prmitive values
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
// draft will be mutated but is the copy
// just like Immer
const produce = (state, updater) => {
  const draft = deepClone(state);
  updater(draft);
  return draft;
};
//  Single Source of Truth: appState (Now managed externally, not global)
// let appState = {
///=   todos: [],
//   filter: "all", // 'all', 'completed', 'pending'
//   user: {
//     name: "Guest",
//     preferences: {
//       theme: "light",
//     },
//   },
//   lastUpdated: new Date().toISOString(),
// };

// history management for undo/redo (Now managed externally, not global)
// let stateHistory = {
//   past: [],
//   future: [],
// };
// pure Reducer Function
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

// Action Logging (Curried Function)
const createLogger = (prefix) => (event) => {
  const timestamp = new Date().toISOString();
  console.log(`[${prefix}] ${timestamp} - Action:`, {
    type: event.type,
    payload: event.payload,
  });
  return event;
};

const actionLogger = createLogger("STATE_MANAGER");

// dispatch Mechanism
const dispatchAction = (currentState, currentHistory, event) => {
  const loggedEvent = actionLogger(event);
  const newHistory = produce(currentHistory, (draft) => {
    draft.past.push(deepClone(currentState));
    draft.future = [];
  });
  const newState = StateReducer(currentState, loggedEvent);
  return { state: newState, history: newHistory };
};

// Undo and Redo Functionality
// const dispatchAction = (event) => {
//   const loggedEvent = actionLogger(event);
//   stateHistory = produce(stateHistory, (draft) => {
//     draft.past.push(deepClone(appState));
//     draft.future = [];
//   });
//   const newState = StateReducer(appState, loggedEvent);
//   appState = newState;
//   return appState;
// };
const createUndoAction = (currentHistory, currentState) => {
  if (currentHistory.past.length === 0) {
    // console.warn("No actions to undo");
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

const createRedoAction = (currentHistory, currentState) => {
  if (currentHistory.future.length === 0) {
    // console.warn("No actions to redo");
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

// const performUndo = () => {
//   const result = createUndoAction(stateHistory, appState);
//   appState = result.newState;
//   stateHistory = result.newHistory;
//   console.log("Undo performed. Current state:", appState);
//   return appState;
// };
const performUndo = (currentState, currentHistory) => {
  const result = createUndoAction(currentHistory, currentState);
  return { state: result.newState, history: result.newHistory };
};

// const performRedo = () => {
//   const result = createRedoAction(stateHistory, appState);
//   appState = result.newState;
//   stateHistory = result.newHistory;
//   console.log("Redo performed. Current state:", appState);
//   return appState;
// };
const performRedo = (currentState, currentHistory) => {
  const result = createRedoAction(currentHistory, currentState);
  return { state: result.newState, history: result.newHistory };
};

// utility functions for state access (pure functions)
const getCurrentState = (state) => deepClone(state);

// const getFilteredTodos = (filter = null) => {
//   const currentFilter = filter || appState.filter;
//   const todos = appState.todos;
//   switch (currentFilter) {
//     case "completed":
//       return todos.filter((todo) => todo.completed);
//     case "pending":
//       return todos.filter((todo) => !todo.completed);
//     case "all":
//     default:
//       return todos;
//   }
// };
const getFilteredTodos = (state, filter = null) => {
  const currentFilter = filter || state.filter;
  const todos = state.todos;
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

// Action creators
const createActionCreator = (type) => (payload) => ({
  type,
  payload,
});

const addTodo = createActionCreator("ADD_TODO");
const toggleTodo = createActionCreator("TOGGLE_TODO");
const deleteTodo = createActionCreator("DELETE_TODO");
const updateTodo = createActionCreator("UPDATE_TODO");
const setFilter = createActionCreator("SET_FILTER");
const updateUser = createActionCreator("UPDATE_USER");
const clearCompleted = createActionCreator("CLEAR_COMPLETED");

// function composition utility
const compose =
  (...fns) =>
  (value) =>
    fns.reduceRight((acc, fn) => fn(acc), value);

// pipeline utility
const pipe =
  (...fns) =>
  (value) =>
    fns.reduce((acc, fn) => fn(acc), value);

// export the public API
const StateManager = {
  getCurrentState: (state) => getCurrentState(state),
  getFilteredTodos: (state, filter) => getFilteredTodos(state, filter),
  dispatch: (state, history, action) => dispatchAction(state, history, action),
  actions: {
    addTodo,
    toggleTodo,
    deleteTodo,
    updateTodo,
    setFilter,
    updateUser,
    clearCompleted,
  },
  undo: (state, history) => performUndo(state, history),
  redo: (state, history) => performRedo(state, history),
  createLogger,
  compose,
  pipe,
};

// Example usage with console logs to verify output
console.log("=== Functional State Management System ===");

// Initial state and history
let appState = {
  todos: [],
  filter: "all",
  user: { name: "Guest", preferences: { theme: "light" } },
  lastUpdated: new Date().toISOString(),
};

let stateHistory = {
  past: [],
  future: [],
};

console.log(
  "Initial state: todos count:",
  appState.todos.length,
  "filter:",
  appState.filter
);
console.log(
  "Initial history: past length:",
  stateHistory.past.length,
  "future length:",
  stateHistory.future.length
);

// Add a todo
const addAction = StateManager.actions.addTodo({
  text: "Learn Functional Programming",
});
console.log("Dispatching action:", addAction);
const dispatchResult = StateManager.dispatch(appState, stateHistory, addAction);
console.log(
  "New state after add: todos count:",
  dispatchResult.state.todos.length,
  "filter:",
  dispatchResult.state.filter
);
console.log(
  "New history after add: past length:",
  dispatchResult.history.past.length,
  "future length:",
  dispatchResult.history.future.length
);
appState = dispatchResult.state;
stateHistory = dispatchResult.history;

// Toggle a todo
const firstTodoId = appState.todos[0].id;
const toggleAction = StateManager.actions.toggleTodo({ id: firstTodoId });
console.log("Dispatching action:", toggleAction);
const toggleResult = StateManager.dispatch(
  appState,
  stateHistory,
  toggleAction
);
console.log(
  "New state after toggle: todos count:",
  toggleResult.state.todos.length,
  "filter:",
  toggleResult.state.filter
);
console.log(
  "New history after toggle: past length:",
  toggleResult.history.past.length,
  "future length:",
  toggleResult.history.future.length
);
appState = toggleResult.state;
stateHistory = toggleResult.history;

// Undo the toggle action
console.log("Performing undo");
const undoResult = StateManager.undo(appState, stateHistory);
console.log(
  "State after undo: todos count:",
  undoResult.state.todos.length,
  "filter:",
  undoResult.state.filter
);
console.log(
  "History after undo: past length:",
  undoResult.history.past.length,
  "future length:",
  undoResult.history.future.length
);
appState = undoResult.state;
stateHistory = undoResult.history;

// Redo the toggle action
console.log("Performing redo");
const redoResult = StateManager.redo(appState, stateHistory);
console.log(
  "State after redo: todos count:",
  redoResult.state.todos.length,
  "filter:",
  redoResult.state.filter
);
console.log(
  "History after redo: past length:",
  redoResult.history.past.length,
  "future length:",
  redoResult.history.future.length
);
appState = redoResult.state;
stateHistory = redoResult.history;

// Get filtered todos
console.log("Getting filtered todos with filter: 'all'");
const filteredTodosAll = StateManager.getFilteredTodos(appState, "all");
console.log("Filtered todos count (all):", filteredTodosAll.length);

console.log("Getting filtered todos with filter: 'completed'");
const filteredTodosCompleted = StateManager.getFilteredTodos(
  appState,
  "completed"
);
console.log("Filtered todos count (completed):", filteredTodosCompleted.length);

console.log("Getting filtered todos with filter: 'pending'");
const filteredTodosPending = StateManager.getFilteredTodos(appState, "pending");
console.log("Filtered todos count (pending):", filteredTodosPending.length);
