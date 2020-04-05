import { Schema, AstNodeDetails } from "./schema";
import { AstNode, createAstContext } from "./ast-node";
import { Dictionary, mapValues } from "lodash";
import { findMatchingNodeOrUndefined } from "./schema-utils";
import { ComponentInstance, Module } from "./runtime";
import { Component } from './component';

export interface ComponentCompiled {
    type: string;
    attributes: Dictionary<string | number | boolean>
    properties: Dictionary<ComponentInstance>
    children: Dictionary<ComponentInstance[]>
}

export type ComponentLoader = (component: ComponentCompiled, module: Module) => ComponentInstance;
export type TransitionPair = [() => IterableIterator<AstNode>, () => ModuleDefinition]

export interface ModuleDefinition {
    id: string;
    transitions: TransitionPair[]
}

export interface NodeDetails {
    id: string;
    loader: ComponentLoader;
    astNode: AstNodeDetails
}


function buildAstNodeDetailsFromList(nodeDetails: NodeDetails[]): Dictionary<AstNodeDetails> {
    const schemaNode: Dictionary<AstNodeDetails> = nodeDetails.reduce<Dictionary<AstNodeDetails>>((previous, current) => {
        previous[current.id] = current.astNode;
        return previous;
    }, {});

    return schemaNode;
}

function buildComponentLoaderMapFromNodeDetails(nodeDetails: NodeDetails[]): Map<string, ComponentLoader> {
    const componentLoaders: Dictionary<ComponentLoader> = nodeDetails.reduce<Dictionary<ComponentLoader>>((previous, current) => {
        previous[current.id] = current.loader;
        return previous;
    }, {});

    return new Map<string, ComponentLoader>(Object.entries(componentLoaders));
}

export class ModuleLoader {
    private moduleDefinition = new Map<string, ModuleDefinition>();
    private startDefinitionId: string;
    private schema: Schema;
    private componentLoaders: Map<string, ComponentLoader>

    public constructor(nodeDetails: NodeDetails[]) {
        this.schema = new Schema(buildAstNodeDetailsFromList(nodeDetails));
        this.componentLoaders = buildComponentLoaderMapFromNodeDetails(nodeDetails);
        this.buildComponentInstance = this.buildComponentInstance.bind(this);
        this.startDefinitionId = 'root';
    }

    public addDefinition(id: string, transitionBuilder: (schema: Schema) => TransitionPair[]) {
        this.moduleDefinition.set(id, {
            id,
            transitions: transitionBuilder(this.schema)
        });
    }


    public loadModule(moduleRootNode: any[]): Module {
        let definition: ModuleDefinition | undefined = this.moduleDefinition.get(this.startDefinitionId)
        const moduleLoaded: Module = {
            definitions: [],
            dependencies: [],
            name: '',
        }

        if (definition === undefined) {
            throw new Error();
        }

        for (const currentModuleNode of moduleRootNode) {
            let result: AstNode | undefined;

            for (const [astNodesEnumerator, nextDefinition] of definition.transitions) {
                result = findMatchingNodeOrUndefined(currentModuleNode, astNodesEnumerator);

                if (result !== undefined) {
                    const componentLoadResult = result.load(currentModuleNode, createAstContext(this.startDefinitionId));

                    if (componentLoadResult.errors.length > 0) {
                        throw new Error();
                    }

                    const componentInstance = this.buildComponentInstance(componentLoadResult.component, moduleLoaded);
                    moduleLoaded.definitions.push(componentInstance);
                    definition = nextDefinition()
                }
            }

            if (result === undefined) {
                throw new Error();
            }
        }

        return moduleLoaded
    }

    private buildComponentInstance(component: Component, module_: Module): ComponentInstance {
        const loadComponentInstance = (component: Component) => {
            if (!this.componentLoaders.has(component.type)) {
                throw new Error(`No such component loader for ${component.type}`)
            }

            const loader = this.componentLoaders.get(component.type) as ComponentLoader;
            const componentCompiled: ComponentCompiled = {
                type: component.type,
                attributes: component.attributes,
                properties: mapValues(component.properties, loadComponentInstance),
                children: mapValues(component.children, childs => childs.map(loadComponentInstance))
            }

            return loader(componentCompiled, module_);
        }

        return loadComponentInstance(component)
    }
}