import { newError } from '@/common/error-utils';
import { newToken, Token, TokenType } from './tokenizer';

function* tokenStream(tokens: Token[]): Generator<Token, Token, void> {
  for (const token of tokens) {
    yield token;
  }

  return newToken('', TokenType.EndOfFile);
}

export enum AstNodeType {
  Value = 'Value',
  PipeOperator = 'PipeOperator',
  Function = 'Function',
}

export interface AstNodeValue {
  litteral?: string | number | boolean;
  symbolName?: string;
  type: AstNodeType;
}

export interface AstNode {
  childs: AstNode[];
  value: AstNodeValue;
}

export function newAstLitteralNode(
  type: AstNodeType,
  childs: AstNode[],
  litteral?: string | number | boolean,
): AstNode {
  return {
    value: {
      type,
      litteral,
    },
    childs,
  };
}

export function newAstNode(type: AstNodeType, childs: AstNode[]): AstNode {
  return {
    value: {
      type,
    },
    childs,
  };
}

export function newNamedAstNode(
  type: AstNodeType,
  symbolName: string,
  childs: AstNode[],
): AstNode {
  return {
    value: {
      type,
      symbolName,
    },
    childs,
  };
}

export function newLeafNode(token: Token): AstNode {
  let litteral: string | number | boolean | undefined = undefined;
  let symbolName: string | undefined = undefined;

  if (token.type === TokenType.Number) {
    litteral = parseFloat(token.value);
  } else if (token.type === TokenType.Litteral) {
    litteral = token.value;
  } else if (token.type === TokenType.Name) {
    symbolName = token.value;
  }

  return {
    value: {
      litteral,
      symbolName,
      type: AstNodeType.Value,
    },
    childs: [],
  };
}

export function getAst(tokens: Token[]): AstNode {
  const tokenIterator = tokenStream(tokens);
  let currentToken = tokenIterator.next();

  function pipeExpression(leftOperand: AstNode): AstNode {
    if (currentToken.value.type !== TokenType.Pipe) {
      return leftOperand;
    }

    currentToken = tokenIterator.next();

    if (currentToken.value.type !== TokenType.Name) {
      throw newError(
        'syntaxic_error',
        `Invalid token ${currentToken.value.value}`,
      );
    }

    const nameNode = newLeafNode(currentToken.value);
    currentToken = tokenIterator.next();

    const rightOperand = nameExpression(nameNode);

    return newAstNode(AstNodeType.PipeOperator, [leftOperand, rightOperand]);
  }

  function functionExpression(nameNode: AstNode): AstNode {
    nameNode.value.type = AstNodeType.Function;

    if (currentToken.value.type !== TokenType.OpeningParenthesis) {
      throw newError(
        'syntaxic_error',
        `Invalid token ${currentToken.value.value}`,
      );
    }

    currentToken = tokenIterator.next();

    while (currentToken.value.type !== TokenType.ClosingParenthesis) {
      const currentArgument = functionParameter();
      nameNode.childs.push(currentArgument);

      if (currentToken.value.type === TokenType.Coma) {
        currentToken = tokenIterator.next();
      } else if (
        currentToken.value.type !== (TokenType.ClosingParenthesis as any)
      ) {
        throw newError(
          'syntaxic_error',
          `Invalid token ${currentToken.value.value}`,
        );
      }
    }

    currentToken = tokenIterator.next();

    return nameNode;
  }

  function functionParameter(): AstNode {
    if (
      currentToken.value.type === TokenType.Litteral ||
      currentToken.value.type === TokenType.Number
    ) {
      const leaf = newLeafNode(currentToken.value);
      currentToken = tokenIterator.next();
      return pipeExpression(leaf);
    }

    if (currentToken.value.type === TokenType.Name) {
      const leaf = newLeafNode(currentToken.value);
      currentToken = tokenIterator.next();

      if (
        currentToken.value.type === TokenType.Coma ||
        currentToken.value.type == TokenType.ClosingParenthesis
      ) {
        return leaf;
      }

      if (currentToken.value.type === TokenType.Pipe) {
        return pipeExpression(leaf);
      }

      return functionExpression(leaf);
    }

    throw newError(
      'syntaxic_error',
      `Invalid token ${currentToken.value.value}`,
    );
  }

  function innerExpression(left: AstNode): AstNode {
    let lastLeftExpression = left;

    while (currentToken.value.type !== TokenType.EndOfFile) {
      if (currentToken.value.type === TokenType.Pipe) {
        lastLeftExpression = pipeExpression(lastLeftExpression);
      } else {
        throw newError('abd symbol', 'Invalid ast node');
      }
    }

    return lastLeftExpression;
  }

  function nameExpression(nameNode: AstNode) {
    if (currentToken.value.type === TokenType.OpeningParenthesis) {
      return functionExpression(nameNode);
    }

    return nameNode;
  }

  function start(): AstNode {
    if (
      currentToken.value.type === TokenType.Litteral ||
      currentToken.value.type === TokenType.Number
    ) {
      const leaf = newLeafNode(currentToken.value);
      currentToken = tokenIterator.next();
      return innerExpression(leaf);
    }

    if (currentToken.value.type === TokenType.Name) {
      const leaf = newLeafNode(currentToken.value);
      currentToken = tokenIterator.next();

      return innerExpression(nameExpression(leaf));
    }

    throw newError(
      'syntaxic_error',
      `Invalid token ${currentToken.value.value}`,
    );
  }

  return start();
}
