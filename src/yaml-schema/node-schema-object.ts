import { NodeSchema, NodeSchemaKeys } from "./node-schema";
import { isObject } from 'lodash';


export class SucessorObjectNode extends NodeSchema {
    public hasIdentity(node: any): boolean {
        return isObject(node);
    }
}