import { Dictionary, mapValues } from "lodash";
import { AstNodeDetails } from "../component-schema/schema";
import { Component } from "../component-schema/component";
import { ModuleLoader } from '../component-schema/module-loader';

export interface ComponentInstance {
    type: string;
    attributes: Dictionary<string | number | boolean>
    properties: Dictionary<ComponentInstance>
    children: Dictionary<ComponentInstance[]>
    invoke(params: Dictionary<unknown>): any
}

export interface ComponentCompiled {
    type: string;
    attributes: Dictionary<string | number | boolean>
    properties: Dictionary<ComponentInstance>
    children: Dictionary<ComponentInstance[]>
}

export type ComponentLoader = (component: ComponentCompiled, module: Module) => ComponentInstance;

export interface NodeDetails {
    id: string;
    loader: ComponentLoader;
    astNode: AstNodeDetails
}


export interface Module {
    name: string;
    dependencies: Module[];
    definitions: ComponentInstance[];
}

function buildComponentLoaderMapFromNodeDetails(nodeDetails: NodeDetails[]): Map<string, ComponentLoader> {
    const componentLoaders: Dictionary<ComponentLoader> = nodeDetails.reduce<Dictionary<ComponentLoader>>((previous, current) => {
        previous[current.id] = current.loader;
        return previous;
    }, {});

    return new Map<string, ComponentLoader>(Object.entries(componentLoaders));
}


function buildAstNodeDetailsFromList(nodeDetails: NodeDetails[]): Dictionary<AstNodeDetails> {
    const schemaNode: Dictionary<AstNodeDetails> = nodeDetails.reduce<Dictionary<AstNodeDetails>>((previous, current) => {
        previous[current.id] = current.astNode;
        return previous;
    }, {});

    return schemaNode;
}



export class Runtime {
    private modules = new Map<string, Module>();
    private moduleLoader: ModuleLoader;
    private componentLoaders: Map<string, ComponentLoader>;
    private startDefinitionId: string;

    public constructor(nodeDetails: NodeDetails[]) {
        this.moduleLoader = new ModuleLoader(buildAstNodeDetailsFromList(nodeDetails));
        this.componentLoaders = buildComponentLoaderMapFromNodeDetails(nodeDetails);
        this.buildComponentInstance = this.buildComponentInstance.bind(this);
        this.startDefinitionId = 'root';
    }

    public addModule(module: Module) {
        this.modules.set(module.name, module);
    }

    public getModuleByName(name: string): Module {
        const module_ = this.modules.get(name);

        if (module_ === undefined) {
            throw new Error(`Unkown module ${module_}`)
        }

        return module_;
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