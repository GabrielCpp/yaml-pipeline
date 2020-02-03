import { AstNode, ComponentLoadResult, AstContext } from "./ast-node";
import { createComponent } from "./component";

export class ErrorNode implements AstNode {
  public type: string = 'error';

  public constructor(private message: string) {

  }

  public hasIdentity(node: any): boolean {
    return true
  }

  public load(node: any, context: AstContext): ComponentLoadResult {
    return {
      component: createComponent('empty'),
      errors: [{ error: this.message, context }]
    }
  }
}