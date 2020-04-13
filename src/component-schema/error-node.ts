import { AstNode, ComponentLoadResult, AstContext, newComponentLoadResult, newMatchingError } from "./ast-node";
import { createComponent } from "./component";

export class ErrorNode implements AstNode {
    public type: string = 'error';

    public constructor(private message: string) {

    }

    public hasIdentity(_: unknown): boolean {
        return true
    }

    public load(_: unknown, context: AstContext): ComponentLoadResult {
        return newComponentLoadResult(
            createComponent('empty'), [
            newMatchingError(this.message, context)
        ])
    }
}