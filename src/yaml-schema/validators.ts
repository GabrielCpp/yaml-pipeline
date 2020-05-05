import { NodeValidator } from "./node-schema";
import { AstContext, MatchingError } from "./ast-node";
import { isString, isNumber } from "lodash";

export const validateSimple = (check: (value: unknown) => boolean, buildMessage: (value: unknown) => string): NodeValidator =>
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

export function alwaysTrueValidator(node: unknown, context: AstContext): MatchingError[] {
    return []
}

export const isStringValidator = validateSimple(isString, value => `${value} Should be string`)
export const isNumberValidator = validateSimple(isNumber, value => `${value} Should be string`)