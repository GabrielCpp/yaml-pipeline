import { exec } from 'child_process';
import { injectable } from 'inversify';
import { promisify } from 'util';
import { PipelineActionDetails } from '../action-details';
import { PipelineActionHandler } from '../action-handler';
import { PipelineRuntime } from '../pipeline-runtime';

const execPromise = promisify(exec);

export interface ShellCommandActionDetails extends PipelineActionDetails {
  command: string;
  timeoutInS?: number;
  cwd?: string;
  output?: (out: string) => Promise<void>;
}

export const SHELL_COMMAND_ACTION_HANDLER = Symbol.for(
  'ShellCommandActionHandler',
);

@injectable()
export class ShellCommandActionHandler
  implements PipelineActionHandler<ShellCommandActionDetails> {
  public async run(
    actionDetails: ShellCommandActionDetails,
    runtime: PipelineRuntime,
  ): Promise<void> {
    const { command, cwd, timeoutInS = 30 } = actionDetails;

    const result = await execPromise(command, {
      cwd,
      timeout: timeoutInS * 1000,
    });

    if (actionDetails.output !== undefined) {
      actionDetails.output(result.stdout)
    } else {
      console.log(result.stdout.trim());
      console.error(result.stderr.trim());
    }
  }
}
