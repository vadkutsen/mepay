import React, { useEffect, useState, useCallback } from "react";
import { toast } from "react-toastify";
import { parseNearAmount } from "near-api-js/lib/utils/format";
import { Web3Storage } from "web3.storage";
import { accountBalance } from "../utils/near";

export const PlatformContext = React.createContext();

const TaskType = {
  FCFS: "First Come First Serve",
  SelectedByAuthor: "Selected By Author",
};

function MessageDisplay({ message, hash }) {
  return (
    <div className="w-full">
      <p>{message}</p>
      {hash && (
        <a
          className="text-[#6366f1]"
          href={`https://explorer.testnet.near.org/transactions/${hash}`}
          target="_blank"
          rel="noreferrer"
        >
          Check on NEAR explorer
        </a>
      )}
    </div>
  );
}

export const PlatformProvider = ({ children }) => {
  const account = window.walletConnection.account();
  const [formData, setformData] = useState({
    title: "",
    description: "",
    projectType: "FCFS",
    reward: 0,
  });
  const [isLoading, setIsLoading] = useState(false);
  const [tasks, setTasks] = useState([]);
  const [task, setTask] = useState([]);
  const [fee, setFee] = useState(0);
  const [balance, setBalance] = useState(0);
  const [fetchedRating, setFetchedRating] = useState(0);
  const [ipfsUrl, setIpfsUrl] = useState("");

  const notify = (message, hash) =>
    toast.success(<MessageDisplay message={message} hash={hash} />, {
      position: "top-right",
      autoClose: 5000,
      hideProgressBar: false,
      closeOnClick: true,
      pauseOnHover: true,
      draggable: true,
      progress: undefined,
      theme: "dark",
    });

  const onUploadHandler = async (event) => {
    const client = new Web3Storage({
      token: import.meta.env.VITE_WEB3_STORAGE_TOKEN,
    });
    event.preventDefault();
    const form = event.target;
    const { files } = form[0];
    if (!files || files.length === 0) {
      return alert("No files selected");
    }
    setIsLoading(true);
    const rootCid = await client.put(files);
    const info = await client.status(rootCid);
    // const res = await client.get(rootCid);
    const url = `https://${info.cid}.ipfs.w3s.link`;
    form.reset();
    setIpfsUrl(url);
    setIsLoading(false);
    notify("File successfully uploaded to IPFS.");
  };

  const handleChange = (e, name) => {
    setformData((prevState) => ({ ...prevState, [name]: e.target.value }));
  };

  const getBalance = useCallback(async () => {
    if (account.accountId) {
      setBalance(await accountBalance());
    }
  }, [account.accountId]);

  const getPlatformFee = async () => {
    try {
      if (account.accountId) {
        setFee(await window.contract.get_platform_fee_percentage());
      } else {
        console.log("Please login");
      }
    } catch (error) {
      console.log(error);
      alert(error.message);
    }
  };

  const getAccountRating = async (accountToFetch) => {
    try {
      if (account.accountId) {
        setFetchedRating(await window.contract.get_rating({ account_id: accountToFetch }));
      } else {
        console.log("Please login");
      }
    } catch (error) {
      console.log(error);
      alert(error.message);
    }
  };

  const getAllTasks = async () => {
    try {
      if (account.accountId) {
        const availableProjects = await window.contract.get_tasks();
        const structuredProjects = availableProjects
          .filter((item) => item.title && item.title !== "")
          .map((item) => ({
            id: item.id.toNumber(),
            title: item.title,
            description: item.description,
            projectType: TaskType[item.taskType],
            createdAt: new Date(
              item.createdAt.toNumber() * 1000
            ).toLocaleString(),
            author: item.author,
            candidates: item.candidates,
            assignee: !item.assignee ? "Unassigned" : item.assignee,
            completedAt:
              item.completedAt > 0
                ? new Date(item.completedAt.toNumber() * 1000).toLocaleString()
                : "Not completed yet",
            reward: parseInt(item.reward, 10) / 10 ** 18,
            result: item.result,
          }));
        setTasks(structuredProjects);
      } else {
        console.log("Ethereum is not present");
      }
    } catch (error) {
      console.log(error);
      alert(error.message);
    }
  };

  useEffect(() => {
    getBalance();
    getPlatformFee();
    getAccountRating(account.accountId);
    getAllTasks();
  }, [getBalance, getPlatformFee]);

  const getTask = async (id) => {
    setIsLoading(true);
    try {
      if (account.accountId) {
        const fetchedTask = await window.contract.get_task({ task_id: id });
        const structuredTask = {
          id: fetchedTask.id.toNumber(),
          title: fetchedTask.title,
          description: fetchedTask.description,
          projectType: TaskType[fetchedTask.projectType],
          createdAt: new Date(
            fetchedTask.createdAt.toNumber() * 1000
          ).toLocaleString(),
          author: fetchedTask.author,
          candidates: fetchedTask.candidates,
          assignee:
            !fetchedTask.assignee
              ? "Unassigned"
              : fetchedTask.assignee,
          completedAt:
            fetchedTask.completedAt > 0
              ? new Date(
                fetchedTask.completedAt.toNumber() * 1000
              ).toLocaleString()
              : "Not completed yet",
          reward: parseInt(fetchedTask.reward, 10) / 10 ** 18,
          result: fetchedTask.result,
        };
        setTask(structuredTask);
      } else {
        console.log("Please log in");
      }
    } catch (error) {
      console.log(error);
      alert(error.message);
    }
    setIsLoading(false);
  };

  const addNewTask = async () => {
    try {
      if (account.accountId) {
        const { title, description, projectType, reward } = formData;
        const feeAmount = (reward / 100) * fee;
        const totalAmount = parseFloat(reward) + parseFloat(feeAmount);
        const transactionHash = await window.contract.add_task(
          {
            title,
            description,
            projectType,
            reward: parseNearAmount(reward.toString()),
          },
          parseNearAmount(totalAmount.toString()),
        );
        setIsLoading(true);
        console.log(`Loading - ${transactionHash.hash}`);
        await transactionHash.wait();
        console.log(`Success - ${transactionHash.hash}`);
        setIsLoading(false);
        window.location.replace("/");
        notify("New task added.", transactionHash.hash);
      } else {
        console.log("No ethereum object");
      }
    } catch (error) {
      console.log(error);
      alert("Oops! Something went wrong. See the browser console for details.");
    }
  };

  const applyForTask = async (id) => {
    try {
      if (account.accountId) {
        const transactionHash = await window.contract.apply_for_task({ task_id: id });
        setIsLoading(true);
        console.log(`Loading - ${transactionHash.hash}`);
        await transactionHash.wait();
        console.log(`Success - ${transactionHash.hash}`);
        setIsLoading(false);
        await getAllTasks();
        await getTask(id);
        notify("Successfully applied.", transactionHash.hash);
      } else {
        console.log("Please log in");
      }
    } catch (error) {
      console.log(error);
      alert("Oops! Something went wrong. See the browser console for details.");
    }
  };

  const submitResult = async (id, result) => {
    try {
      if (account.accuntId) {
        const transactionHash = await window.contract.submit_result({ task_id: id, result });
        setIsLoading(true);
        console.log(`Loading - ${transactionHash.hash}`);
        await transactionHash.wait();
        console.log(`Success - ${transactionHash.hash}`);
        setIsLoading(false);
        await getAllTasks();
        await getTask(id);
        notify("Result submitted.", transactionHash.hash);
      } else {
        console.log("Plese log in");
      }
    } catch (error) {
      console.log(error);
      alert("Oops! Something went wrong. See the browser console for details.");
    }
  };

  const deleteTask = async (id) => {
    try {
      if (account.accountId) {
        const transactionHash = await window.contract.delete_task({ task_id: id });
        setIsLoading(true);
        console.log(`Loading - ${transactionHash.hash}`);
        await transactionHash.wait();
        console.log(`Success - ${transactionHash.hash}`);
        setIsLoading(false);
        await getAllTasks();
        notify("Task deleted.", transactionHash.hash);
        window.location.replace("/");
      } else {
        console.log("Please log in");
      }
    } catch (error) {
      console.log(error);
      alert("Oops! Something went wrong. See the browser console for details.");
    }
  };

  const assignTask = async (id, candidate) => {
    try {
      if (account.accountId) {
        const transactionHash = await window.contract.assign_task({ task_id: id, candidate_account: candidate });
        setIsLoading(true);
        console.log(`Loading - ${transactionHash.hash}`);
        await transactionHash.wait();
        console.log(`Success - ${transactionHash.hash}`);
        setIsLoading(false);
        await getAllTasks();
        await getTask(id);
        notify("Task assigned.", transactionHash.hash);
      } else {
        console.log("Please log in");
      }
    } catch (error) {
      console.log(error);
      alert("Oops! Something went wrong. See the browser console for details.");
    }
  };

  const unassignTask = async (id) => {
    try {
      if (account.accountId) {
        const transactionHash = await window.contract.unassign_task({ task_id: id });
        setIsLoading(true);
        console.log(`Loading - ${transactionHash.hash}`);
        await transactionHash.wait();
        console.log(`Success - ${transactionHash.hash}`);
        setIsLoading(false);
        await getAllTasks();
        await getTask(id);
        notify("Task unassigned.", transactionHash.hash);
      } else {
        console.log("Please log in");
      }
    } catch (error) {
      console.log(error);
      alert("Oops! Something went wrong. See the browser console for details.");
    }
  };

  const completeTask = async (id, newRating) => {
    try {
      if (account.accountId) {
        const transactionHash = await window.contract.complete_task({ task_id: id, rating: newRating });
        setIsLoading(true);
        console.log(`Loading - ${transactionHash.hash}`);
        await transactionHash.wait();
        console.log(`Success - ${transactionHash.hash}`);
        setIsLoading(false);
        await getAllTasks();
        await getTask(id);
        notify("Task completed.", transactionHash.hash);
      } else {
        console.log("Please log in");
      }
    } catch (error) {
      console.log(error);
      alert("Oops! Something went wrong. See the browser console for details.");
    }
  };

  return (
    <PlatformContext.Provider
      value={{
        fee,
        tasks,
        task,
        account,
        balance,
        isLoading,
        getAllTasks,
        getTask,
        addNewTask,
        applyForTask,
        submitResult,
        deleteTask,
        assignTask,
        unassignTask,
        completeTask,
        handleChange,
        getAccountRating,
        fetchedRating,
        formData,
        onUploadHandler,
        ipfsUrl,
      }}
    >
      {children}
    </PlatformContext.Provider>
  );
};
