import { ComponentCompiled, ComponentInstance } from "../component-runtime/runtime";
import { Dictionary } from "lodash";
import { AstNodeDetails } from "../component-schema/schema";
import { alwaysTrueValidator } from "../component-schema/validators";
import { TaggedNode } from "../component-schema/tagged-node";
import { NodeDetails } from "../program-interpreter";
import { TargetBucket } from "../component-schema/node-schema";

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