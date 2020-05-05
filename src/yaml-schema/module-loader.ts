import { Schema, AstNodeDetails } from "./schema";
import { AstNode, createAstContext } from "./ast-node";
import { Dictionary, mapValues } from "lodash";
import { findMatchingNodeOrUndefined } from "./schema-utils";
import { Component } from './component';

export type TransitionPair = [() => IterableIterator<AstNode>, () => ModuleDefinition]
export type ModuleTransitionBuilder = (moduleLoader: ModuleLoader, schema: Schema) => TransitionPair[]

export interface ModuleDefinition {
    id: string;
    transitions: TransitionPair[]
}

export class ModuleLoader {
    private moduleDefinition = new Map<string, ModuleDefinition>();
    private startDefinitionId: string;
    private schema: Schema;

    public constructor(astNodeDetails: Dictionary<AstNodeDetails> = {}, moduleDefinition: Dictionary<ModuleTransitionBuilder> = {}) {
        this.schema = new Schema(astNodeDetails);
        this.startDefinitionId = 'root';
        this.addDefinitions(moduleDefinition)
    }

    public refModule(id: string): () => ModuleDefinition {
        return () => {
            const moduleDefinition = this.moduleDefinition.get(id);

            if (moduleDefinition === undefined) {
                throw new Error(`Module ${id} dot not exist`)
            }

            return moduleDefinition;
        }
    }

    public addDefinitions(moduleDefinition: Dictionary<ModuleTransitionBuilder>) {
        for (const [id, transitionBuilder] of Object.entries(moduleDefinition)) {
            this.addDefinition(id, transitionBuilder);
        }
    }

    public addDefinition(id: string, transitionBuilder: ModuleTransitionBuilder): ModuleLoader {
        this.moduleDefinition.set(id, {
            id,
            transitions: transitionBuilder(this, this.schema)
        });

        return this;
    }

    public loadModule(moduleRootNode: unknown[]): Component[] {
        let definition: ModuleDefinition | undefined = this.moduleDefinition.get(this.startDefinitionId)
        const definitions: Component[] = [];

        if (definition === undefined) {
            throw new Error(`Root definition ${this.startDefinitionId} was not found.`);
        }

        for (const currentModuleNode of moduleRootNode) {
            let result: AstNode | undefined;

            for (const [astNodesEnumerator, nextDefinition] of definition.transitions) {
                result = findMatchingNodeOrUndefined(currentModuleNode, astNodesEnumerator);

                if (result !== undefined) {
                    const componentLoadResult = result.load(currentModuleNode, createAstContext(this.startDefinitionId));

                    if (componentLoadResult.errors.length > 0) {
                        throw new Error(`Component containt error ${JSON.stringify(componentLoadResult.errors)}`);
                    }

                    definitions.push(componentLoadResult.component);
                    definition = nextDefinition()
                }
            }

            if (result === undefined) {
                throw new Error(`No matching node`);
            }
        }

        return definitions
    }
}