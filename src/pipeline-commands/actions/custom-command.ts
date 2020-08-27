import { injectable } from 'inversify';
import { PipelineActionHandler } from '../action-handler';
import { PipelineActionDetails } from '../action-details';
import { PipelineRuntime } from '../pipeline-runtime';
import { isFunction, isPlainObject } from 'lodash';
import { LooseFunction } from '@/expression-engine';
import { newError } from '@/common/error-utils';

interface CustomAssert {
  condition: unknown;
  message: string;
}

export interface CustomCommandActionDetails extends PipelineActionDetails {
  asserts?: CustomAssert[];
  assigns?: (Record<string, unknown> | (() => void))[];
  cmd?: Record<string, unknown> | (() => void);
}

export const CUSTOM_COMMAND_ACTION_HANDLER = Symbol.for(
  'CustomCommandActionHandler',
);

@injectable()
export class CustomCommandActionHandler
  implements PipelineActionHandler<CustomCommandActionDetails> {
  public async run(
    customCommandActionDetails: CustomCommandActionDetails,
    runtime: PipelineRuntime,
  ): Promise<void> {
    if (customCommandActionDetails.asserts !== undefined) {
      for (const assertStatement of customCommandActionDetails.asserts) {
        if (assertStatement.condition !== true) {
          throw newError('assertion_failed', assertStatement.message);
        }
      }
    }

    let commands: (Record<string, unknown> | (() => void))[] = [];

    if (customCommandActionDetails.cmd !== undefined) {
      commands.push(customCommandActionDetails.cmd);
    }

    if (customCommandActionDetails.assigns !== undefined) {
      commands = commands.concat(customCommandActionDetails.assigns);
    }

    for (const step of commands) {
      if (isFunction(step)) {
        const callable = step as LooseFunction;
        await callable();
        continue;
      } else if (isPlainObject(step)) {
        for (const [name, value] of Object.entries(step)) {
          let computedValue = value;

          if (isFunction(value)) {
            const callable = value as () => LooseFunction;
            computedValue = await callable();
          }

          runtime.setVariable(name, computedValue);
        }
      }
    }
  }
}
