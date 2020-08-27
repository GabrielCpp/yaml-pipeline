import {
  ApplicationLifetime,
  APPLICATION_LIFETIME,
} from '@/application-lifetime';
import { ChildProcessWithoutNullStreams, spawn } from 'child_process';
import { inject, injectable } from 'inversify';
import { open } from 'mz/fs';
import { PipelineActionDetails } from '../action-details';
import { PipelineActionHandler } from '../action-handler';
import { PipelineRuntime } from '../pipeline-runtime';

export interface SpawnCommandActionDetails extends PipelineActionDetails {
  processName: string;
  command: string;
  args?: string[];
  cwd?: string;
  redirectOutputToFile?: string;
  envs?: Record<string, string>;
}

export const SPAWN_COMMAND_ACTION_HANDLER = Symbol.for(
  'SpwanCommandActionHandler',
);

const startedProcessMap = new Map<string, ChildProcessWithoutNullStreams>();

@injectable()
export class SpawnCommandActionHandler
  implements PipelineActionHandler<SpawnCommandActionDetails> {
  @inject(APPLICATION_LIFETIME)
  private applicationLifetime: ApplicationLifetime;

  public async run(
    actionDetails: SpawnCommandActionDetails,
    runtime: PipelineRuntime,
  ): Promise<void> {
    const {
      processName,
      command,
      cwd,
      args,
      redirectOutputToFile,
      envs,
    } = actionDetails;

    if (
      command === 'kill' &&
      args === undefined &&
      cwd === undefined &&
      startedProcessMap.has(processName)
    ) {
      const runningProcess = startedProcessMap.get(processName);

      if (runningProcess !== undefined && runningProcess.killed !== true) {
        runningProcess.kill('SIGINT');
      }
    } else {
      let stdio: any[] | undefined = undefined;

      if (redirectOutputToFile) {
        const out = await open(redirectOutputToFile, 'w');
        const err = await open(redirectOutputToFile, 'w');
        stdio = ['ignore', out, err];
      }

      const result = spawn(command, args, {
        cwd,
        stdio,
        env: { ...(envs || {}) },
      });
      startedProcessMap.set(processName, result);
      this.applicationLifetime.notifyOnExit(() => {
        const childProcess = startedProcessMap.get(processName);

        if (childProcess !== undefined) {
          childProcess.kill('SIGINT');
        }
      });

      result.on('close', (exitCode: number) => {
        console.log(`Process ${processName} finished with code ${exitCode}`);
        startedProcessMap.delete(processName);
      });
    }
  }
}
