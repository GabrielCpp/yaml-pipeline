import { NodeSchema } from "./node-schema"
import { AstContext, createAstContext, newComponentLoadResult, MatchingError, newMatchingError } from './ast-node';
import { newComponent } from "./component";

class NodeSchemaStub extends NodeSchema {
    public hasIdentity(node: any): boolean {
        return true;
    }
}

describe('NodeSchema', () => {
    let nodeSchema: NodeSchemaStub
    let context: AstContext
    let validateMyName: jest.Mock<MatchingError[], [any, AstContext]>

    beforeEach(() => {
        context = createAstContext('root')
        validateMyName = jest.fn();
        nodeSchema = new NodeSchemaStub('test-type', {
            'my-name': {
                target: 'attribute',
                validate: validateMyName,
                optional: true
            },
            'children': {
                target: 'child',
                optional: true,
                child: function* () {
                    yield new NodeSchemaStub('child', {
                        'name': {
                            target: 'attribute',
                            validate: () => [],
                            optional: true
                        }
                    })
                }
            },
            'status': {
                target: 'property',
                optional: true,
                property: function* () {
                    yield new NodeSchemaStub('marital-status', {
                        'is-single': {
                            target: 'attribute',
                            validate: () => [],
                            optional: true
                        }
                    })
                }
            }
        })
    })


    it('Given component with sub property should parse property', () => {
        const expectedComponent = newComponentLoadResult(
            newComponent('test-type', {}, {
                'status': newComponent('marital-status', {
                    'is-single': true
                })
            })
        )

        const actualComponent = nodeSchema.load({
            'status': {
                'is-single': true
            }
        }, context);

        expect(actualComponent).toEqual(expectedComponent)
    })


    it('Given component with child should parse child', () => {
        const expectedComponent = newComponentLoadResult(
            newComponent('test-type', {}, {}, {
                'children': [
                    newComponent('child', {
                        'name': 'John'
                    })
                ]
            })
        )

        const actualComponent = nodeSchema.load({
            'children': [
                {
                    'name': 'John'
                }
            ]
        }, context);

        expect(actualComponent).toEqual(expectedComponent)
    })

    it('Given basic static component should get attribute in component', () => {
        const expectedComponent = newComponentLoadResult(
            newComponent('test-type', {
                'my-name': 'Gabriel'
            })
        )

        validateMyName.mockReturnValue([])

        const actualComponent = nodeSchema.load({
            'my-name': 'Gabriel'
        }, context);

        expect(actualComponent).toEqual(expectedComponent)
    })

    it('Given ill formed attribute should say it do not exist', () => {
        const expectedComponent = newComponentLoadResult(
            newComponent('test-type'),
            [
                newMatchingError("No key 'not-exist' in possible keys {my-name, children, status}", context)
            ]
        )

        validateMyName.mockReturnValue([])

        const actualComponent = nodeSchema.load({
            'not-exist': 'Gabriel'
        }, context);

        expect(actualComponent).toEqual(expectedComponent)
    })
})