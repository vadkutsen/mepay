import { v4 as uuid4 } from "uuid";
import { parseNearAmount } from "near-api-js/lib/utils/format";

const GAS = 100000000000000;

export function createProject(project) {
  project.id = uuid4();
  project.price = parseNearAmount(project.price + "");
  return window.contract.setProject({ project });
}

export function getProjects() {
  return window.contract.getProjects();
}

export async function addCandidate({ id }) {
  await window.contract.applyForProject({ projectId: id });
}

export async function completeProject({ id, resultLink }) {
  await window.contract.completeProject({ projectId: id, result: resultLink });
}

export async function approve({ id, amount }) {
  await window.contract.payForProject({ projectId: id}, GAS, amount);
}