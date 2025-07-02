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

const produce = (state, updater) => {
  const draft = deepClone(state);
  updater(draft);
  return draft;
};

// single source of Truth: appState
let appState = {
  todos: [],
  filter: "all",
  user: {
    name: "Guest",
    preferences: {
      theme: "Light",
    },
  },
  lastUpdated: new Date().toISOString(),
};
//
