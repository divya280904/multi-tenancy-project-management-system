export const getTaskDueState = (task, referenceDate = new Date()) => {
  if (!task || !task.dueDate) return 'normal';
  if (task.status === 'COMPLETED') return 'normal';

  const dueDate = new Date(task.dueDate);
  const today = new Date(referenceDate);
  today.setHours(0, 0, 0, 0);
  dueDate.setHours(0, 0, 0, 0);

  const daysUntilDue = Math.ceil((dueDate - today) / (1000 * 60 * 60 * 24));

  if (dueDate < today) return 'overdue';
  if (daysUntilDue <= 7) return 'dueSoon';

  return 'normal';
};

export const getDueStateBadge = (task) => {
  const state = getTaskDueState(task);
  const styles = {
    overdue: 'bg-red-100 text-red-700',
    dueSoon: 'bg-yellow-100 text-yellow-700',
    normal: 'bg-gray-100 text-gray-700'
  };

  const labels = {
    overdue: 'Overdue',
    dueSoon: 'Due soon',
    normal: 'Normal'
  };

  return <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${styles[state]}`}>{labels[state]}</span>;
};
