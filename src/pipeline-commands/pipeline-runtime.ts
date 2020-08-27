import { toMongoNuuid } from '@/common';
import { newError } from '@/common/error-utils';
import { dumpJsonlToFile } from '@/common/jsonl-utils';
import {
  FunctionBuket,
  LooseFunction,
  VariableBucket,
} from '@/expression-engine';
import AdmZip from 'adm-zip';
import assert from 'assert';
import {
  curry,
  get,
  identity,
  isNumber,
  isPlainObject,
  isString,
} from 'lodash';
import moment from 'moment';
import {
  appendFile,
  createReadStream,
  exists,
  mkdir,
  PathLike,
  readFile,
  writeFile,
} from 'mz/fs';
import path from 'path';
import rimraf from 'rimraf';
import { promisify } from 'util';
import { sprintf } from 'voca';
import { parseStringPromise } from 'xml2js';
import { PipelineActionDetails } from './action-details';

function getEnvVar(name: string): string | undefined {
  return process.env[name];
}

function dumpObjectToJsonlFile(
  filePath: string,
): (obj: unknown) => Promise<void> {
  async function* adapter(obj: unknown) {
    yield JSON.stringify(obj);
  }

  return (obj: unknown) => dumpJsonlToFile(filePath, adapter(obj));
}

function dumpIterableToJsonlFile(
  filePath: string,
  mapValue: (value: unknown) => unknown = identity,
): (iterator: AsyncIterableIterator<unknown>) => Promise<void> {
  async function* adapter(iterator: AsyncIterableIterator<unknown>) {
    for await (const obj of iterator) {
      const mappedValue = mapValue(obj);
      yield JSON.stringify(mappedValue);
    }
  }

  return (iterator: AsyncIterableIterator<unknown>) =>
    dumpJsonlToFile(filePath, adapter(iterator));
}

function now(): moment.Moment {
  return moment();
}

function log(...params: unknown[]): void {
  console.log(...params);
}

function logJsonValue(value: unknown): unknown {
  console.log(JSON.stringify(value, null, 2));
  return value;
}

function logJsonValueWithContext(context: string): (value: unknown) => unknown {
  return (value: unknown): unknown => {
    console.log(`${context}: ${JSON.stringify(value)}`);
    return value;
  };
}

async function isPathExists(path: PathLike) {
  return await exists(path);
}

function notValue(value: unknown): unknown {
  return !value;
}

const rimrafPromisified = promisify(rimraf);
async function rmtree(path: string): Promise<void> {
  await rimrafPromisified(path);
}

async function makePath(path: string) {
  assert(isString(path), 'Path must be a string.');
  await mkdir(path, { recursive: true });

  if ((await exists(path)) === false) {
    throw newError('mkdirpath_failed', `Unable to make path ${path}`);
  }
}

function curryGet(path: string, defaultValue?: unknown): unknown {
  return (value: unknown) => get(value, path, defaultValue);
}

function iterableToArray(
  mapValue: (value: unknown) => unknown = identity,
): (iterator: AsyncIterableIterator<unknown>) => Promise<unknown[]> {
  return async (
    iterator: AsyncIterableIterator<unknown>,
  ): Promise<unknown[]> => {
    const results: unknown[] = [];

    for await (const obj of iterator) {
      const result = mapValue(obj);
      results.push(result);
    }

    return results;
  };
}

async function loadTextFile(path: string) {
  return await readFile(path, 'utf8');
}

function paseJson(content: string): unknown {
  assert(isString(content), 'Content must be string');
  return JSON.parse(content);
}

async function parseXml(content: string) {
  return await parseStringPromise(content);
}

function bindSetVar(runtime: PipelineRuntime) {
  return function setVar(name: string): unknown {
    return (value: unknown) => {
      runtime.setVariable(name, value);
      return value;
    };
  };
}

function bindDumpVariables(runtime: PipelineRuntime) {
  return function dumpVariables() {
    console.log(JSON.stringify(runtime.variables, null, 2));
    return runtime;
  };
}

function createValueMapper(
  mapping: [string, unknown][],
  defaultValue?: unknown,
): (key: string) => unknown {
  const map = new Map<string, unknown>(mapping);
  return (key: string) => {
    if (map.has(key)) {
      return map.get(key);
    }

    return defaultValue;
  };
}

function regexpMatch(
  candidate: string,
  pattern: string,
  flags?: string,
): boolean {
  const exp = new RegExp(pattern, flags);
  return exp.test(candidate);
}

function isDefined(value: unknown): boolean {
  return value !== undefined;
}

function exitProcedure(result?: unknown) {
  throw newError('exit_procedure', 'Exited procedure with return function,', {
    returnedValue: result,
  });
}

