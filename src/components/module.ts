import { ComponentInstance, ComponentCompiled, NodeDetails } from "./runtime";
import { Dictionary } from "lodash";
import { AstNodeDetails } from "../component-schema/schema";
import { isStringValidator } from "../component-schema/validators";
import { TaggedNode } from "../component-schema/node-schema-tagged";


const type = 'module'

function loader(compiledComponent: ComponentCompiled): ComponentInstance {
    function invoke(params: Dictionary<unknown>) {
        const definitions = compiledComponent.children.definitions

        return definitions.reduce<Dictionary<ComponentInstance>>((previous, current) => {
            previous[current.attributes.name as string] = current;
            return previous
        }, {})
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
            validate: isStringValidator,
        },
        definitions: {
            target: 'child',
            child: schema.refTags('definition')
        }
    }),
    tags: ['root']
}

export const moduleComponent: NodeDetails = {
    id: type,
    loader,
    astNode
}