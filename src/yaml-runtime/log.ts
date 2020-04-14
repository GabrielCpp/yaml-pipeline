import { ComponentCompiled, ComponentInstance, NodeDetails } from "./runtime";
import { Dictionary } from "lodash";
import { AstNodeDetails } from "../yaml-schema/schema";
import { alwaysTrueValidator } from "../yaml-schema/validators";
import { TaggedNode } from "../yaml-schema/node-schema-tagged";
import { TargetBucket } from "../yaml-schema/node-schema";

const type = 'log'

function loader(compiledComponent: ComponentCompiled): ComponentInstance {
    async function invoke(params: Dictionary<unknown>) {
        let value = compiledComponent.attributes.value;

        if (value === undefined) {
            value = await compiledComponent.properties.value.invoke(params);
        }

        console.log(value)
    }

    return {
        ...compiledComponent,
        invoke
    }
}


const astNode: AstNodeDetails = {
    node: schema => new TaggedNode('log', 'log', {
        value: {
            target: new Set<TargetBucket>(['attribute', 'property']),
            validate: alwaysTrueValidator,
            property: schema.refTags('symbol-ref')
        }
    }),
    tags: ['fn-step']
}

export const logComponent: NodeDetails = {
    id: type,
    loader,
    astNode
}