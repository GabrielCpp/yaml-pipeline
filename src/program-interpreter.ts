import { ComponentLoader, Runtime } from "./component-runtime/runtime";
import { AstNodeDetails, Schema } from "./component-schema/schema";
import { Dictionary } from "lodash";


export interface NodeDetails {
  id: string;
  loader: ComponentLoader;
  astNode: AstNodeDetails
}

export class AstInterpreter {
  private schema: Schema;
  private runtime: Runtime;

  public constructor(nodeDetails: NodeDetails[]) {
    const schemaNode: Dictionary<AstNodeDetails> = nodeDetails.reduce<Dictionary<AstNodeDetails>>((previous, current) => {
      previous[current.id] = current.astNode;
      return previous;
    }, {});

    this.schema = new Schema(schemaNode)

    const componentLoaders: Dictionary<ComponentLoader> = nodeDetails.reduce<Dictionary<ComponentLoader>>((previous, current) => {
      previous[current.id] = current.loader;
      return previous;
    }, {});

    this.runtime = new Runtime(new Map<string, ComponentLoader>(Object.entries(componentLoaders)));
  }

  public async run(entrySymbolName: string, yamlTree: object): Promise<any> {
    const result = this.schema.load('root', yamlTree)

    if (result.errors.length > 0) {
      console.error(JSON.stringify(result.errors, null, 2))
      return;
    }

    const entryModule = this.runtime.addModule(result.component)
    return await this.runtime.findDefinition(entryModule, entrySymbolName).invoke({})
  }
}