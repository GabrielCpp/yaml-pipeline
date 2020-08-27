import {
  getAst,
  AstNode,
  newAstNode,
  AstNodeType,
  newAstLitteralNode,
  newNamedAstNode,
} from './parse-expression';
import { Token, newToken, TokenType } from './tokenizer';

describe('parseAst', () => {
  const getAstTest = (name: string, tokens: Token[], expectedAst: AstNode) =>
    test(name, () => {
      const actualAst = getAst(tokens);
      expect(actualAst).toEqual(expectedAst);
    });

  getAstTest(
    'Given function without argument should build ast with nested function',
    [
      newToken('now', TokenType.Name),
      newToken('(', TokenType.OpeningParenthesis),
      newToken(')', TokenType.ClosingParenthesis),
      newToken('|', TokenType.Pipe),
      newToken('substract', TokenType.Name),
      newToken('(', TokenType.OpeningParenthesis),
      newToken('10', TokenType.Number),
      newToken(')', TokenType.ClosingParenthesis),
    ],
    newAstNode(AstNodeType.PipeOperator, [
      newNamedAstNode(AstNodeType.Function, 'now', []),
      newNamedAstNode(AstNodeType.Function, 'substract', [
        newAstLitteralNode(AstNodeType.Value, [], 10),
      ]),
    ]),
  );

  getAstTest(
    'Given piping multiple times should right most pipe be on top',
    [
      newToken('a', TokenType.Name),
      newToken('(', TokenType.OpeningParenthesis),
      newToken(')', TokenType.ClosingParenthesis),
      newToken('|', TokenType.Pipe),
      newToken('b', TokenType.Name),
      newToken('(', TokenType.OpeningParenthesis),
      newToken(')', TokenType.ClosingParenthesis),
      newToken('|', TokenType.Pipe),
      newToken('c', TokenType.Name),
      newToken('(', TokenType.OpeningParenthesis),
      newToken(')', TokenType.ClosingParenthesis),
    ],
    newAstNode(AstNodeType.PipeOperator, [
      newAstNode(AstNodeType.PipeOperator, [
        newNamedAstNode(AstNodeType.Function, 'a', []),
        newNamedAstNode(AstNodeType.Function, 'b', []),
      ]),
      newNamedAstNode(AstNodeType.Function, 'c', []),
    ]),
  );

  getAstTest(
    'Given piping 4 times should right most pipe be on top',
    [
      newToken('a', TokenType.Name),
      newToken('(', TokenType.OpeningParenthesis),
      newToken(')', TokenType.ClosingParenthesis),
      newToken('|', TokenType.Pipe),
      newToken('b', TokenType.Name),
      newToken('(', TokenType.OpeningParenthesis),
      newToken(')', TokenType.ClosingParenthesis),
      newToken('|', TokenType.Pipe),
      newToken('c', TokenType.Name),
      newToken('(', TokenType.OpeningParenthesis),
      newToken(')', TokenType.ClosingParenthesis),
      newToken('|', TokenType.Pipe),
      newToken('d', TokenType.Name),
      newToken('(', TokenType.OpeningParenthesis),
      newToken(')', TokenType.ClosingParenthesis),
    ],
    newAstNode(AstNodeType.PipeOperator, [
      newAstNode(AstNodeType.PipeOperator, [
        newAstNode(AstNodeType.PipeOperator, [
          newNamedAstNode(AstNodeType.Function, 'a', []),
          newNamedAstNode(AstNodeType.Function, 'b', []),
        ]),
        newNamedAstNode(AstNodeType.Function, 'c', []),
      ]),
      newNamedAstNode(AstNodeType.Function, 'd', []),
    ]),
  );

  getAstTest(
    'Given function without argument should build ast calling function',
    [
      newToken('now', TokenType.Name),
      newToken('(', TokenType.OpeningParenthesis),
      newToken(')', TokenType.ClosingParenthesis),
    ],
    newNamedAstNode(AstNodeType.Function, 'now', []),
  );

  getAstTest(
    'Given function with multiple arguments should build ast with function having multiple arguments',
    [
      newToken('echo', TokenType.Name),
      newToken('(', TokenType.OpeningParenthesis),
      newToken('name1', TokenType.Name),
      newToken(',', TokenType.Coma),
      newToken('name2', TokenType.Name),
      newToken(')', TokenType.ClosingParenthesis),
    ],
    newNamedAstNode(AstNodeType.Function, 'echo', [
      newNamedAstNode(AstNodeType.Value, 'name1', []),
      newNamedAstNode(AstNodeType.Value, 'name2', []),
    ]),
  );
});
