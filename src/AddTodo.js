import React, { useState, useContext } from "react";
import { uuidv4 } from "uuid";
import { TodoContext } from "./reduce";

const AddTodo = () => {
  const dispatch = useContext(TodoContext);

  const [task, setTask] = useState("");

  const handleSubmit = (event) => {
    if (task) {
      dispatch({ type: "ADD_TODO", task, id: "1" });
    }

    setTask("");

    event.preventDefault();
  };

  const handleChange = (event) => setTask(event.target.value);

  return (
    <form onSubmit={handleSubmit}>
      <input type="text" value={task} onChange={handleChange} />
      <button type="submit">Add Todo</button>
    </form>
  );
};
export default AddTodo;
