use near_sdk::borsh::{self, BorshDeserialize, BorshSerialize};
use near_sdk::collections::{UnorderedMap};
use near_sdk::serde::{Deserialize, Serialize};
use near_sdk::{env, near_bindgen, setup_alloc, AccountId, Promise};
use near_sdk::json_types::U128;

setup_alloc!();

pub const STORAGE_COST: u128 = 1_000_000_000_000_000_000_000;

/// Contract structure is represented here
#[near_bindgen]
#[derive(BorshDeserialize, BorshSerialize)]
pub struct Platform {
  pub tasks: UnorderedMap<u64, Task>,
  pub ratings: UnorderedMap<AccountId, u8>,
  pub platform_fee_percentage: u8,
  total_fees: u128,
  tasks_index: u64,
}

/// Task structure is defined here
#[derive(BorshDeserialize, BorshSerialize, Deserialize, Serialize)]
#[serde(crate = "near_sdk::serde")]
pub struct Task {
  id: u64,
  title: String,
  description: String,
  task_type: String,
  author: AccountId,
  assignee: Option<AccountId>,
  candidates: Vec<AccountId>,
  created_at: u64,
  completed_at: Option<u64>,
  reward: u128,
  result: Option<String>,
}

/// Default implementation of the contract
impl Default for Platform {
  fn default() -> Self {
    Self {
      tasks: UnorderedMap::new(b"t".to_vec()),
      ratings: UnorderedMap::new(b"r".to_vec()),
      platform_fee_percentage: 1,
      total_fees: 0,
      tasks_index: 0,
    }
  }
}

/// Helper functions
fn calculate_rating(prev_rating: u8, new_rating: u8) -> u8 {
  if prev_rating == 0 {
    return new_rating;
  }
  (prev_rating + new_rating) / 2
}


/// The contract implementation
#[near_bindgen]
impl Platform {
  /// Add task
  #[payable]
  pub fn add_task(
    &mut self,
    title: String,
    description: String,
    task_type: String,
    reward: U128,
  ) -> bool {
    assert!(title.len() > 0, "Title is reqired.");
    assert!(description.len() > 0, "Description is required.");
    assert!(
      reward.0 > STORAGE_COST,
      "Attached deposit should be greater than {} yoctoNEAR",
      STORAGE_COST
    );
    let platform_fee = (reward.0 / 100) * u128::from(self.platform_fee_percentage);
    let total_amount = reward.0 + platform_fee;
    assert!(
      total_amount == env::attached_deposit(),
      "Invalid amount attached. {} yoctoNEAR needed",
      total_amount
    );
    let id = self.tasks_index;
    self.tasks_index += 1;
    let new_task = Task {
      id: id,
      title: title,
      description: description,
      task_type: task_type,
      author: env::predecessor_account_id(),
      created_at: env::block_timestamp(),
      assignee: None,
      candidates: Vec::new(),
      reward: reward.0,
      completed_at: None,
      result: None,
    };
    env::log(format!("Adding task with id {} ", id).as_bytes());
    self.tasks.insert(&id, &new_task);
    self.total_fees += platform_fee;
    true
  }

  /// Assign task
  pub fn assign_task(&mut self, task_id: u64, candidate_account: AccountId) -> bool {
    assert!(
      self.tasks.get(&task_id).is_some(),
      "Task with id {} not found.",
      &task_id
    );
    let task = self.tasks.get(&task_id).unwrap();
    assert!(
      env::predecessor_account_id() == task.author,
      "You are not permitted to perform this action"
    );
    assert!(task.assignee.is_none(), "The task is already assigned");
    let mut is_account_applied = false;
    for i in 0..task.candidates.len() {
      if task.candidates.get(i).unwrap() == &candidate_account {
        is_account_applied = true;
      }
    }
    assert!(is_account_applied, "The account did not apply to this task");
    let updated_task = Task {
      assignee: Some(candidate_account),
      ..task
    };
    self.tasks.insert(&task_id, &updated_task);
    env::log(format!("Task {} assigned", task_id).as_bytes());
    true
  }

  /// Unassign task
  pub fn unassign_task(&mut self, task_id: u64) -> bool {
    assert!(
      self.tasks.get(&task_id).is_some(),
      "Task with id {} not found.",
      &task_id
    );
    let task = self.tasks.get(&task_id).unwrap();
    assert!(
      env::predecessor_account_id() == task.author,
      "You are not permitted to perform this action"
    );
    assert!(task.assignee.is_some(), "The task not assigned yet");
    let updated_task = Task {
      assignee: None,
      ..task
    };
    self.tasks.insert(&task_id, &updated_task);
    env::log(format!("Task {} unassigned", task_id).as_bytes());
    true
  }

