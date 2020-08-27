import { injectable, inject } from 'inversify';
import { PipelineActionHandler } from '../action-handler';
import { PipelineActionDetails } from '../action-details';
import {
  PROCEDURE_FILE_EXECUTOR,
  ProcedureFileExecutor,
} from '../procedure-file-executor';
import { PipelineRuntime } from '../pipeline-runtime';
import {
  APPLICATION_LIFETIME,
  ApplicationLifetime,
} from '@/application-lifetime';
import { sleep } from '@/common';

interface PollTarget {
  polledProcedurePath: string;
  params?: Record<string, unknown>;
}

export interface PollTargetActionDetails extends PipelineActionDetails {
  exitPollCondition: (...results: unknown[]) => boolean;
  maxRetryCount: number;
  timeBetweenEachPoolInS: number;
  storeOutcomeInVariable?: string;
  targets: PollTarget[];
}

export const POLL_TARGET_ACTION_HANDLER = Symbol.for('PollTargetActionHandler');

@injectable()
export class PollTargetActionHandler
  implements PipelineActionHandler<PollTargetActionDetails> {
  @inject(PROCEDURE_FILE_EXECUTOR)
  private procedureFileExecutor: ProcedureFileExecutor;
  @inject(APPLICATION_LIFETIME)
  private applicationLifetime: ApplicationLifetime;

  public async run(
    actionDetails: PollTargetActionDetails,
    runtime: PipelineRuntime,
  ): Promise<void> {
    let currentRetryCount = 0;
    let isOutcomeIsSucessful = false;
    let applicationExited = false;
    const exitPromise = this.applicationLifetime
      .createOnExitPromise()
      .then(() => (applicationExited = true));

    while (
      currentRetryCount < actionDetails.maxRetryCount &&
      applicationExited == false
    ) {
      const results = [];

      for (const target of actionDetails.targets || []) {
        const innerPipelineRuntime = new PipelineRuntime();

        for (const [name, value] of Object.entries(target.params || {})) {
          innerPipelineRuntime.setVariable(name, value);
        }

        innerPipelineRuntime.setVariable('$pollIndex', currentRetryCount);

        await this.procedureFileExecutor.executeRuntimeProcedure(
          target.polledProcedurePath,
          runtime,
          innerPipelineRuntime,
        );
        results.push(innerPipelineRuntime.procedureResult);
      }

      const shouldExit = await actionDetails.exitPollCondition(...results);

      if (shouldExit === true) {
        isOutcomeIsSucessful = true;
        break;
      }

      currentRetryCount++;

      await Promise.race([
        sleep(actionDetails.timeBetweenEachPoolInS * 1000),
        exitPromise,
      ]);
    }

    if (actionDetails.storeOutcomeInVariable !== undefined) {
      runtime.setVariable(
        actionDetails.storeOutcomeInVariable,
        isOutcomeIsSucessful,
      );
    }
  }
}
