import React, { useReducer } from "react";
import Filter from "./Filter";
import TodoList from "./TodoList";
import AddTodo from "./AddTodo";
import { filterReducer, todoReducer, TodoContext } from "./reduce";
import { initialTodos } from "./data";
import "./styles.css";

const App = () => {
  const [filter, dispatchFilter] = useReducer(filterReducer, "ALL");
  const [todos, dispatchTodos] = useReducer(todoReducer, initialTodos);

  const filteredTodos = todos.filter((todo) => {
    if (filter === "ALL") {
      return true;
    }

    if (filter === "COMPLETE" && todo.complete) {
      return true;
    }

    if (filter === "INCOMPLETE" && !todo.complete) {
      return true;
    }

    return false;
  });

  return (
    <TodoContext.Provider value={dispatchTodos}>
      <Filter dispatch={dispatchFilter} />
      <TodoList todos={filteredTodos} />
      <AddTodo />
    </TodoContext.Provider>
  );
};

export default App;
