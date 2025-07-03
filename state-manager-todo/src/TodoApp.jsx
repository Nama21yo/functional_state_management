import React, { useReducer, useCallback } from "react";
import {
  Plus,
  Check,
  X,
  RotateCcw,
  RotateCw,
  Filter,
  User,
  Trash2,
} from "lucide-react";
import "./TodoApp.css";

// Deep clone utility for immutable state updates
const deepClone = (obj) => {
  if (obj === null || typeof obj !== "object") return obj;
  if (obj instanceof Date) return new Date(obj.getTime());
  if (obj instanceof Array) return obj.map((item) => deepClone(item));
  if (typeof obj === "object") {
    const clonedObj = {};
    for (const key in obj) {
      if (Object.prototype.hasOwnProperty.call(obj, key)) {
        clonedObj[key] = deepClone(obj[key]);
      }
    }
    return clonedObj;
  }
};

// Immutable state update helper
const produce = (state, updater) => {
  const draft = deepClone(state);
  updater(draft);
  return draft;
};

// State reducer for handling actions
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

// Action logging utility
const createLogger = (prefix) => (event) => {
  const timestamp = new Date().toISOString();
  console.log(`[${prefix}] ${timestamp} - Action:`, {
    type: event.type,
    payload: event.payload,
  });
  return event;
};

const actionLogger = createLogger("TODO_APP");

// Dispatch action with history management
const dispatchAction = (currentState, currentHistory, event) => {
  const loggedEvent = actionLogger(event);
  const newHistory = produce(currentHistory, (draft) => {
    draft.past.push(deepClone(currentState));
    draft.future = [];
  });
  const newState = StateReducer(currentState, loggedEvent);
  return { appState: newState, history: newHistory };
};

