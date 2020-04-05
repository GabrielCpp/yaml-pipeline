import { Dictionary } from "lodash";

export interface ComponentInstance {
    type: string;
    attributes: Dictionary<string | number | boolean>
    properties: Dictionary<ComponentInstance>
    children: Dictionary<ComponentInstance[]>
    invoke(params: Dictionary<unknown>): any
}

export interface Module {
    name: string;
    dependencies: Module[];
    definitions: ComponentInstance[];
}

export class Runtime {
    private modules = new Map<string, Module>();

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
}