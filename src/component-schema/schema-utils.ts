import { AstNode } from "./ast-node";
import { ErrorNode } from "./error-node";

export function* neverMatchedNode(): IterableIterator<AstNode> {
  yield new ErrorNode('Cannot find matching node')
}

export function findMatchingNode(node: any, nodeIteratorMaker: () => IterableIterator<AstNode>): AstNode {
  let result: AstNode | undefined;

  for (const candidate of nodeIteratorMaker()) {
    if (candidate.hasIdentity(node)) {
      result = candidate;
      break;
    }
  }

  return result || new ErrorNode('Cannot find matching node');
}