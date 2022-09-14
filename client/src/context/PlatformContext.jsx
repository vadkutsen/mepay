import React, { useEffect, useState, useCallback } from "react";
import { toast } from "react-toastify";
import { parseNearAmount, formatNearAmount } from "near-api-js/lib/utils/format";
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
  const GAS = 300000000000000;
  const account = window.walletConnection.account();
  const [formData, setformData] = useState({
    title: "",
    description: "",
    taskType: "FCFS",
    reward: 0,
  });
  const [isLoading, setIsLoading] = useState(false);
  const [tasks, setTasks] = useState([]);
  const [task, setTask] = useState([]);
  const [fee, setFee] = useState(0);
  const [balance, setBalance] = useState(0);
  const [fetchedRating, setFetchedRating] = useState(0);
  const [ipfsUrl, setIpfsUrl] = useState("");

  const notify = (message, hash) => toast.success(<MessageDisplay message={message} hash={hash} />, {
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
      // alert(error.message);
    }
  };

  const getAccountRating = async (accountToFetch) => {
    try {
      if (account.accountId) {
        setFetchedRating(
          await window.contract.get_rating({ account_id: accountToFetch })
        );
      } else {
        console.log("Please login");
      }
    } catch (error) {
      console.log(error);
      // alert(error.message);
    }
  };

  const getAllTasks = async () => {
    try {
      if (account.accountId) {
        const existingTasks = await window.contract.get_tasks();
        const structuredTasks = existingTasks
          .map((item) => ({
            id: item[1].id,
            title: item[1].title,
            description: item[1].description,
            projectType: TaskType[item[1].task_type],
            createdAt: new Date(
              item[1].created_at / 1000000
            ).toLocaleString(),
            author: item[1].author,
            candidates: item[1].candidates,
            assignee: !item[1].assignee ? "Unassigned" : item[1].assignee,
            completedAt:
              item[1].completed_at > 0
                ? new Date(item[1].completed_at / 1000000).toLocaleString()
                : "Not completed yet",
            reward: (item[1].reward / 1000000000000000000000000).toFixed(2),
            result: item[1].result,
          }));
        setTasks(structuredTasks);
      } else {
        console.log("Please log in");
      }
    } catch (error) {
      console.log(error);
      // alert(error.message);
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
        const fetchedTask = await window.contract.get_task({ task_id: Number(id) });
        const structuredTask = {
          id: fetchedTask.id,
          title: fetchedTask.title,
          description: fetchedTask.description,
          taskType: TaskType[fetchedTask.task_type],
          createdAt: new Date(
            fetchedTask.created_at / 1000000
          ).toLocaleString(),
          author: fetchedTask.author,
          candidates: fetchedTask.candidates,
          assignee: !fetchedTask.assignee ? "Unassigned" : fetchedTask.assignee,
          completedAt:
            fetchedTask.completed_at > 0
              ? new Date(
                fetchedTask.completed_at / 1000000
              ).toLocaleString()
              : "Not completed yet",
          reward: (fetchedTask.reward / 1000000000000000000000000).toFixed(2),
          result: fetchedTask.result,
        };
        setTask(structuredTask);
      } else {
        console.log("Please log in");
      }
    } catch (error) {
      console.log(error);
      // alert(error.message);
    }
    setIsLoading(false);
  };

  const addNewTask = async () => {
    try {
      if (account.accountId) {
        const { title, description, taskType, reward } = formData;
        const feeAmount = (reward / 100) * fee;
        const totalAmount = parseFloat(formData.reward) + parseFloat(feeAmount);
        const transaction = await window.contract.add_task(
          {
            title,
            description,
            task_type: taskType,
            reward: parseNearAmount(reward.toString())
          },
          GAS,
          parseNearAmount(totalAmount.toString())
        );
        setIsLoading(true);
        await transaction();
        setIsLoading(false);
        window.location.replace("/");
        notify("New task added.", transaction.hash);
      } else {
        console.log("Please log in");
      }
    } catch (error) {
      console.log(error);
      alert("Oops! Something went wrong. See the browser console for details.");
    }
  };

  const applyForTask = async (id) => {
    try {
      if (account.accountId) {
        const transaction = await window.contract.apply_for_task({
          task_id: id,
        });
        setIsLoading(true);
        await transaction();
        setIsLoading(false);
        await getAllTasks();
        await getTask(id);
        notify("Successfully applied.", transaction.hash);
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
        const transaction = await window.contract.submit_result({
          task_id: id,
          result,
        });
        setIsLoading(true);
        await transaction();
        setIsLoading(false);
        await getAllTasks();
        await getTask(id);
        notify("Result submitted.", transaction.hash);
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
        setIsLoading(true);
        const transaction = await window.contract.delete_task({
          task_id: id,
        });
        await transaction();
        setIsLoading(false);
        await getAllTasks();
        notify("Task deleted.", transaction.hash);
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
        const transaction = await window.contract.assign_task({
          task_id: id,
          candidate_account: candidate,
        });
        setIsLoading(true);
        await transaction.wait();
        setIsLoading(false);
        await getAllTasks();
        await getTask(id);
        notify("Task assigned.", transaction.hash);
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
        const transaction = await window.contract.unassign_task({
          task_id: id,
        });
        setIsLoading(true);
        await transaction();
        setIsLoading(false);
        await getAllTasks();
        await getTask(id);
        notify("Task unassigned.", transaction.hash);
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
        const transaction = await window.contract.complete_task({
          task_id: id,
          rating: newRating,
        });
        setIsLoading(true);
        await transaction();
        setIsLoading(false);
        await getAllTasks();
        await getTask(id);
        notify("Task completed.", transaction.hash);
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
