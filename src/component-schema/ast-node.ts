import { Component } from "./component";

export interface MatchingError {
    error: string;
    context: AstContext;
}

export function newMatchingError(error: string, context: AstContext) {
    return {
        error,
        context
    };
}

export interface ComponentLoadResult {
    component: Component;
    errors: MatchingError[];
}

export function newComponentLoadResult(component: Component, errors: MatchingError[] = []): ComponentLoadResult {
    return {
        component,
        errors
    }
}

export interface Trace {
    key: string;
}

export function newTrace(key: string) {
    return {
        key
    };
}


export interface AstContext {
    traces: Trace[]
}

export function addTrace(context: AstContext, key: string): AstContext {
    return { ...context, traces: [...context.traces, { key }] }
}

export function createAstContext(key: string) {
    return { traces: [{ key }] }
}

export interface AstNode {
    type: string;
    hasIdentity(node: any): boolean;
    load(node: unknown, context: AstContext): ComponentLoadResult;
}

