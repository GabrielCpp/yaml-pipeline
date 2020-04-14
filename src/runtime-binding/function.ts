import { ComponentCompiled, ComponentInstance, NodeDetails } from "./runtime";
import { Dictionary } from "lodash";
import { AstNodeDetails } from "../yaml-schema/schema";
import { isStringValidator } from "../yaml-schema/validators";
import { TaggedNode } from "../yaml-schema/node-schema-tagged";

const type = 'fn'

function loader(compiledComponent: ComponentCompiled): ComponentInstance {
    async function invoke(params: Dictionary<unknown>) {
        const steps = compiledComponent.children.steps || [];

        for (const step of steps) {
            await step.invoke(params)
        }
    }

    return {
        ...compiledComponent,
        invoke
    }
}

const astNode: AstNodeDetails = {
    node: schema => new TaggedNode(type, type, {
        name: {
            target: 'attribute',
            validate: isStringValidator
        },
        steps: {
            target: 'child',
            child: schema.refTags('fn-step')
        }
    }),
    tags: ['definition']
}

export const functionComponent: NodeDetails = {
    id: type,
    loader,
    astNode
}