export interface IComponent {
    packagePath: string[];
    name: string;
    type: string;
    discriminator: string;
    kind: string;
    dependencies: IComponent[]
}

export interface IBinding {
    name: string;
    type: string;
    default: string;
}

export interface Pod extends IComponent {
    fieldByNames: Map<string, IBinding>;
}

export function createPod(
    name: string,
    kind: string,
    fieldByNames: Map<string, IBinding>
): Pod {
    return {
        dependencies: [],
        packagePath: [],
        name,
        type: 'class',
        discriminator: 'pod',
        kind,
        fieldByNames
    }
}


export interface IMethod extends IComponent {
    params: IBinding[]
    outputType: string
}

export interface IServiceContract {
    external: boolean
    methods: IMethod[]
}

export interface ITestArrage {

}
export interface ITestAct {

}

export interface ITestAssert {

}

export interface IUnitTest {
    targetType: string;
    arange: ITestArrage[];
    act: ITestAct;
    assert: ITestAssert[];
}

export interface IApplicationDefinition {
    packages: Map<string, Map<string, IComponent>>;
}

function* getAppComponets(app: IApplicationDefinition): Iterable<IComponent> {
    for (const packageComponentByName of app.packages.values()) {
        for (const component of packageComponentByName.values()) {
            yield component
        }
    }
}

export interface File {
    path: string;
    content: string;
}

function createFile(path: string, content: string): File {
    return {
        path,
        content
    }
}

class Aggregator {
    public result = '';
    public indent = '    ';
    private depth: number = 0;

    public write(chunk: string): void {
        this.result += `${this.indent.repeat(this.depth)}${chunk}`;
    }

    public writeLine(line: string): void {
        this.result += `${this.indent.repeat(this.depth)}${line}\n`;
    }

    public endl(count = 1): void {
        this.result += '\n'.repeat(count);
    }

    public scope(buildInner: (aggregator: Aggregator) => void): void {
        this.depth++;
        buildInner(this);
        this.depth--
    }
}

type ComponentHandler = (component: unknown) => File;

function dotJoin(elements: string[]) {
    return elements.join('.');
}

function buildPyPod(component: unknown): File {
    const pod = component as Pod;
    const fileContent = new Aggregator()

    fileContent.writeLine('from dataclasses import dataclass')

    for (const dependency of pod.dependencies) {
        fileContent.writeLine(`from ${dotJoin(dependency.packagePath)} import ${dependency.name}`)
    }

    fileContent.endl(2)

    fileContent.writeLine('@dataclass')
    fileContent.writeLine(`class ${pod.name}`)
    fileContent.scope(() => {
        for (const [name, fieldComponent] of pod.fieldByNames.entries()) {
            fileContent.writeLine(`${name}: ${fieldComponent.name}`)
        }
    })


    return createFile(pod.name, fileContent.result)
}

export class PythonTranspiler {
    public transpile(app: IApplicationDefinition): File[] {
        const files: File[] = []
        const mapping = new Map<string, ComponentHandler>([
            ['pod', buildPyPod]
        ])

        for (const component of getAppComponets(app)) {
            const handler = mapping.get(component.discriminator)

            if (handler === undefined) {
                throw new Error("No such handler")
            }

            handler(component)
        }

        return files;
    }
}