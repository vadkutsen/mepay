import React from "react";
import ReactDOM from "react-dom";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import App from "./App";
import { PlatformProvider } from "./context/PlatformContext";
import MyTasks from "./routes/myTasks";
import Task from "./routes/task";
import "./index.css";
import NewTask from "./routes/new";
import Home from "./routes/home";
import { initializeContract } from "./utils/near";

window.nearInitPromise = initializeContract()
  .then(() => {
    ReactDOM.render(
      <PlatformProvider>
        <Router>
          <Routes>
            <Route path="/" element={<App />}>
              <Route index element={<Home />} />
              <Route path="new" element={<NewTask />} />
              <Route path=":id" element={<Task />} />
              <Route
                path="*"
                element={(
                  <main className="text-white p-1">
                    <h1>There is nothing here!</h1>
                  </main>
                )}
              />
              <Route path="mytasks" element={<MyTasks />} />
            </Route>
          </Routes>
        </Router>
      </PlatformProvider>,
      document.getElementById("root")
    );
  })
  .catch(console.error);
