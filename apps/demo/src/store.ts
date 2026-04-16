import { useState, useCallback } from 'react';
import { INITIAL_TASKS, type Task, type Comment, type Attachment } from './data';

export function useTaskStore() {
  const [tasks, setTasks] = useState<Task[]>(() => structuredClone(INITIAL_TASKS));

  const getTask = useCallback((id: number) => tasks.find((t) => t.id === id), [tasks]);

  const addTask = useCallback((task: Omit<Task, 'id' | 'createdAt' | 'comments'>) => {
    setTasks((prev) => [
      ...prev,
      {
        ...task,
        id: Math.max(0, ...prev.map((t) => t.id)) + 1,
        createdAt: new Date().toISOString(),
        comments: [],
      },
    ]);
  }, []);

  const updateTask = useCallback((id: number, patch: Partial<Task>) => {
    setTasks((prev) => prev.map((t) => (t.id === id ? { ...t, ...patch } : t)));
  }, []);

  const addComment = useCallback((taskId: number, comment: Omit<Comment, 'id' | 'createdAt'>) => {
    setTasks((prev) =>
      prev.map((t) =>
        t.id === taskId
          ? {
              ...t,
              comments: [
                ...t.comments,
                {
                  ...comment,
                  id: Math.floor(Math.random() * 100000),
                  createdAt: new Date().toISOString(),
                },
              ],
            }
          : t
      )
    );
  }, []);

  const addAttachment = useCallback((taskId: number, attachment: Omit<Attachment, 'id'>) => {
    setTasks((prev) =>
      prev.map((t) =>
        t.id === taskId
          ? {
              ...t,
              attachments: [
                ...t.attachments,
                { ...attachment, id: Math.floor(Math.random() * 100000) },
              ],
            }
          : t
      )
    );
  }, []);

  const stats = {
    total: tasks.length,
    open: tasks.filter((t) => t.status === 'open').length,
    inProgress: tasks.filter((t) => t.status === 'in-progress').length,
    review: tasks.filter((t) => t.status === 'review').length,
    done: tasks.filter((t) => t.status === 'done').length,
    unassigned: tasks.filter((t) => !t.assignee).length,
    highPriority: tasks.filter((t) => t.priority === 'high' && t.status !== 'done').length,
  };

  return { tasks, getTask, addTask, updateTask, addComment, addAttachment, stats };
}
