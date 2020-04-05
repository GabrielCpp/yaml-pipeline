import { ComponentCompiled, ComponentInstance } from "../component-schema/runtime";
import { Dictionary } from "lodash";
import { AstNodeDetails } from "../component-schema/schema";
import { NodeDetails } from "../program-interpreter";
import { InilineNode } from "../component-schema/inline-node";
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