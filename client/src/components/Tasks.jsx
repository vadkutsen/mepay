import { useContext } from "react";
import { HiSearch } from "react-icons/hi";
import { useSearchParams } from "react-router-dom";
import { PlatformContext } from "../context/PlatformContext";
import TaskCard from "./TaskCard";

const Tasks = () => {
  const { account, tasks } = useContext(PlatformContext);
  const [searchParams, setSearchParams] = useSearchParams();
  return (
    <>
      {account.accountId && tasks ? (
        <div>
          <p className="text-white text-3xl text-center my-2">
            {tasks.length === 0
              ? "No tasks yet"
              : `Latest Tasks (${tasks.length})`}
          </p>
          {tasks.length > 0 && (
            <div className="flex flex-row justify-center items-center">
              <input
                className="my-2 w-4/12 rounded-sm p-2 outline-none bg-transparent text-white text-sm white-glassmorphism"
                type="search"
                placeholder="Search..."
                value={searchParams.get("filter") || ""}
                onChange={(event) => {
                  const filter = event.target.value;
                  if (filter) {
                    setSearchParams({ filter });
                  } else {
                    setSearchParams({});
                  }
                }}
              />
              <span>
                <HiSearch size={30} className="text-gray-500" />
              </span>
            </div>
          )}
        </div>
      ) : (
        <>
          <p className="text-white text-3xl text-center my-2">
            MePay is a decentralised freelance platform
          </p>
          <p className="text-white text-3xl text-center my-2">
            Please connect your wallet to see the latest tasks
          </p>
        </>
      )}
      <div className="flex flex-wrap justify-center items-center mt-10">
        {tasks &&
          [...tasks]
            .reverse()
            .filter((t) => {
              const filter = searchParams.get("filter");
              if (!filter) return true;
              const title = t.title.toLowerCase();
              return title.includes(filter.toLowerCase());
            })
            .map((task, i) => <TaskCard key={i} {...task} />)}
      </div>
    </>
  );
};

export default Tasks;
