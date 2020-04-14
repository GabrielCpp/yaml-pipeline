import { Schema, AstNodeDetails } from "./schema";
import { Dictionary } from "lodash";
import { TaggedNode } from './node-schema-tagged';


describe('Schema', () => {
    let schema: Schema;

    beforeEach(() => {
        schema = new Schema({
            'node-a': {
                node: s => new TaggedNode('test-type-a', 'test-a', {

                }),
                tags: ['test-tag']
            },
            'node-b': {
                node: s => new TaggedNode('test-ytype-b', 'test-b', {

                }),
                tags: ['test-tag']
            }
        })
    })

    it('Given node ids should get all node', () => {
        const expectedTypes = [
            'test-type-a',
            'test-ytype-b'
        ]

        const idIteratorCreator = schema.refIds('node-a', 'node-b')
        const actualTypes = Array.from(idIteratorCreator()).map(x => x.type);

        expect(actualTypes).toEqual(expectedTypes)
    });

    it('Given node by tag should get all node', () => {
        const expectedTypes = [
            'test-type-a',
            'test-ytype-b'
        ]

        const idIteratorCreator = schema.refTags('test-tag')
        const actualTypes = Array.from(idIteratorCreator()).map(x => x.type);

        expect(actualTypes).toEqual(expectedTypes)
    });
})