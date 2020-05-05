import { Dictionary, mapValues } from "lodash";
import { AstNodeDetails } from "../yaml-schema/schema";
import { Component } from "../yaml-schema/component";
import { ModuleLoader } from '../yaml-schema/module-loader';
import { parseYaml } from "./yaml-loader";

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

export type ComponentLoader = (component: ComponentCompiled, module: Module, runtime: Runtime) => ComponentInstance;

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
    private componentLoaders: Map<string, ComponentLoader>;
    private moduleLoader: ModuleLoader;

    public constructor(nodeDetails: NodeDetails[]) {
        this.moduleLoader = new ModuleLoader(buildAstNodeDetailsFromList(nodeDetails));
        this.componentLoaders = buildComponentLoaderMapFromNodeDetails(nodeDetails);
        this.buildComponentInstance = this.buildComponentInstance.bind(this);
    }

    public loadYaml(text: string) {
        const loadedYaml = parseYaml(text)

        if (!Array.isArray(loadedYaml)) {
            throw new Error('Yaml root must be an array.');
        }

        const components = this.moduleLoader.loadModule(loadedYaml);
        const currentModule: Module = {
            definitions: [],
            dependencies: [],
            name: ''
        }

        for (const component of components) {
            const componentInstance = this.buildComponentInstance(component, currentModule)
            currentModule.definitions.push(componentInstance);
        }
    }

    public run(moduleName: string, typeName: string, params: Dictionary<unknown>) {
        const result = this.getModuleByName(moduleName).definitions.find(s => s.type === typeName)

        if (result !== undefined) {
            result.invoke(params)
        }
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
        const loader = this.componentLoaders.get(component.type);

        if (loader === undefined) {
            throw new Error(`No such component loader for ${component.type}`)
        }

        const loadComponentInstance = (c: Component) => this.buildComponentInstance(c, module_)
        const componentCompiled: ComponentCompiled = {
            type: component.type,
            attributes: component.attributes,
            properties: mapValues(component.properties, loadComponentInstance),
            children: mapValues(component.children, childs => childs.map(loadComponentInstance)),
        }

        return loader(componentCompiled, module_, this);
    }
}