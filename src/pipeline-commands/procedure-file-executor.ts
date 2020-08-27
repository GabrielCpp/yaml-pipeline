import { injectable, inject, Container } from 'inversify';
import { PipelineActionDetails } from './action-details';
import { PipelineRuntime, PrivateProcedure } from './pipeline-runtime';
import { readFile } from 'mz/fs';
import { parse as parseYaml } from 'yaml';
import {
  PIPELINE_ACTION_HANDLER_MAP,
  PipelineActionHandlerMap,
} from './action-handler';
import { INVERSIFY_CONTAINER } from '@/container';
import {
  ACTION_DETAILS_PREPROCESSOR,
  ActionDetailsPreprocessor,
} from './action-details-preprocessor';

export const PROCEDURE_FILE_EXECUTOR = Symbol.for('ProcedureFileExecutor');

export interface PrivateProcedureActionDetails
  extends PipelineActionDetails,
    PrivateProcedure {}

@injectable()
export class ProcedureFileExecutor {
  @inject(PIPELINE_ACTION_HANDLER_MAP)
  extractActionHandler: PipelineActionHandlerMap;
  @inject(INVERSIFY_CONTAINER) container: Container;
  @inject(ACTION_DETAILS_PREPROCESSOR)
  actionDetailsPreprocessor: ActionDetailsPreprocessor;

  public async executeProcedureFile(
    procedureFilePath: string,
    pipelineRuntime: PipelineRuntime = new PipelineRuntime(),
  ): Promise<PipelineRuntime> {
    const fileContent = await readFile(procedureFilePath, 'utf8');
    const actions = parseYaml(fileContent) as PipelineActionDetails[];

    return await this.evaluateProcedureSteps(actions, pipelineRuntime);
  }

  public async executeRuntimeProcedure(
    procedureFilePath: string,
    parentRuntime: PipelineRuntime,
    pipelineRuntime?: PipelineRuntime,
  ): Promise<PipelineRuntime> {
    const procedureSteps = parentRuntime.getProcedure(procedureFilePath);

    if (procedureSteps === undefined) {
      return await this.executeProcedureFile(
        procedureFilePath,
        pipelineRuntime || parentRuntime,
      );
    }

    return await this.evaluateProcedureSteps(
      procedureSteps,
      pipelineRuntime || parentRuntime,
    );
  }

  private async evaluateProcedureSteps(
    actions: PipelineActionDetails[],
    pipelineRuntime: PipelineRuntime,
  ): Promise<PipelineRuntime> {
    let procedureResult: unknown = undefined;

    try {
      await this.executeProcedureSteps(actions, pipelineRuntime);
    } catch (e) {
      if (e.name === 'exit_procedure') {
        procedureResult = e.returnedValue;
      } else {
        throw e;
      }
    } finally {
      pipelineRuntime.procedureResult = procedureResult;
    }

    return pipelineRuntime;
  }

  private async executeProcedureSteps(
    actions: PipelineActionDetails[],
    pipelineRuntime: PipelineRuntime,
  ) {
    for (const actionDetails of actions) {
      if (actionDetails.kind === 'private-procedure') {
        const privateProcedureBlock = actionDetails as PrivateProcedureActionDetails;
        pipelineRuntime.addPrivateProcedure(privateProcedureBlock);
        continue;
      }

      if (actionDetails.skip === true) {
        continue;
      }

      if (actionDetails.condition !== undefined) {
        await this.actionDetailsPreprocessor.replaceSpecialKey(
          (actionDetails as unknown) as Record<string, unknown>,
          'condition',
          pipelineRuntime,
        );

        if (!!actionDetails.condition === false) {
          continue;
        }
      }

      await this._execute(actionDetails, pipelineRuntime);
    }

    console.log('Done');
  }

  private async _execute(
    actionDetails: PipelineActionDetails,
    pipelineRuntime: PipelineRuntime,
  ): Promise<void> {
    const actionHandlerCreator = this.extractActionHandler.get(
      actionDetails.kind,
    );

    if (actionHandlerCreator === undefined) {
      console.error(`No handler for action kind ${actionDetails.kind}`);
      return;
    }

    await this.actionDetailsPreprocessor.preprocess(
      actionDetails,
      pipelineRuntime,
    );

    if (actionDetails.display) {
      console.log(`Running: ${actionDetails.display}`);
    }

    const actionHandler = actionHandlerCreator(this.container);
    await actionHandler.run(actionDetails, pipelineRuntime);
  }
}
