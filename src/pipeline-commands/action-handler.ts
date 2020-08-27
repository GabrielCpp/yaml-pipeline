import { PipelineActionDetails } from './action-details';
import { Container } from 'inversify';
import { PipelineRuntime } from './pipeline-runtime';

export interface PipelineActionHandler<T extends PipelineActionDetails> {
  run(actionDetails: T, runtime: PipelineRuntime): Promise<void>;
}

export const PIPELINE_ACTION_HANDLER_MAP = Symbol.for('PipelineActionHandler');
export type PipelineActionHandlerCreator = (
  container: Container,
) => PipelineActionHandler<PipelineActionDetails>;
export type PipelineActionHandlerMap = Map<
  string,
  PipelineActionHandlerCreator
>;
