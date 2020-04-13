import { createComponent, Component } from './component';
import { MatchingError, ComponentLoadResult, AstNode, createAstContext, newComponentLoadResult } from './ast-node';
import { TaggedNode } from './node-schema-tagged';

function* yieldAll<T>(...params: T[]): IterableIterator<T> {
    for (const value of params) {
        yield value;
    }
}

function mockAstNode(
    type: string,
    loadedComponent: Component,
    identity: boolean = true,
    errors: MatchingError[] = []
) {
    return {
        type,
        hasIdentity: jest.fn<boolean, [any]>().mockReturnValue(identity),
        load: jest.fn<ComponentLoadResult, [any]>()
            .mockReturnValue(newComponentLoadResult(loadedComponent, errors))
    }
}

describe('ObjectNode', () => {
    it('Given no identity should identity not match', () => {
        const node = new TaggedNode('x', 'query', {});
        const actualIdentityCheck = node.hasIdentity({})
        expect(actualIdentityCheck).toBe(false);
    })

    it('Given correct identity should identity match', () => {
        const node = new TaggedNode('x', 'query', {});
        const actualIdentityCheck = node.hasIdentity({ kind: 'query' })
        expect(actualIdentityCheck).toBe(true);
    })

    it('Given correct node attributes should component attributes be correctly filled', () => {
        const identitfierComponent = createComponent('identitifier', { "kind": "id" });
        const identitfierNode = mockAstNode('id-node', identitfierComponent)
        const tagComponent = createComponent('tag', { "kind": "tag" });
        const tagNode = mockAstNode('tag-node', tagComponent)
        const expectedResult = newComponentLoadResult(
            createComponent(
                'query',
                {
                    "kind": "query",
                    "name": "select-all-username",
                    "query": "SELECT username FROM users"
                },
                {
                    "id": identitfierComponent
                },
                { "tags": [tagComponent, tagComponent] }
            )
        )

        const node = new TaggedNode('query', 'query', {
            "name": {
                target: 'attribute',
                validate: () => []
            },
            "query": {
                target: 'attribute',
                validate: () => []
            },
            "id": {
                target: 'property',
                property: () => yieldAll<AstNode>(identitfierNode)
            },
            "tags": {
                target: 'child',
                child: () => yieldAll<AstNode>(tagNode)
            }
        });

        const actualResult = node.load({
            "kind": "query",
            "name": "select-all-username",
            "query": "SELECT username FROM users",
            "id": {
                "kind": "id"
            },
            "tags": [
                "my-tag",
                "my-tag"
            ]
        }, createAstContext('root'))

        expect(actualResult).toEqual(expectedResult);
        expect(identitfierNode.hasIdentity.mock.calls).toEqual([[{
            "kind": "id"
        }]]);
        expect(tagNode.hasIdentity.mock.calls).toEqual([["my-tag"], ["my-tag"]]);
    });

})