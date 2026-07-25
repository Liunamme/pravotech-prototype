import type { StateCreator } from 'zustand';
import type { BackgroundTask, Id, TaskResultRef } from '@/types/domain';
import type { StoreState } from './index';

export type TasksSlice = {
  tasks: Record<Id, BackgroundTask>;

  /** Кладёт задачу в стор (её начальное состояние задаёт вызывающий код). */
  startTask: (task: BackgroundTask) => void;
  /** Шаг `index` становится активным, предыдущие незавершённые шаги — done. */
  taskStep: (id: Id, index: number, label: string) => void;
  taskProgress: (id: Id, done: number, total: number) => void;
  finishTask: (id: Id, resultRef?: TaskResultRef) => void;
  failTask: (id: Id, message: string) => void;
  cancelTask: (id: Id) => void;
  /** Убирает задачу из трея (после того как тост с результатом показан). */
  dismissTask: (id: Id) => void;
};

export const createTasksSlice: StateCreator<StoreState, [], [], TasksSlice> = (set) => ({
  tasks: {},

  startTask: (task) => set((state) => ({ tasks: { ...state.tasks, [task.id]: task } })),

  taskStep: (id, index, label) =>
    set((state) => {
      const task = state.tasks[id];
      if (!task) return state;

      const steps = task.steps.map((step, i) => {
        if (i === index) return { ...step, label, state: 'active' as const };
        if (i < index && step.state !== 'done' && step.state !== 'failed') {
          return { ...step, state: 'done' as const };
        }
        return step;
      });

      return { tasks: { ...state.tasks, [id]: { ...task, steps, state: 'running' } } };
    }),

  taskProgress: (id, done, total) =>
    set((state) => {
      const task = state.tasks[id];
      if (!task) return state;
      return {
        tasks: { ...state.tasks, [id]: { ...task, progress: { done, total }, state: 'running' } },
      };
    }),

  finishTask: (id, resultRef) =>
    set((state) => {
      const task = state.tasks[id];
      if (!task) return state;
      return {
        tasks: {
          ...state.tasks,
          [id]: {
            ...task,
            state: 'succeeded',
            finishedAt: new Date().toISOString(),
            resultRef: resultRef ?? task.resultRef,
          },
        },
      };
    }),

  failTask: (id, message) =>
    set((state) => {
      const task = state.tasks[id];
      if (!task) return state;
      return {
        tasks: {
          ...state.tasks,
          [id]: { ...task, state: 'failed', error: message, finishedAt: new Date().toISOString() },
        },
      };
    }),

  cancelTask: (id) =>
    set((state) => {
      const task = state.tasks[id];
      if (!task) return state;
      return {
        tasks: {
          ...state.tasks,
          [id]: { ...task, state: 'cancelled', finishedAt: new Date().toISOString() },
        },
      };
    }),

  dismissTask: (id) =>
    set((state) => {
      if (!(id in state.tasks)) return state;
      const tasks = { ...state.tasks };
      delete tasks[id];
      return { tasks };
    }),
});
