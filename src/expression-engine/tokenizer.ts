import { newError } from '@/common/error-utils';

export enum TokenType {
  Pipe,
  OpeningParenthesis,
  ClosingParenthesis,
  Coma,
  Litteral,
  Name,
  Number,
  EndOfFile,
}

export interface Token {
  value: string;
  type: TokenType;
}

export function newToken(value: string, type: TokenType) {
  return { value, type };
}

const spaceSet = new Set<string>('\n\r \t'.split('').concat(['']));
const variableNameStartSet = new Set<string | void>(
  'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ_$'.split(''),
);
const variableNameSet = new Set<string | void>(
  'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ_$1234567890'.split(''),
);
const numberSet = new Set<string>('1234567890'.split(''));

interface CharStreamElement {
  terminal: string;
  index: number;
}

function* charStream(
  buffer: string,
): Generator<CharStreamElement, CharStreamElement, void> {
  let index = 0;
  for (const terminal of buffer) {
    yield { terminal, index };
    index++;
  }

  return { terminal: '', index };
}

export function tokenize(expression: string): Token[] {
  const tokens: Token[] = [];
  const terminalIterator = charStream(expression);
  let terminal = terminalIterator.next();
  let charBuffer: string[] = [];

  function parseLitteral(): Token {
    terminal = terminalIterator.next();

    while (terminal.done === false && terminal.value.terminal !== '"') {
      charBuffer.push(terminal.value.terminal);
      terminal = terminalIterator.next();
    }

    if (terminal.done === true && terminal.value.terminal !== '"') {
      throw newError('reach_eof_too_soon', 'Eof reached too soon');
    }

    terminal = terminalIterator.next();
    return newToken(charBuffer.join(''), TokenType.Litteral);
  }

  function parseName(): Token {
    charBuffer.push(terminal.value.terminal);
    terminal = terminalIterator.next();

    while (
      terminal.done === false &&
      variableNameSet.has(terminal.value.terminal)
    ) {
      charBuffer.push(terminal.value.terminal);
      terminal = terminalIterator.next();
    }

    return newToken(charBuffer.join(''), TokenType.Name);
  }

  function parseNumber(): Token {
    charBuffer.push(terminal.value.terminal);
    terminal = terminalIterator.next();

    while (terminal.done === false && numberSet.has(terminal.value.terminal)) {
      charBuffer.push(terminal.value.terminal);
      terminal = terminalIterator.next();
    }

    return newToken(charBuffer.join(''), TokenType.Number);
  }

  function start(): Token {
    if (terminal.value.terminal === '|') {
      terminal = terminalIterator.next();
      return newToken('|', TokenType.Pipe);
    }

    if (terminal.value.terminal === ',') {
      terminal = terminalIterator.next();
      return newToken(',', TokenType.Coma);
    }

    if (terminal.value.terminal === '(') {
      terminal = terminalIterator.next();
      return newToken('(', TokenType.OpeningParenthesis);
    }

    if (terminal.value.terminal === ')') {
      terminal = terminalIterator.next();
      return newToken(')', TokenType.ClosingParenthesis);
    }

    if (terminal.value.terminal === '"') {
      return parseLitteral();
    }

    if (variableNameStartSet.has(terminal.value.terminal)) {
      return parseName();
    }

    if (numberSet.has(terminal.value.terminal)) {
      return parseNumber();
    }

    throw newError('no_matching_terminal', 'No matching terminal');
  }

  while (terminal.done === false) {
    while (spaceSet.has(terminal.value.terminal)) {
      terminal = terminalIterator.next();
    }

    if (terminal.done === true) {
      break;
    }

    try {
      const token = start();
      tokens.push(token);
      charBuffer = [];
    } catch (e) {
      if (e.name === 'no_matching_terminal') {
        console.error(e.message);
        console.error(expression);
        console.error(
          Array.from({ length: terminal.value.index }, () => ' ')
            .concat(['^'])
            .join(''),
        );
      } else {
        throw e;
      }
    }
  }

  return tokens;
}
