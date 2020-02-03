import { ComponentCompiled, ComponentInstance } from "../component-runtime/runtime";
import { Dictionary } from "lodash";
import { AstNodeDetails } from "../component-schema/schema";
import { isStringValidator } from "../component-schema/validators";
import { TaggedNode } from "../component-schema/tagged-node";
import { NodeDetails } from "../program-interpreter";

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