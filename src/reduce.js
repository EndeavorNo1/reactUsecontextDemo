import { createContext } from "react";

const TodoContext = createContext(null);
const filterReducer = (state, action) => {
  switch (action.type) {
    case "SHOW_ALL":
      return "ALL";
    case "SHOW_COMPLETE":
      return "COMPLETE";
    case "SHOW_INCOMPLETE":
      return "INCOMPLETE";
    default:
      throw new Error();
  }
};
const todoReducer = (state, action) => {
  switch (action.type) {
    case "DO_TODO":
      return state.map((todo) => {
        if (todo.id === action.id) {
          return { ...todo, complete: true };
        } else {
          return todo;
        }
      });
    case "UNDO_TODO":
      return state.map((todo) => {
        if (todo.id === action.id) {
          return { ...todo, complete: false };
        } else {
          return todo;
        }
      });
    case "ADD_TODO":
      return state.concat({
        task: action.task,
        id: action.id,
        complete: false
      });
    default:
      throw new Error();
  }
};
export { filterReducer, todoReducer, TodoContext };