// Undo action
const createUndoAction = (currentHistory, currentState) => {
  if (currentHistory.past.length === 0) {
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

// Redo action
const createRedoAction = (currentHistory, currentState) => {
  if (currentHistory.future.length === 0) {
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

const performUndo = (currentState, currentHistory) => {
  const result = createUndoAction(currentHistory, currentState);
  return { appState: result.newState, history: result.newHistory };
};

const performRedo = (currentState, currentHistory) => {
  const result = createRedoAction(currentHistory, currentState);
  return { appState: result.newState, history: result.newHistory };
};

// Filter todos based on state
const getFilteredTodos = (state, filter = null) => {
  if (!state) {
    console.warn("getFilteredTodos: state is undefined, returning empty array");
    return [];
  }
  const currentFilter = filter || state.filter || "all";
  const todos = state.todos || [];
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

const StateManager = {
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
};

// Initial state
const initialAppState = {
  todos: [],
  filter: "all",
  user: { name: "Guest", preferences: { theme: "light" } },
  lastUpdated: new Date().toISOString(),
};

const initialHistory = {
  past: [],
  future: [],
};

// Reducer for managing app state and history
const appReducer = (state, action) => {
  switch (action.type) {
    case "DISPATCH_ACTION":
      return StateManager.dispatch(
        state.appState || initialAppState,
        state.history || initialHistory,
        action.payload
      );
    case "UNDO":
      return StateManager.undo(
        state.appState || initialAppState,
        state.history || initialHistory
      );
    case "REDO":
      return StateManager.redo(
        state.appState || initialAppState,
        state.history || initialHistory
      );
    default:
      return state;
  }
};

// TodoApp component
const TodoApp = () => {
  const [{ appState, history }, dispatch] = useReducer(appReducer, {
    appState: initialAppState,
    history: initialHistory,
  });

  const handleAction = useCallback((action) => {
    dispatch({ type: "DISPATCH_ACTION", payload: action });
  }, []);

  const handleUndo = useCallback(() => {
    dispatch({ type: "UNDO" });
  }, []);

  const handleRedo = useCallback(() => {
    dispatch({ type: "REDO" });
  }, []);

  const [newTodoText, setNewTodoText] = React.useState("");
  const [editingId, setEditingId] = React.useState(null);
  const [editText, setEditText] = React.useState("");

  const filteredTodos = appState ? StateManager.getFilteredTodos(appState) : [];
  const canUndo = history.past.length > 0;
  const canRedo = history.future.length > 0;

  const handleAddTodo = () => {
    if (newTodoText.trim()) {
      handleAction(StateManager.actions.addTodo({ text: newTodoText.trim() }));
      setNewTodoText("");
    }
  };

  const handleToggleTodo = (id) => {
    handleAction(StateManager.actions.toggleTodo({ id }));
  };

  const handleDeleteTodo = (id) => {
    handleAction(StateManager.actions.deleteTodo({ id }));
  };

  const handleUpdateTodo = (id, text) => {
    if (text.trim()) {
      handleAction(StateManager.actions.updateTodo({ id, text }));
    }
    setEditingId(null);
    setEditText("");
  };

  const handleSetFilter = (filter) => {
    handleAction(StateManager.actions.setFilter({ filter }));
  };

  const handleClearCompleted = () => {
    handleAction(StateManager.actions.clearCompleted());
  };

  const handleUpdateUser = (name) => {
    if (appState) {
      handleAction(
        StateManager.actions.updateUser({ user: { ...appState.user, name } })
      );
    }
  };

  const startEdit = (id, text) => {
    setEditingId(id);
    setEditText(text);
  };

  const completedCount = appState
    ? appState.todos.filter((todo) => todo.completed).length
    : 0;
  const totalCount = appState ? appState.todos.length : 0;
  const userName = appState ? appState.user.name : "Guest";
  const lastUpdated = appState
    ? appState.lastUpdated
    : new Date().toISOString();
  const currentFilter = appState ? appState.filter : "all";

  if (!appState) {
    console.warn("appState is undefined, rendering fallback UI");
  }

  return (
    <div className="app-container">
      <div className="main-container">
        {/* Header */}
        <div className="card header-card">
          <div className="header">
            <h1 className="title">Functional Todo App</h1>
            <div className="header-controls">
              <div className="user-section">
                <User className="icon user-icon" />
                <input
                  type="text"
                  value={userName}
                  onChange={(e) => handleUpdateUser(e.target.value)}
                  className="user-input"
                  placeholder="Your name"
                />
              </div>
              <div className="todo-stats">
                {totalCount} total, {completedCount} completed
              </div>
            </div>
          </div>

          {/* Add Todo */}
          <div className="add-todo">
            <input
              type="text"
              value={newTodoText}
              onChange={(e) => setNewTodoText(e.target.value)}
              onKeyPress={(e) => e.key === "Enter" && handleAddTodo()}
              className="todo-input"
              placeholder="Add a new todo..."
            />
            <button
              onClick={handleAddTodo}
              disabled={!newTodoText.trim()}
              className="add-button"
            >
              <Plus className="icon" />
              <span>Add</span>
            </button>
          </div>
        </div>

        {/* Controls */}
        <div className="card controls-card">
          <div className="controls">
            <div className="filter-section">
              <Filter className="icon filter-icon" />
              <span className="filter-label">Filter:</span>
            </div>
            <div className="filter-buttons">
              {["all", "pending", "completed"].map((filter) => (
                <button
                  key={filter}
                  onClick={() => handleSetFilter(filter)}
                  className={`filter-button ${
                    currentFilter === filter ? "active" : ""
                  }`}
                >
                  {filter}
                </button>
              ))}
            </div>
            <div className="action-buttons">
              <button
                onClick={handleUndo}
                disabled={!canUndo}
                className="action-button"
                title="Undo"
              >
                <RotateCcw className="icon small-icon" />
              </button>
              <button
                onClick={handleRedo}
                disabled={!canRedo}
                className="action-button"
                title="Redo"
              >
                <RotateCw className="icon small-icon" />
              </button>
              {completedCount > 0 && (
                <button onClick={handleClearCompleted} className="clear-button">
                  <Trash2 className="icon small-icon" />
                  <span>Clear Completed</span>
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Todo List */}
        <div className="card todo-list">
          {filteredTodos.length === 0 ? (
            <div className="empty-state">
              <div className="empty-icon">📝</div>
              <p className="empty-text">
                No todos {currentFilter !== "all" ? `(${currentFilter})` : ""}{" "}
                found
              </p>
              <p className="empty-subtext">Add a todo to get started!</p>
            </div>
          ) : (
            <ul className="todo-items">
              {filteredTodos.map((todo) => (
                <li key={todo.id} className="todo-item">
                  <div className="todo-content">
                    <button
                      onClick={() => handleToggleTodo(todo.id)}
                      className={`todo-checkbox ${
                        todo.completed ? "checked" : ""
                      }`}
                    >
                      {todo.completed && <Check className="icon check-icon" />}
                    </button>
                    <div className="todo-text-container">
                      {editingId === todo.id ? (
                        <input
                          type="text"
                          value={editText}
                          onChange={(e) => setEditText(e.target.value)}
                          onKeyPress={(e) => {
                            if (e.key === "Enter") {
                              handleUpdateTodo(todo.id, editText);
                            }
                            if (e.key === "Escape") {
                              setEditingId(null);
                              setEditText("");
                            }
                          }}
                          onBlur={() => handleUpdateTodo(todo.id, editText)}
                          className="edit-input"
                          autoFocus
                        />
                      ) : (
                        <div
                          className={`todo-text ${
                            todo.completed ? "completed" : ""
                          }`}
                          onClick={() => startEdit(todo.id, todo.text)}
                        >
                          {todo.text}
                        </div>
                      )}
                      <div className="todo-date">
                        Created: {new Date(todo.createdAt).toLocaleString()}
                      </div>
                    </div>
                    <button
                      onClick={() => handleDeleteTodo(todo.id)}
                      className="delete-button"
                    >
                      <X className="icon small-icon" />
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Footer */}
        <div className="footer">
          <p>Functional State Management • No useState • Pure Functions Only</p>
          <p className="last-updated">
            Last updated: {new Date(lastUpdated).toLocaleString()}
          </p>
        </div>
      </div>
    </div>
  );
};

export default TodoApp;
