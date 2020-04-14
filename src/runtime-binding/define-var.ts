import { ComponentCompiled, ComponentInstance, NodeDetails } from "./runtime";
import { Dictionary } from "lodash";
import { AstNodeDetails } from "../yaml-schema/schema";
import { isStringValidator, alwaysTrueValidator } from "../yaml-schema/validators";
import { TaggedNode } from "../yaml-schema/node-schema-tagged";

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