import { Dictionary } from "lodash";

export interface Component {
    type: string;
    decorators: Dictionary<unknown>
    attributes: Dictionary<string | number | boolean>
    properties: Dictionary<Component>
    children: Dictionary<Component[]>
}

export function newComponent(
    type: string,
    attributes: { [id: string]: string | number | boolean } = {},
    properties: { [id: string]: Component } = {},
    children: { [id: string]: Component[] } = {},
    decorators: { [id: string]: any } = {}
): Component {
    return {
        type,
        decorators,
        attributes,
        properties,
        children
    }
}