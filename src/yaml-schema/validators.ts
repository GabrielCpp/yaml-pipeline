import { NodeValidator } from "./node-schema";
import { AstContext, MatchingError } from "./ast-node";
import { isString } from "lodash";

export const validateSimple = (check: (value: any) => boolean, buildMessage: (value: any) => string): NodeValidator =>
  (node: any, context: AstContext): MatchingError[] => {
    const errors: MatchingError[] = [];

    if (!check(node)) {
      errors.push({
        error: buildMessage(node),
        context
      })
    }

    return errors
  }

export function alwaysTrueValidator(node: any, context: AstContext): MatchingError[] {
  return []
}

export const isStringValidator = validateSimple(isString, value => `${value} Should be string`)