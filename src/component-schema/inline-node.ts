import { NodeSchema, NodeValidator } from "./node-schema";


export class InilineNode extends NodeSchema {
  public constructor(
    type: string,
    private identityValue: string,
    validate: NodeValidator
  ) {
    super(type, {
      [identityValue]: {
        target: 'attribute',
        validate
      }
    });
  }

  public hasIdentity(node: any): boolean {
    const objectKeys = Object.keys(node)

    return objectKeys.length === 1 && objectKeys[0] === this.identityValue;
  }

}