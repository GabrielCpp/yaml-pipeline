import { Dictionary, last, mapValues, isString, isObject, isFunction, get } from "lodash";
import { Component } from '../component-schema/component';
import { ComponentInstance } from './runtime';


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

export interface Module {
  definitions: Map<string, ComponentInstance>;
}

export type ComponentLoader = (component: ComponentCompiled, runtime: Runtime) => ComponentInstance;

export class Runtime {
  private modules = new Map<string, Module>();

  public constructor(public componentLoaders: Map<string, ComponentLoader>) {
    this.load = this.load.bind(this);
  }

  public load(component: Component): ComponentInstance {
    if (!this.componentLoaders.has(component.type)) {
      throw new Error(`No such component loader for ${component.type}`)
    }

    const loader = this.componentLoaders.get(component.type) as ComponentLoader;

    const componentCompiled: ComponentCompiled = {
      type: component.type,
      attributes: component.attributes,
      properties: mapValues(component.properties, this.load),
      children: mapValues(component.children, childs => childs.map(this.load))
    }

    return loader(componentCompiled, this);
  }

  public addModule(component: Component): string {
    const instance = this.load(component);
    const moduleName = instance.attributes.name;
    const definitions = instance.invoke({});

    if (!isString(moduleName)) {
      throw new Error(`Module name must be a string`);
    }

    if (!isObject(definitions)) {
      throw new Error(`Module definitions must be an object`);
    }

    if (!Object.values(definitions as object).every(d => isFunction(get(d, 'invoke')))) {
      throw new Error(`Module definitions must be objets of component instance`);
    }

    this.modules.set(moduleName, {
      definitions: new Map<string, ComponentInstance>(Object.entries(definitions as Dictionary<ComponentInstance>))
    })

    return moduleName;
  }

  public findDefinition(moduleName: string, definitionName: string) {
    const module_ = this.modules.get(moduleName);

    if (module_ === undefined) {
      throw new Error(`No module named ${moduleName}`)
    }

    const definition = module_.definitions.get(definitionName);

    if (definition === undefined) {
      throw new Error(`Nod such definition ${definitionName} in module ${moduleName}`)
    }

    return definition;
  }
}