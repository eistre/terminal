import type { Evaluator, EvaluatorTask } from './evaluator';
import { EvaluatorImpl } from './evaluator';

export type { Evaluator };

export function createEvaluator({ tasks }: { tasks: EvaluatorTask[] }): Evaluator {
  return new EvaluatorImpl(tasks);
}
