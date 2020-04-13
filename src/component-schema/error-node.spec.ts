import faker from 'faker';
import { ErrorNode } from './error-node';
import { createAstContext, newComponentLoadResult, newMatchingError } from './ast-node';
import { createComponent } from './component';

describe('error-node', () => {
    const message = 'Critical failure';
    let errorNode: ErrorNode;

    beforeEach(() => {
        errorNode = new ErrorNode(message);
    })

    it('Given any node should identity should always be true', () => {
        const actual = errorNode.hasIdentity(faker.random.alphaNumeric())
        expect(actual).toBe(true);
    })

    it('Given any node should give error on loading', () => {
        const context = createAstContext('root');
        const expectedComponent = newComponentLoadResult(
            createComponent('empty'), [
            newMatchingError(message, context)
        ]);

        const actualLoadResult = errorNode.load(faker.random.alphaNumeric(), context)

        expect(actualLoadResult).toEqual(expectedComponent);
    })
})