async function zipFile(sourceFilePath: string, targetZipPath: string) {
  const zip = new AdmZip();
  zip.addLocalFile(sourceFilePath);
  await new Promise<void>((resolve, reject) =>
    zip.writeZip(targetZipPath, (error?: Error | null) => {
      if (error) {
        reject(error);
      } else {
        resolve();
      }
    }),
  );
}

async function overwriteFile(filePath: string, content: string) {
  await writeFile(filePath, content, 'utf8');
}

async function appendTextFile(filePath: string, content: string) {
  await appendFile(filePath, content, 'utf8');
}

async function jsonStringify(obj: string) {
  return JSON.stringify(obj, null, 2);
}

function createReadStreamFromFile(path: string) {
  return createReadStream(path);
}

const buildBaseAvaibleFunctions = (runtime: PipelineRuntime) =>
  new Map<string, LooseFunction>([
    ['identity', identity],
    ['not', notValue],
    ['NUUID', toMongoNuuid as LooseFunction],
    ['getEnvVar', getEnvVar as LooseFunction],
    ['now', now as LooseFunction],
    ['log', log as LooseFunction],
    ['logJsonValue', logJsonValue as LooseFunction],
    ['logJsonValueWithContext', logJsonValueWithContext as LooseFunction],
    ['dumpObjectToJsonlFile', dumpObjectToJsonlFile as LooseFunction],
    ['dumpIterableToJsonlFile', dumpIterableToJsonlFile as LooseFunction],
    ['iterableToArray', iterableToArray as LooseFunction],
    ['isPathExists', isPathExists as LooseFunction],
    ['rmtree', rmtree as LooseFunction],
    ['joinPath', path.join as LooseFunction],
    ['format', sprintf as LooseFunction],
    ['castNumber', ((v: unknown) => Number(v)) as LooseFunction],
    ['castString', ((v: unknown) => String(v)) as LooseFunction],
    ['castBoolean', ((v: unknown) => Boolean(v)) as LooseFunction],
    ['curryGet', curryGet as LooseFunction],
    ['isDefined', (value: unknown) => value !== undefined],
    ['parseXml', parseXml as LooseFunction],
    ['paseJson', paseJson as LooseFunction],
    ['setVar', bindSetVar(runtime) as LooseFunction],
    ['dumpVariables', bindDumpVariables(runtime) as LooseFunction],
    ['createValueMapper', createValueMapper as LooseFunction],
    ['regexpMatch', regexpMatch as LooseFunction],
    ['isDefined', isDefined as LooseFunction],
    ['isNumber', isNumber as LooseFunction],
    ['mkdirPath', makePath as LooseFunction],
    ['return', exitProcedure as LooseFunction],
    ['zipFile', zipFile as LooseFunction],
    ['loadTextFile', loadTextFile as LooseFunction],
    ['overwriteFile', overwriteFile as LooseFunction],
    ['appendFile', appendTextFile as LooseFunction],
    ['jsonStringify', jsonStringify as LooseFunction],
    ['curryAppendFile', curry(appendTextFile) as LooseFunction],
    ['createReadStream', createReadStreamFromFile as LooseFunction],
  ]);

export interface PrivateProcedure {
  name: string;
  steps: PipelineActionDetails[];
}

export class PipelineRuntime {
  public variables: VariableBucket;
  public avaibleFunctions: FunctionBuket;
  public procedureResult: unknown;
  public procedures = new Map<string, PipelineActionDetails[]>();

  public constructor(variables: VariableBucket = {}) {
    this.variables = variables;
    this.avaibleFunctions = buildBaseAvaibleFunctions(this);
  }

  public getFunction(name: string): LooseFunction | undefined {
    return this.avaibleFunctions.get(name);
  }

  public getSymbol(name: string): LooseFunction | undefined | unknown {
    const functionValue = this.avaibleFunctions.get(name);

    if (functionValue !== undefined) {
      return functionValue;
    }

    return this.variables[name];
  }

  public setVariable(name: string, value: unknown): void {
    this.variables[name] = value;
  }

  public addPrivateProcedure(procedure: PrivateProcedure) {
    this.procedures.set(procedure.name, procedure.steps);
  }

  getProcedure(name: string): PipelineActionDetails[] | undefined {
    return deepCopy(this.procedures.get(name)) as
      | PipelineActionDetails[]
      | undefined;
  }
}

function deepCopy(root: unknown): unknown {
  function copyStep(element: unknown): unknown {
    if (isPlainObject(element)) {
      const obj = element as Record<string, unknown>;
      return Object.keys(obj).reduce((previous, currentKey) => {
        previous[currentKey] = copyStep(obj[currentKey]);
        return previous;
      }, {} as Record<string, unknown>);
    } else if (Array.isArray(element)) {
      return element.map((item) => copyStep(item));
    }

    return element;
  }

  return copyStep(root);
}
