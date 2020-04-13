import { ComponentCompiled, ComponentInstance, NodeDetails } from "./runtime";
import { Dictionary } from "lodash";
import { AstNodeDetails } from "../component-schema/schema";
import { InilineNode } from "../component-schema/node-schema-inline";
import { isStringValidator } from "../component-schema/validators";

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