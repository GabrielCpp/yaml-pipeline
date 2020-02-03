import yaml from 'js-yaml';
import fs from 'fs';

export function loadYamlFromFile(path: string) {
  return yaml.safeLoad(fs.readFileSync(path, 'utf8'));
}

export function yamlText(literals: TemplateStringsArray, ...placeholders: string[]) {
  return yaml.safeLoad(literals.join(''));
}