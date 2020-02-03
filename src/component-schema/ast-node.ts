import { Component } from "./component";

export interface MatchingError {
  error: string;
  context: AstContext;
}

export interface ComponentLoadResult {
  component: Component;
  errors: MatchingError[];
}

export interface Trace {
  key: string;
}

export interface AstContext {
  traces: Trace[]
}

export interface AstNode {
  type: string;
  hasIdentity(node: any): boolean;
  load(node: any, context: AstContext): ComponentLoadResult;
}

export function createComponentLoadResult(component: Component, errors: MatchingError[] = []): ComponentLoadResult {
  return {
    component,
    errors
  }
}

export function addTrace(context: AstContext, key: string): AstContext {
  return { ...context, traces: [...context.traces, { key }] }
}

export function createAstContext(key: string) {
  return { traces: [{ key }] }
}