import React, { useContext } from "react";
import { Outlet } from "react-router-dom";
import TaskCard from "../components/TaskCard";
import { PlatformContext } from "../context/PlatformContext";

const MyTasks = () => {
  const { tasks, account } = useContext(PlatformContext);
  function checkTask(t) {
    return t.author === account.accountId
    || t.assignee === account.accountId
    || t.candidates.map((c) => c).includes(account.accountId);
  }
  return (
    <>
      <div className="flex w-full justify-center items-start 2xl:px-20 gradient-bg-welcome min-h-screen">
        <div className="flex flex-col md:p-12 py-12 px-4">
          {account.accountId ? (
            <h3 className="text-white text-3xl text-center my-2">Your Tasks</h3>
          ) : (
            <h3 className="text-white text-3xl text-center my-2">
              Connect your account to see the latest tasks
            </h3>
          )}

          <div className="flex flex-wrap justify-center items-center mt-10">
            {[...tasks]
              .reverse()
              .filter(
                (p) => checkTask(p)
              )
              .map((task, i) => (
                <TaskCard key={i} {...task} />
              ))}
          </div>
        </div>
      </div>
      <Outlet />
    </>
  );
};

export default MyTasks;