  /// Apply for task
  pub fn apply_for_task(&mut self, task_id: u64) -> bool {
    assert!(
      self.tasks.get(&task_id).is_some(),
      "Task with id {} not found.",
      &task_id
    );
    let task = self.tasks.get(&task_id).unwrap();
    assert!(task.assignee.is_none(), "The task is already assigned");
    let account = env::predecessor_account_id();
    if task.task_type == "FCFS" {
      let updated_task = Task {
        assignee: Some(account),
        ..task
      };
      self.tasks.insert(&task_id, &updated_task);
    } else if task.task_type == "SelectedByAuthor" {
      let mut candidates = task.candidates;
      candidates.push(account);
      let updated_task = Task {
        candidates: candidates,
        ..task
      };
      self.tasks.insert(&task_id, &updated_task);
    } else {
      panic!("Invalid task type!");
    }
    env::log(
      format!(
        "Account {} applied for {}",
        env::predecessor_account_id(),
        task_id
      )
      .as_bytes(),
    );
    true
  }

  /// Submit result
  pub fn submit_result(&mut self, task_id: u64, result: String) -> bool {
    assert!(
      self.tasks.get(&task_id).is_some(),
      "Task with id {} not found.",
      &task_id
    );
    let task = self.tasks.get(&task_id).unwrap();
    assert!(
      task.assignee == Some(env::predecessor_account_id()),
      "Only assignee can perform this action."
    );
    assert!(
      task.result.is_none(),
      "Result for this task already submitted."
    );
    assert!(result.len() > 0, "Result cannot be empty.");
    let updated_task = Task {
      result: Some(result),
      ..task
    };
    self.tasks.insert(&task_id, &updated_task);
    env::log(format!("Result submitted for task id {}", task_id).as_bytes());
    true
  }

  /// Complete task
  pub fn complete_task(&mut self, task_id: u64, rating: u8) -> bool {
    assert!(
      self.tasks.get(&task_id).is_some(),
      "Task with id {} not found.",
      &task_id
    );
    let task = self.tasks.get(&task_id).unwrap();
    assert!(
      env::predecessor_account_id() == task.author,
      "You are not permitted to perform this action."
    );
    assert!(task.result.is_some(), "Result is not submitted yet.");
    assert!(task.completed_at.is_none(), "The task already completed.");
    assert!(rating <= 5, "Rating is invalid.");
    let updated_task = Task {
      completed_at: Some(env::block_timestamp()),
      ..task
    };
    self.tasks.insert(&task_id, &updated_task);
    let assignee = self.tasks.get(&task_id).unwrap().assignee.unwrap();
    let new_rating = calculate_rating(self.ratings.get(&assignee).unwrap_or(0), rating);
    self.ratings.insert(&assignee, &new_rating);
    Promise::new(assignee).transfer(task.reward);
    env::log(format!("Task with id {} completed", task_id).as_bytes());
    true
  }

  /// Delete task
  pub fn delete_task(&mut self, task_id: u64) -> bool {
    assert!(
      self.tasks.get(&task_id).is_some(),
      "Task with id {} not found.",
      &task_id
    );
    let task = self.tasks.get(&task_id).unwrap();
    assert!(
      env::predecessor_account_id() == task.author,
      "You are not permitted to perform this action."
    );
    assert!(task.assignee.is_none(), "Cannot delete assigned task.");
    Promise::new(task.author).transfer(task.reward);
    self.tasks.remove(&task_id);
    env::log(format!("Task with id {} deleted", task_id).as_bytes());
    true
  }

  /// Set platform fee percentage
  pub fn set_platform_fee_percentage(&mut self, fee: u8) -> bool {
    assert!(
      env::predecessor_account_id() == env::current_account_id(),
      "You are not permitted to perform this action."
    );
    assert!(fee < 100, "Fee percentage cannot be greater than 100.");
    self.platform_fee_percentage = fee;
    env::log(format!("Platform fee percentage updated to {} %", fee).as_bytes());
    true
  }

  /// Withdraw fees
  pub fn withdraw_fees(&mut self, receiver: AccountId) -> bool {
    assert!(
      env::predecessor_account_id() == env::current_account_id(),
      "You are not permitted to perform this action."
    );
    assert!(
      self.total_fees > STORAGE_COST,
      "Fees amount is too low."
    );
    let amount = self.total_fees - STORAGE_COST;
    Promise::new(receiver).transfer(amount);
    self.total_fees -= amount;
    true
  }

  /// Getters

  /// Returns all tasks
  pub fn get_tasks(&self) -> Vec<(u64, Task)> {
    self.tasks.iter().collect()
  }

