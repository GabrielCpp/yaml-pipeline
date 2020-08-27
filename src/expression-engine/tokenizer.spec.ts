import { tokenize, newToken, TokenType, Token } from './tokenizer';

describe('tokenizer', () => {
  const usecases: [string, Token[]][] = [
    ['1234', [newToken('1234', TokenType.Number)]],
    ['"1234"', [newToken('1234', TokenType.Litteral)]],
    ['abc', [newToken('abc', TokenType.Name)]],
    ['(', [newToken('(', TokenType.OpeningParenthesis)]],
    [')', [newToken(')', TokenType.ClosingParenthesis)]],
    ['|', [newToken('|', TokenType.Pipe)]],
    [
      'ticks(datetime, 5)',
      [
        newToken('ticks', TokenType.Name),
        newToken('(', TokenType.OpeningParenthesis),
        newToken('datetime', TokenType.Name),
        newToken(',', TokenType.Coma),
        newToken('5', TokenType.Number),
        newToken(')', TokenType.ClosingParenthesis),
      ],
    ],
  ];

  for (const [expression, expectedTokens] of usecases) {
    test(`Given ${expression} should get ${JSON.stringify(
      expectedTokens,
    )}`, () => {
      const actualTokens = tokenize(expression);
      expect(actualTokens).toEqual(expectedTokens);
    });
  }
});
