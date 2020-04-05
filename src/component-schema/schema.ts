import { AstNode, createAstContext, ComponentLoadResult } from "./ast-node";
import { Dictionary } from "lodash";
import { findMatchingNode } from "./schema-utils";


export interface AstNodeDetails {
    node: (schema: Schema) => AstNode
    tags: string[]
}

export class Schema {
    private nodeById = new Map<string, AstNode>();
    private nodeByTags = new Map<string, AstNode[]>();


    public constructor(schema: Dictionary<AstNodeDetails> = {}) {
        Object.entries(schema).forEach(([id, schemaNode]) => this.addNode(id, schemaNode.node(this), schemaNode.tags))
    }

    public addNode(id: string, node: AstNode, tags: string[] = []): Schema {
        this.nodeById.set(id, node);

        for (const tag of tags) {
            if (this.nodeByTags.has(tag)) {
                this.nodeByTags.get(tag)!.push(node);
            }
            else {
                this.nodeByTags.set(tag, [node]);
            }
        }

        return this;
    }

    public getNodeById(id: string): AstNode {
        if (!this.nodeById.has(id)) {
            throw new Error(`No such node id ${id}`);
        }

        return this.nodeById.get(id) as AstNode;
    }

    public getNodeByTag(tag: string): AstNode[] {
        if (!this.nodeByTags.has(tag)) {
            throw new Error(`No such node tag ${tag}`);
        }

        return this.nodeByTags.get(tag) || [];
    }

    public refEverything(): () => IterableIterator<AstNode> {
        return () => this.enumerateEverythings();
    }

    public refIds(...ids: string[]): () => IterableIterator<AstNode> {
        return () => this.enumerateNodeIds(ids)
    }

    public refTags(...tags: string[]): () => IterableIterator<AstNode> {
        return () => this.enumerateNodeTags(tags);
    }

    private *enumerateNodeIds(ids: string[]): IterableIterator<AstNode> {
        for (const id of ids) {
            yield this.getNodeById(id);
        }
    }

    private *enumerateNodeTags(tags: string[]): IterableIterator<AstNode> {
        for (const tag of tags) {
            for (const node of this.getNodeByTag(tag)) {
                yield node;
            }
        }
    }

    private *enumerateEverythings(): IterableIterator<AstNode> {
        for (const node of this.nodeById.values()) {
            yield node;
        }

        for (const nodes of this.nodeByTags.values()) {
            for (const node of nodes) {
                yield node;
            }
        }
    }
}
