import { ModuleLoader } from "./module-loader";
import { TaggedNode } from "./node-schema-tagged";
import { Component, newComponent } from "./component";

describe('ModuleLoader', () => {
    let moduleLoader: ModuleLoader;

    beforeEach(() => {
        moduleLoader = new ModuleLoader({
            'node-a': {
                node: s => new TaggedNode('node-type-a', 'node-kind-a', {
                    'my-name': {
                        target: 'attribute',
                        validate: () => []
                    }
                }),
                tags: []
            },
            'node-b': {
                node: s => new TaggedNode('node-type-b', 'node-kind-b', {
                    'his-name': {
                        target: 'attribute',
                        validate: () => []
                    }
                }),
                tags: []
            }
        })
    })

    it('Given module sequence should contrain order', () => {
        const expectedComponents: Component[] = [
            newComponent('node-type-a', {
                'kind': 'node-kind-a',
                'my-name': 'Gab'
            }),
            newComponent('node-type-b', {
                'kind': 'node-kind-b',
                'his-name': 'Vince'
            })
        ];

        moduleLoader.addDefinition('root', (loader, schema) => [
            [schema.refIds('node-a'), loader.refModule('module-b')]
        ]);

        moduleLoader.addDefinition('module-b', (loader, schema) => [
            [schema.refIds('node-b'), loader.refModule('module-b')]
        ]);

        const actualComponents = moduleLoader.loadModule([
            {
                'kind': 'node-kind-a',
                'my-name': 'Gab'
            },
            {
                'kind': 'node-kind-b',
                'his-name': 'Vince'
            }
        ])

        expect(actualComponents).toEqual(expectedComponents);
    });
})