import type { Evaluator, EvaluatorTask } from './evaluator.js';
import { EvaluatorImpl } from './evaluator.js';

export type { Evaluator };

export function createEvaluator({ tasks }: { tasks: EvaluatorTask[] }): Evaluator {
  return new EvaluatorImpl(tasks);
}
