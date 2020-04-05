import { ComponentCompiled, ComponentInstance } from "../component-schema/runtime";
import { Dictionary } from "lodash";
import { AstNodeDetails } from "../component-schema/schema";
import { isStringValidator, alwaysTrueValidator } from "../component-schema/validators";
import { TaggedNode } from "../component-schema/tagged-node";
import { NodeDetails } from "../program-interpreter";

const type = 'def-var'

function loader(compiledComponent: ComponentCompiled): ComponentInstance {
    function invoke(params: Dictionary<unknown>) {
        const symbol = compiledComponent.attributes.symbol as string
        const value = compiledComponent.attributes.value as string
        params[symbol] = value === undefined ? null : value
    }

    return {
        ...compiledComponent,
        invoke
    }
}


const astNode: AstNodeDetails = {
    node: schema => new TaggedNode(type, 'def', {
        symbol: {
            target: 'attribute',
            validate: isStringValidator
        },
        value: {
            target: 'attribute',
            validate: alwaysTrueValidator,
            optional: true
        }
    }),
    tags: ['fn-step']
}

export const defineVarComponent: NodeDetails = {
    id: type,
    loader,
    astNode
}