// import { v4 as uuid4 } from "uuid";
import { parseNearAmount } from "near-api-js/lib/utils/format";

export async function getPlatformFeePercentage() {
  await window.contract.get_platform_fee_percentage();
}

export async function getRating(account) {
  await window.contract.get_rating({ account_id: account });
}

export async function addTask(task) {
  // eslint-disable-next-line no-param-reassign
  task.reward = parseNearAmount(task.reward.toString());
  await window.contract.addTask({ task });
}

export function getTasks() {
  return window.contract.get_tasks();
}

export function getTask(id) {
  return window.contract.get_task({ task_id: id });
}

export async function applyForTask(id) {
  await window.contract.apply_for_task({ task_id: id });
}

export async function completeTask(id) {
  await window.contract.complete_task({ task_: id });
}

export async function assignTask({ id, account }) {
  await window.contract.assign_task({ task_id: id, candidate_account: account });
}

export async function unassignTask(id) {
  await window.contract.assign_task({ task_id: id });
}

export async function submitResult({ id, result }) {
  await window.contract.submit_result({ task_id: id, result });
}