  /// Returns a task by id
  pub fn get_task(&self, task_id: u64) -> Task {
    assert!(
      self.tasks.get(&task_id).is_some(),
      "Task with id {} not found.",
      &task_id
    );
    self.tasks.get(&task_id).unwrap()
  }

  /// Returns platform fee percentage
  pub fn get_platform_fee_percentage(&self) -> u8 {
    self.platform_fee_percentage
  }

  /// Returns rating by account id
  pub fn get_rating(&self, account_id: AccountId) -> u8 {
    self.ratings.get(&account_id).unwrap_or(0)
  }

}

#[cfg(test)]
mod tests {
  use super::*;
  use near_sdk::MockedBlockchain;
  use near_sdk::{testing_env, VMContext};

  fn get_context(input: Vec<u8>, is_view: bool) -> VMContext {
    VMContext {
      current_account_id: "alice_near".to_string(),
      signer_account_id: "bob_near".to_string(),
      signer_account_pk: vec![0, 1, 2],
      predecessor_account_id: "sam_near".to_string(),
      input,
      block_index: 0,
      block_timestamp: 0,
      account_balance: 0,
      account_locked_balance: 0,
      storage_usage: 0,
      attached_deposit: 10_100_000_000_000_000_000_000,
      prepaid_gas: 10u64.pow(18),
      random_seed: vec![0, 1, 2],
      is_view,
      output_data_receivers: vec![],
      epoch_height: 19,
    }
  }

  #[test]
  fn add_then_get_task() {
    let context = get_context(vec![], false);
    testing_env!(context);
    let mut contract = Platform::default();
    let add = contract.add_task(
      "title".to_string(),
      "description".to_string(),
      "type".to_string(),
      U128::from(10000000000000000000000),
    );
    let tasks = contract.get_tasks();
    assert!(add);
    assert_eq!(1, tasks.len());
    let task = contract.get_task(0);
    assert_eq!("title".to_string(), task.title);
    assert_eq!("description".to_string(), task.description);
    assert_eq!("type".to_string(), task.task_type);
    assert_eq!("sam_near".to_string(), task.author);
    let fees = contract.total_fees;
    assert_eq!(fees, 1_00_000_000_000_000_000_000);
  }

  #[test]
  #[should_panic(expected = "Title is reqired.")]
  fn title_is_empty() {
    let context = get_context(vec![], false);
    testing_env!(context);
    let mut contract = Platform::default();
    contract.add_task(
      "".to_string(),
      "description".to_string(),
      "type".to_string(),
      U128::from(10000000000000000000000),
    );
  }

  #[test]
  #[should_panic(expected = "Description is required.")]
  fn description_is_empty() {
    let context = get_context(vec![], false);
    testing_env!(context);
    let mut contract = Platform::default();
    contract.add_task(
      "title".to_string(),
      "".to_string(),
      "type".to_string(),
      U128::from(10000000000000000000000),
    );
  }

  #[test]
  fn get_all_tasks() {
    let context = get_context(vec![], false);
    testing_env!(context);
    let mut contract = Platform::default();
    contract.add_task(
      "title1".to_string(),
      "description1".to_string(),
      "SelectedByAuthor".to_string(),
      U128::from(10000000000000000000000),
    );
    contract.add_task(
      "title2".to_string(),
      "description2".to_string(),
      "FCFS".to_string(),
      U128::from(10000000000000000000000),
    );
    let tasks = contract.get_tasks();
    assert_eq!(2, tasks.len());
  }

  #[test]
  fn assign_task() {
    let context = get_context(vec![], false);
    testing_env!(context);
    let mut contract = Platform::default();
    contract.add_task(
      "title".to_string(),
      "description".to_string(),
      "SelectedByAuthor".to_string(),
      U128::from(10000000000000000000000),
    );
    contract.apply_for_task(0);
    let assign = contract.assign_task(0, "sam_near".to_string());
    assert!(assign);
    let task = contract.get_task(0);
    assert_eq!("sam_near".to_string(), task.assignee.unwrap());
  }

  #[test]
  fn unassign_task() {
    let context = get_context(vec![], false);
    testing_env!(context);
    let mut contract = Platform::default();
    contract.add_task(
      "title".to_string(),
      "description".to_string(),
      "SelectedByAuthor".to_string(),
      U128::from(10000000000000000000000),
    );
    contract.apply_for_task(0);
    contract.assign_task(0, "sam_near".to_string());
    let unassign = contract.unassign_task(0);
    assert!(unassign);
    let task = contract.get_task(0);
    assert!(task.assignee.is_none());
  }

  #[test]
  fn apply_for_fcfs_task() {
    let context = get_context(vec![], false);
    testing_env!(context);
    let mut contract = Platform::default();
    contract.add_task(
      "title".to_string(),
      "description".to_string(),
      "FCFS".to_string(),
      U128::from(10000000000000000000000),
    );
    let apply = contract.apply_for_task(0);
    assert!(apply);
    let task = contract.get_task(0);
    assert_eq!("sam_near".to_string(), task.assignee.unwrap());
  }

