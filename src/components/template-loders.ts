import { ComponentCompiled, ComponentInstance } from "../component-schema/runtime";
import { Dictionary } from "lodash";
import nunjucks from 'nunjucks';

export function renderLoader(compiledComponent: ComponentCompiled): ComponentInstance {
    function invoke(params: Dictionary<unknown>) {
        const path = compiledComponent.attributes.path as string;
        return nunjucks.render(path, params);
    }

    return {
        ...compiledComponent,
        invoke
    }
}

