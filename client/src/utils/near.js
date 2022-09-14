import { connect, Contract, keyStores, WalletConnection } from "near-api-js";
import { formatNearAmount } from "near-api-js/lib/utils/format";
import environment from "./config";

const nearEnv = environment("testnet");

export async function initializeContract() {
  const near = await connect(
    Object.assign(
      { deps: { keyStore: new keyStores.BrowserLocalStorageKeyStore() } },
      nearEnv
    )
  );
  window.walletConnection = new WalletConnection(near);
  window.accountId = window.walletConnection.getAccountId();
  window.contract = new Contract(
    window.walletConnection.account(),
    nearEnv.contractName,
    {
      viewMethods: ["get_task", "get_tasks", "get_platform_fee_percentage", "get_rating"],
      changeMethods: ["apply_for_task", "add_task", "assign_task", "unassign_task", "complete_task", "submit_result", "delete_task"],
    }
  );
}

export async function accountBalance() {
  return formatNearAmount(
    (await window.walletConnection.account().getAccountBalance()).total,
    2
  );
}

export async function getAccountId() {
  return window.walletConnection.getAccountId();
}

export function login() {
  window.walletConnection.requestSignIn(nearEnv.contractName);
}

export function logout() {
  window.walletConnection.signOut();
  window.location.reload();
}
