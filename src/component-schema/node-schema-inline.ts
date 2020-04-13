import { NodeSchema, NodeValidator } from "./node-schema";
import { isObject } from 'lodash';


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
        if (isObject(node)) {
            return false;
        }

        const objectKeys = Object.keys(node)

        if (objectKeys.length !== 1) {
            return false;
        }

        return objectKeys[0] === this.identityValue;
    }
}