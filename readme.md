# Functional State Management System

A lightweight, pure functional programming implementation of state management with immutable updates, time-travel debugging, and zero dependencies.

![Screenshot from 2025-07-03 12-36-17](https://github.com/user-attachments/assets/aebe60b6-78f5-47a1-a810-d2cfa32b99a8)


## 🚀 Features

- **100% Pure Functions**: All state transformations are side-effect free
- **Immutable State**: Deep immutability with structural sharing
- **Time Travel**: Full undo/redo functionality with state history
- **Action Logging**: Configurable logging with curried functions
- **Function Composition**: Built-in utilities for composing operations
- **Zero Dependencies**: No external libraries required
- **TypeScript Ready**: Easy to extend with type definitions

## 📦 Installation

Simply include the JavaScript file in your project:

```html
<script src="functional-state-manager.js"></script>
```

Or in Node.js:

```javascript
const StateManager = require("./functional-state-manager");
```

## 🏗️ Architecture

### Core Principles

1. **Single Source of Truth**: All application state lives in one immutable object
2. **Pure Reducers**: State changes are handled by pure functions
3. **Immutable Updates**: All state modifications create new objects
4. **Action-Based**: State changes are triggered by dispatched actions
5. **Time Travel**: Complete history tracking for debugging

### State Structure

```javascript
{
  todos: [],
  filter: 'all', // 'all', 'completed', 'pending'
  user: {
    name: 'Guest',
    preferences: {
      theme: 'light'
    }
  },
  lastUpdated: '2025-07-02T07:27:31.168Z'
}
```

## 🔧 API Reference

### State Access

#### `getCurrentState()`

Returns a deep clone of the current application state.

```javascript
const currentState = StateManager.getCurrentState();
console.log(currentState.todos.length);
```

#### `getFilteredTodos(filter?)`

Returns todos filtered by completion status.

```javascript
const completedTodos = StateManager.getFilteredTodos("completed");
const pendingTodos = StateManager.getFilteredTodos("pending");
const allTodos = StateManager.getFilteredTodos("all");
```

### Actions

#### `dispatch(action)`

Dispatches an action to update the state.

```javascript
StateManager.dispatch({
  type: "ADD_TODO",
  payload: { text: "Learn functional programming" },
});
```

### Action Creators

Pre-built action creators for common operations:

```javascript
// Add a new todo
StateManager.dispatch(
  StateManager.actions.addTodo({
    text: "Complete the project",
  })
);

// Toggle todo completion
StateManager.dispatch(
  StateManager.actions.toggleTodo({
    id: todoId,
  })
);

// Delete a todo
StateManager.dispatch(
  StateManager.actions.deleteTodo({
    id: todoId,
  })
);

// Update todo text
StateManager.dispatch(
  StateManager.actions.updateTodo({
    id: todoId,
    text: "Updated text",
  })
);

// Set filter
StateManager.dispatch(
  StateManager.actions.setFilter({
    filter: "completed",
  })
);

// Update user information
StateManager.dispatch(
  StateManager.actions.updateUser({
    user: { name: "John Doe" },
  })
);

// Clear completed todos
StateManager.dispatch(StateManager.actions.clearCompleted());
```

### Time Travel

#### `undo()`

Reverts to the previous state.

```javascript
StateManager.undo();
```

#### `redo()`

Moves forward to the next state in history.

```javascript
StateManager.redo();
```

### Utilities

#### `createLogger(prefix)`

Creates a curried logging function for actions.

```javascript
const customLogger = StateManager.createLogger("CUSTOM");
// Use with action dispatch for logging
```

#### `compose(...functions)`

Composes functions from right to left.

```javascript
const getTodoCount = (state) => state.todos.length;
const isEven = (n) => n % 2 === 0;
const formatMessage = (isEven) => (isEven ? "Even" : "Odd");

const checkParity = StateManager.compose(formatMessage, isEven, getTodoCount);
const result = checkParity(StateManager.getCurrentState());
```

#### `pipe(...functions)`

Pipes functions from left to right.

```javascript
const pipeline = StateManager.pipe(getTodoCount, isEven, formatMessage);
const result = pipeline(StateManager.getCurrentState());
```

## 📚 Usage Examples

### Basic Todo Management

```javascript
// Add todos
StateManager.dispatch(
  StateManager.actions.addTodo({
    text: "Learn React",
  })
);
StateManager.dispatch(
  StateManager.actions.addTodo({
    text: "Build an app",
  })
);

// Get current state
const state = StateManager.getCurrentState();
console.log(`Total todos: ${state.todos.length}`);

// Toggle first todo
const firstTodo = state.todos[0];
StateManager.dispatch(
  StateManager.actions.toggleTodo({
    id: firstTodo.id,
  })
);

// Filter completed todos
const completed = StateManager.getFilteredTodos("completed");
console.log(`Completed: ${completed.length}`);
```

### Time Travel Debugging

```javascript
// Make some changes
StateManager.dispatch(StateManager.actions.addTodo({ text: "Task 1" }));
StateManager.dispatch(StateManager.actions.addTodo({ text: "Task 2" }));
StateManager.dispatch(StateManager.actions.addTodo({ text: "Task 3" }));

console.log("Current todos:", StateManager.getCurrentState().todos.length); // 3

// Undo last two actions
StateManager.undo();
StateManager.undo();

console.log("After undo:", StateManager.getCurrentState().todos.length); // 1

// Redo one action
StateManager.redo();

console.log("After redo:", StateManager.getCurrentState().todos.length); // 2
```

### Custom Action Creation

```javascript
// Create custom action
const customAction = {
  type: "CUSTOM_ACTION",
  payload: { data: "custom data" },
};

// Extend the reducer to handle custom actions
// (This would require modifying the StateReducer function)
```

### Function Composition Example

```javascript
// Create a pipeline to process state
const getActiveTodoCount = StateManager.compose(
  (todos) => todos.length,
  (todos) => todos.filter((t) => !t.completed),
  (state) => state.todos
);

const activeTodos = getActiveTodoCount(StateManager.getCurrentState());
console.log(`Active todos: ${activeTodos}`);
```

## 🔍 Debugging

The system includes comprehensive logging:

```javascript
// All actions are automatically logged with timestamps
[STATE_MANAGER] 2025-07-02T07:27:31.208Z - Action: {
  type: 'ADD_TODO',
  payload: { text: 'Learn functional programming' }
}
```

### Custom Logging

```javascript
// Create custom loggers for different parts of your app
const uiLogger = StateManager.createLogger("UI");
const apiLogger = StateManager.createLogger("API");

// Use in your action dispatch pipeline
const loggedAction = uiLogger(action);
StateManager.dispatch(loggedAction);
```

## 🧪 Testing

The system is designed to be easily testable:

```javascript
// Test pure functions
const initialState = { todos: [], filter: "all" };
const action = { type: "ADD_TODO", payload: { text: "Test" } };
const newState = StateReducer(initialState, action);

// Test should pass
console.assert(newState.todos.length === 1);
console.assert(initialState.todos.length === 0); // Original unchanged
```

## 🎯 Design Patterns Used

### Functional Programming Patterns

- **Pure Functions**: No side effects, same input always produces same output
- **Immutability**: Data structures never change, new ones are created
- **Higher-Order Functions**: Functions that take or return other functions
- **Currying**: Breaking down functions into multiple single-argument functions
- **Function Composition**: Building complex operations from simple functions

### State Management Patterns

- **Redux-like Architecture**: Unidirectional data flow with actions and reducers
- **Command Pattern**: Actions encapsulate state change requests
- **Memento Pattern**: State history for undo/redo functionality
- **Observer Pattern**: State changes can be observed and logged

## 🚀 Performance Considerations

- **Structural Sharing**: Only changed parts of state are cloned
- **Lazy Evaluation**: Computed values are calculated on demand
- **Memory Management**: History is bounded (can be extended with cleanup)
- **Pure Functions**: Easier to optimize and cache results

## 🔧 Extending the System

### Adding New Action Types

```javascript
// Extend the StateReducer function
case 'NEW_ACTION_TYPE':
  return produce(state, draft => {
    // Your state modification logic
    draft.lastUpdated = new Date().toISOString();
  });
```

### Custom Middleware

```javascript
// Create middleware for action processing
const createMiddleware = (middleware) => (action) => {
  // Process action before dispatch
  return middleware(action);
};

const authMiddleware = createMiddleware((action) => {
  // Add authentication logic
  return { ...action, user: getCurrentUser() };
});
```

## 📄 License

MIT License - Feel free to use in any project.

## 🤝 Contributing

This is a educational implementation demonstrating functional programming principles. Feel free to extend and modify for your needs.

## 📖 Learn More

This implementation demonstrates key functional programming concepts:

- **Immutability**: Why and how to avoid mutable state
- **Pure Functions**: Building predictable, testable code
- **Function Composition**: Creating complex behavior from simple functions
- **Currying**: Functional approach to configurable behavior
- **Higher-Order Functions**: Functions as first-class citizens

Perfect for learning functional programming patterns and building maintainable state management solutions.
