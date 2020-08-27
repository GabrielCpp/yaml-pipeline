import { injectable } from 'inversify';
import { resolveExpression } from '@/expression-engine';
import { isPlainObject, size, head, get, set } from 'lodash';
import { PipelineRuntime } from './pipeline-runtime';

export const ACTION_DETAILS_PREPROCESSOR = Symbol.for(
  'ActionDetailsPreprocessor',
);

@injectable()
export class ActionDetailsPreprocessor {
  public async preprocess(
    actionDetails: unknown,
    pipelineRuntime: PipelineRuntime,
  ) {
    const replaceRuntimeSymbolInArray = async (
      actionDetailsObject: unknown[],
    ) => {
      for (const [name, value] of Object.entries(actionDetailsObject)) {
        if (
          await this.replaceSpecialKey(
            actionDetailsObject,
            name,
            pipelineRuntime,
          )
        ) {
          continue;
        }

        if (Array.isArray(value)) {
          await replaceRuntimeSymbolInArray(value);
        } else if (isPlainObject(value)) {
          await replaceRuntimeSymbolInObject(value as Record<string, unknown>);
        }
      }
    };

    const replaceRuntimeSymbolInObject = async (
      actionDetailsObject: Record<string, unknown>,
    ) => {
      for (const [name, value] of Object.entries(actionDetailsObject)) {
        if (
          await this.replaceSpecialKey(
            actionDetailsObject,
            name,
            pipelineRuntime,
          )
        ) {
          continue;
        }

        if (Array.isArray(value)) {
          await replaceRuntimeSymbolInArray(value);
        } else if (isPlainObject(value)) {
          await replaceRuntimeSymbolInObject(value as Record<string, unknown>);
        }
      }
    };

    const actionDetailsObject = actionDetails as Record<string, unknown>;
    await replaceRuntimeSymbolInObject(actionDetailsObject);
  }

  public async replaceSpecialKey(
    actionDetailsObject: Record<string, unknown> | unknown[],
    name: string,
    pipelineRuntime: PipelineRuntime,
  ): Promise<boolean> {
    const value = get(actionDetailsObject, name) as Record<string, unknown>;

    if (!isPlainObject(value)) {
      return false;
    }

    if (size(value) !== 1) {
      return false;
    }

    const keyName = head(Object.keys(value));
    let result: unknown | undefined = undefined;

    if (keyName === '$expr') {
      const exprContainer = value as { $expr: string };
      const expression = exprContainer['$expr'];

      result = await resolveExpression(expression, pipelineRuntime);
    } else if (keyName === 'expr$') {
      const exprContainer = value as { expr$: string };
      const expression = exprContainer['expr$'];

      result = async (...params: unknown[]) => {
        this.setArguments(pipelineRuntime, params);
        return await resolveExpression(expression, pipelineRuntime);
      };
    } else if (keyName === '$eval') {
      const exprContainer = value as { $eval: string };
      const generateValue = new Function(
        '$',
        '$helpers',
        `return (${exprContainer['$eval'].trim()});`,
      );
      result = generateValue(
        pipelineRuntime.variables,
        pipelineRuntime.avaibleFunctions,
      );
    } else if (keyName === 'eval$') {
      const exprContainer = value as { eval$: string };
      const generateValue = new Function(
        '$',
        '$helpers',
        `return (${exprContainer['eval$'].trim()});`,
      );
      result = (...params: unknown[]) => {
        this.setArguments(pipelineRuntime, params);
        return generateValue(
          pipelineRuntime.variables,
          pipelineRuntime.avaibleFunctions,
        );
      };
    } else if (keyName === '$$eval') {
      const exprContainer = value as { $$eval: string };
      const generateValue = new Function(
        '$',
        '$helpers',
        `${exprContainer['$$eval']}`,
      );
      result = generateValue(
        pipelineRuntime.variables,
        pipelineRuntime.avaibleFunctions,
      );
    } else if (keyName === 'eval$$') {
      const exprContainer = value as { eval$$: string };
      const generateValue = new Function(
        '$',
        '$helpers',
        `${exprContainer['eval$$'].trim()}`,
      );
      result = (...params: unknown[]) => {
        this.setArguments(pipelineRuntime, params);
        return generateValue(
          pipelineRuntime.variables,
          pipelineRuntime.avaibleFunctions,
        );
      };
    } else {
      return false;
    }

    set(actionDetailsObject, name, result);

    return true;
  }

  private setArguments(pipelineRuntime: PipelineRuntime, params: unknown[]) {
    for (const index in params || []) {
      pipelineRuntime.setVariable(`$${index}`, params[index]);
    }

    pipelineRuntime.setVariable('$arguments', params);
  }
}
