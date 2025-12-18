import type { LimitFunction } from 'p-limit';
import { debounce } from 'lodash-es';
import pLimit from 'p-limit';

interface Task {
  id: number;
  regex: string;
  watchPath: string | null;
}

export interface EvaluatorTask {
  id: number;
  regex: string;
  watchPath: string | null;
  completed: boolean;
}

export interface Evaluator {
  bufferShell: (data: string) => void;
  bufferExec: (data: string) => void;
  onComplete: (handler: (ids: number[]) => Promise<void> | void) => void;
  onError: (handler: (error: unknown) => Promise<void> | void) => void;
  reset: () => void;
  dispose: () => void;
}

export class EvaluatorImpl implements Evaluator {
  private static readonly CONCURRENCY_LIMIT = 1;
  private static readonly DEBOUNCE_TIMEOUT = 250;
  private static readonly MAX_BUFFER_SIZE = 4096;

  private readonly shellTasks: Task[];
  private readonly execTasks: Task[];
  private readonly completedTasks: Set<number> = new Set();
  private readonly inflight: Set<Task> = new Set();
  private readonly regexCache: Map<number, RegExp> = new Map();
  private readonly concurrencyLimit: LimitFunction;
  private readonly debouncedEvaluate: ReturnType<typeof debounce>;

  private shellBuffer = '';
  private execBuffer = '';
  private onCompleteHandler?: (ids: number[]) => Promise<void> | void;
  private onErrorHandler?: (error: unknown) => Promise<void> | void;

  constructor(tasks: EvaluatorTask[]) {
    this.concurrencyLimit = pLimit(EvaluatorImpl.CONCURRENCY_LIMIT);
    this.shellTasks = tasks.filter(task => task.watchPath === null);
    this.execTasks = tasks.filter(task => task.watchPath !== null);

    this.debouncedEvaluate = debounce(() => {
      void this.withConcurrencyLimit(() => this.evaluate(this.shellBuffer, 'shell'))
        .catch(() => undefined);
    }, EvaluatorImpl.DEBOUNCE_TIMEOUT);

    tasks.forEach((task) => {
      try {
        if (task.completed) {
          this.completedTasks.add(task.id);
        }

        this.regexCache.set(task.id, new RegExp(task.regex));
      }
      catch (error) {
        throw new Error(`Invalid task regex (taskId=${task.id})`, { cause: error });
      }
    });
  }

  bufferShell(data: string) {
    this.shellBuffer += data;

    if (this.shellBuffer.length > EvaluatorImpl.MAX_BUFFER_SIZE) {
      this.shellBuffer = this.shellBuffer.slice(-EvaluatorImpl.MAX_BUFFER_SIZE);
    }

    if (data.includes('\n')) {
      this.debouncedEvaluate();
    }
  }

  bufferExec(data: string) {
    this.execBuffer += data;

    const parts = this.execBuffer.split('\n');
    this.execBuffer = parts.pop() ?? '';

    for (const part of parts) {
      void this.withConcurrencyLimit(() => this.evaluate(part.trimEnd(), 'exec'))
        .catch(() => undefined);
    }
  }

  onComplete(handler: (ids: number[]) => Promise<void> | void) {
    this.onCompleteHandler = handler;
  }

  onError(handler: (error: unknown) => Promise<void> | void) {
    this.onErrorHandler = handler;
  }

  reset() {
    this.shellBuffer = '';
    this.execBuffer = '';

    this.inflight.clear();
    this.completedTasks.clear();
    this.debouncedEvaluate.cancel();
    this.concurrencyLimit.clearQueue();
  }

  dispose() {
    this.shellTasks.length = 0;
    this.execTasks.length = 0;

    this.shellBuffer = '';
    this.execBuffer = '';

    this.inflight.clear();
    this.regexCache.clear();
    this.completedTasks.clear();
    this.debouncedEvaluate.cancel();
    this.concurrencyLimit.clearQueue();
    this.onCompleteHandler = undefined;
    this.onErrorHandler = undefined;
  }

  private async evaluate(data: string, type: 'shell' | 'exec') {
    const tasks = type === 'shell' ? this.shellTasks : this.execTasks;
    if (tasks.length === 0) {
      return;
    }

    const completed = tasks.filter((task) => {
      if (this.completedTasks.has(task.id) || this.inflight.has(task)) {
        return false;
      }

      const regex = this.regexCache.get(task.id);
      return regex?.test(data);
    });

    if (!this.onCompleteHandler || completed.length === 0) {
      return;
    }

    const completedIds = completed.map(task => task.id);
    completed.forEach(task => this.inflight.add(task));

    try {
      await this.onCompleteHandler(completedIds);
      completed.forEach(task => this.completedTasks.add(task.id));
    }
    catch (error) {
      if (this.onErrorHandler) {
        await this.onErrorHandler(error);
      }
    }
    finally {
      completed.forEach(task => this.inflight.delete(task));
    }
  }

  private withConcurrencyLimit<T>(fn: () => Promise<T>): Promise<T> {
    return this.concurrencyLimit(fn);
  }
}
