import { tokenize } from './tokenizer';
import { getAst, AstNode, AstNodeType } from './parse-expression';
import { newError } from '@/common/error-utils';
import { PipelineRuntime } from '@/pipeline-commands/pipeline-runtime';

export type LooseFunction = (...p: unknown[]) => unknown;
export type FunctionBuket = Map<string, LooseFunction>;
export type VariableBucket = Record<string, unknown>;

export async function computeAst(
  ast: AstNode,
  pipelineRuntime: PipelineRuntime,
): Promise<unknown> {
  async function computePipe(node: AstNode): Promise<unknown> {
    const leftChild = node.childs[0];
    const rightChild = node.childs[1];

    const input = await dispatchNode(leftChild);
    const unaryFunction = (await dispatchNode(rightChild)) as (
      ...p: unknown[]
    ) => unknown;

    return await unaryFunction(input);
  }

  async function computeFunction(node: AstNode): Promise<unknown> {
    const apply = pipelineRuntime.getSymbol(
      node.value.symbolName as string,
    ) as LooseFunction;

    if (apply === undefined) {
      throw newError(
        'function_unavaible',
        `Function ${node.value.symbolName} not found`,
      );
    }

    const params: unknown[] = [];

    for (const child of node.childs) {
      const result = await dispatchNode(child);
      params.push(result);
    }

    return await apply(...params);
  }

  async function dispatchNode(node: AstNode): Promise<unknown> {
    if (node.value.type === AstNodeType.PipeOperator) {
      return await computePipe(node);
    }

    if (node.value.type === AstNodeType.Function) {
      return await computeFunction(node);
    }

    if (node.value.symbolName !== undefined) {
      return pipelineRuntime.getSymbol(node.value.symbolName);
    }

    return node.value.litteral;
  }

  return await dispatchNode(ast);
}

export async function resolveExpression(
  expression: string,
  pipelineRuntime: PipelineRuntime,
): Promise<unknown> {
  const tokens = tokenize(expression);
  const ast = getAst(tokens);
  const result = await computeAst(ast, pipelineRuntime);

  return result;
}
