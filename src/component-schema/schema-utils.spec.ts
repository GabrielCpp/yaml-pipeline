import { findMatchingNodeOrUndefined } from './schema-utils'
import { AstNode } from './ast-node';

describe('findMatchingNodeOrUndefined', () => {
    it('given node should get first matching handlers', () => {
        const node: unknown = {};
        const hasIdentityMock = jest.fn()
        const astNode: AstNode = {
            type: 'test',
            hasIdentity: hasIdentityMock.mockReturnValueOnce(true),
            load: jest.fn()
        }


        const actualResult = findMatchingNodeOrUndefined(node, function* () { yield astNode; });

        expect(actualResult).toBe(astNode)
        expect(hasIdentityMock.mock.calls).toEqual([[node]])
    })
})