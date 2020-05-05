import yaml from 'js-yaml';

export function yamlText(literals: TemplateStringsArray, ...placeholders: string[]) {
    return yaml.safeLoad(literals.join(''));
}

export function parseYaml(text: string): any {
    return yaml.safeLoad(text);
}