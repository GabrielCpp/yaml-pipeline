import { yamlText } from "./yaml-loader";
import { moduleComponent } from "./components/module";
import { functionComponent } from "./components/function";
import { logComponent } from "./components/log";
import { defineVarComponent } from "./components/define-var";
import { readVarComponent } from "./components/readvar";
import { ModuleLoader, NodeDetails } from "./component-schema/module-loader";

const yamlTree = yamlText`

kind: module
name: test
definitions:
- kind: fn
  name: main
  steps:
  - kind: def
    symbol: example
    value: 'test' 
  - kind: log
    value: 'Hello world!'
  - kind: log
    value: {symbol: example}
    
`;

const entrySymbolName = 'main'

const components: NodeDetails[] = [
    moduleComponent,
    functionComponent,
    logComponent,
    defineVarComponent,
    readVarComponent
];

function main() {
    var interpreter = new ModuleLoader(components)
    interpreter.loadModule(yamlTree)
}

main()