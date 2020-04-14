import { ComponentCompiled, ComponentInstance, NodeDetails } from "./runtime";
import { Dictionary } from "lodash";
import { AstNodeDetails } from "../yaml-schema/schema";
import { InilineNode } from "../yaml-schema/node-schema-inline";
import { isStringValidator } from "../yaml-schema/validators";

const type = 'symbol-ref';

function loader(compiledComponent: ComponentCompiled): ComponentInstance {
    function invoke(params: Dictionary<unknown>) {
        return params[compiledComponent.attributes.symbol as string]
    }

    return {
        ...compiledComponent,
        invoke
    }
}

const astNode: AstNodeDetails = {
    node: schema => new InilineNode(type, 'symbol', isStringValidator),
    tags: ['symbol-ref']
}

export const readVarComponent: NodeDetails = {
    id: type,
    loader,
    astNode
}