import { useContext } from "react";
import { PlatformContext } from "../context/PlatformContext";
import AuthorActions from "./AuthorActions";
import AssigneeActions from "./AssigneeActions";
import CandidateActions from "./CandidateActions";

const ActionButton = (params) => {
  const { account, applyForTask } =
    useContext(PlatformContext);
  const current = account.accountId;
  const isCandidate = (address) => {
    for (let i = 0; i < params.task.candidates.length; i++) {
      if (params.task.candidates[i].candidate === address) {
        return true;
      }
    }
    return false;
  };
  let button;
  if (params.task.author === current) {
    button = <AuthorActions />;
  } else if (params.task.assignee !== "Unassigned" && params.task.assignee !== current) {
    button = <p />;
  } else if (params.task.assignee === current) {
    button = <AssigneeActions />;
  } else if (isCandidate(current)) {
    button = <CandidateActions />;
  } else {
    button = (
      <div>
        <button
          type="button"
          onClick={() => applyForTask(params.task.id)}
          className="flex flex-row justify-center items-center my-5 bg-[#2952e3] p-3 w-1/6 text-white rounded-full cursor-pointer hover:bg-[#2546bd]"
        >
          Apply
        </button>
      </div>
    );
  }
  return button;
};

export default ActionButton;
