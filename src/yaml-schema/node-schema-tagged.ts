import { NodeSchema, ObjectNodeKeyDetails, NodeValidator } from "./node-schema";
import { MatchingError, AstContext } from "./ast-node";

export class TaggedNode extends NodeSchema {
  private static validateIdentity(identityValue: string, identityKey: string): NodeValidator {
    return (nodeValue: any, context: AstContext) => {
      let result: MatchingError[] = []

      if (nodeValue !== identityValue) {
        result.push({ error: `Value of key ${identityKey} must be equal to ${identityValue} not to  ${nodeValue}`, context })
      }

      return result
    };
  }

  public constructor(
    type: string,
    private identityValue: string,
    keys: { [id: string]: ObjectNodeKeyDetails },
    private identityKey: string = 'kind'
  ) {
    super(type, {
      [identityKey]: {
        target: "attribute",
        validate: TaggedNode.validateIdentity(identityValue, identityKey)
      },
      ...keys
    });
  }

  public hasIdentity(node: any): boolean {
    return node[this.identityKey] === this.identityValue
  }
}