  #[test]
  fn apply_for_selected_by_author_task() {
    let context = get_context(vec![], false);
    testing_env!(context);
    let mut contract = Platform::default();
    contract.add_task(
      "title".to_string(),
      "description".to_string(),
      "SelectedByAuthor".to_string(),
      U128::from(10000000000000000000000),
    );
    let task = contract.get_task(0);
    assert_eq!(task.candidates.len(), 0);
    let apply = contract.apply_for_task(0);
    assert!(apply);
    let task = contract.get_task(0);
    assert!(task.assignee.is_none());
    assert_eq!(task.candidates.len(), 1);
  }

  #[test]
  fn submit_result() {
    let context = get_context(vec![], false);
    testing_env!(context);
    let mut contract = Platform::default();
    contract.add_task(
      "title".to_string(),
      "description".to_string(),
      "FCFS".to_string(),
      U128::from(10000000000000000000000),
    );
    contract.apply_for_task(0);
    let submit = contract.submit_result(0, "result".to_string());
    assert!(submit);
    let task = contract.get_task(0);
    assert_eq!("result".to_string(), task.result.unwrap());
  }

  #[test]
  fn complete_task() {
    let context = get_context(vec![], false);
    testing_env!(context);
    let mut contract = Platform::default();
    contract.add_task(
      "title".to_string(),
      "description".to_string(),
      "FCFS".to_string(),
      U128::from(10000000000000000000000),
    );
    contract.apply_for_task(0);
    contract.submit_result(0, "result".to_string());
    let complete = contract.complete_task(0, 5);
    assert!(complete);
    let task = contract.get_task(0);
    assert!(task.completed_at.is_some());
    assert_eq!(Some(5), contract.ratings.get(&task.assignee.unwrap()));
  }

  #[test]
  fn set_platform_fee_percentage() {
    let mut context = get_context(vec![], false);
    context.predecessor_account_id = "alice_near".to_string();
    testing_env!(context);
    let mut contract = Platform::default();
    let update = contract.set_platform_fee_percentage(3);
    assert!(update);
    assert_eq!(3, contract.platform_fee_percentage);
  }

  #[test]
  fn get_platform_fee_percentage() {
    let context = get_context(vec![], false);
    testing_env!(context);
    let contract = Platform::default();
    let get = contract.get_platform_fee_percentage();
    assert_eq!(1, get);
  }

  #[test]
  #[should_panic(expected="You are not permitted to perform this action.")]
  fn cannot_change_platform_fee_percentage_if_not_owner() {
    let context = get_context(vec![], false);
    testing_env!(context);
    let mut contract = Platform::default();
    contract.set_platform_fee_percentage(30);
  }

  #[test]
  fn withdraw_fees() {
    let mut context = get_context(vec![], false);
    context.predecessor_account_id = "alice_near".to_string();
    context.attached_deposit = 1_010_000_000_000_000_000_000_000;
    testing_env!(context);
    let mut contract = Platform::default();
    contract.add_task(
      "title".to_string(),
      "description".to_string(),
      "FCFS".to_string(),
      U128::from(1000000000000000000000000),
    );
    let withdraw = contract.withdraw_fees("test_near".to_string());
    assert!(withdraw);
    assert_eq!(1_000_000_000_000_000_000_000, contract.total_fees);
  }

  #[test]
  #[should_panic(expected="You are not permitted to perform this action.")]
  fn cannot_withdraw_fees_if_not_owner() {
    let context = get_context(vec![], false);
    testing_env!(context);
    let mut contract = Platform::default();
    contract.add_task(
      "title".to_string(),
      "description".to_string(),
      "FCFS".to_string(),
      U128::from(10000000000000000000000),
    );
    contract.withdraw_fees("test_near".to_string());
  }

  #[test]
  fn get_rating_if_unrated() {
    let context = get_context(vec![], false);
    testing_env!(context);
    let contract = Platform::default();
    let rating = contract.get_rating("test.near".to_string());
    assert_eq!(0, rating);
  }
  #[test]
  fn get_rating_if_rated() {
    let context = get_context(vec![], false);
    testing_env!(context);
    let mut contract = Platform::default();
    contract.add_task(
      "title".to_string(),
      "description".to_string(),
      "FCFS".to_string(),
      U128::from(10000000000000000000000),
    );
    contract.apply_for_task(0);
    contract.submit_result(0, "result".to_string());
    contract.complete_task(0, 5);
    let rating = contract.get_rating("sam_near".to_string());
    assert_eq!(5, rating);
  }
}
