const TASK_STATUS_OPTIONS = ['TODO', 'IN_PROGRESS', 'COMPLETED'];
const TASK_PRIORITY_OPTIONS = ['LOW', 'MEDIUM', 'HIGH'];
const MILESTONE_STATUS_OPTIONS = ['PLANNED', 'IN_PROGRESS', 'COMPLETED'];

const getTaskDueState = (task, referenceDate = new Date()) => {
  if (!task || !task.dueDate) return 'normal';

  if (task.status === 'COMPLETED') return 'normal';

  const dueDate = new Date(task.dueDate);
  const today = new Date(referenceDate);
  today.setHours(0, 0, 0, 0);
  dueDate.setHours(0, 0, 0, 0);

  const diffMillis = dueDate.getTime() - today.getTime();
  const differenceInDays = Math.ceil(diffMillis / (1000 * 60 * 60 * 24));

  if (dueDate < today) return 'overdue';
  if (differenceInDays <= 7) return 'dueSoon';

  return 'normal';
};

module.exports = {
  TASK_STATUS_OPTIONS,
  TASK_PRIORITY_OPTIONS,
  MILESTONE_STATUS_OPTIONS,
  getTaskDueState,
};
