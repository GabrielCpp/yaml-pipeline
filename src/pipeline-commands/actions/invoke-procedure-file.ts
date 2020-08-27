import { injectable, inject } from 'inversify';
import { PipelineActionHandler } from '../action-handler';
import { PipelineActionDetails } from '../action-details';
import { PipelineRuntime } from '../pipeline-runtime';
import {
  PROCEDURE_FILE_EXECUTOR,
  ProcedureFileExecutor,
} from '../procedure-file-executor';

export interface InvokeProcedureFileActionDetails
  extends PipelineActionDetails {
  path: string;
  params?: Record<string, unknown>;
  storeReturnedValueInVariable?: string;
}

export const INVOKE_PROCEDURE_FILE_ACTION_HANDLER = Symbol.for(
  'InvokeProcedureFileActionHandler',
);

@injectable()
export class InvokeProcedureFileActionHandler
  implements PipelineActionHandler<InvokeProcedureFileActionDetails> {
  @inject(PROCEDURE_FILE_EXECUTOR)
  private procedureFileExecutor: ProcedureFileExecutor;

  public async run(
    actionDetails: InvokeProcedureFileActionDetails,
    runtime: PipelineRuntime,
  ): Promise<void> {
    const innerPipelineRuntime = new PipelineRuntime();

    for (const [name, value] of Object.entries(actionDetails.params || {})) {
      innerPipelineRuntime.setVariable(name, value);
    }

    await this.procedureFileExecutor.executeRuntimeProcedure(
      actionDetails.path,
      runtime,
      innerPipelineRuntime,
    );

    if (actionDetails.storeReturnedValueInVariable !== undefined) {
      runtime.setVariable(
        actionDetails.storeReturnedValueInVariable,
        innerPipelineRuntime.procedureResult,
      );
    }
  }
}
