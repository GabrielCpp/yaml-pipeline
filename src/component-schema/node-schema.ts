import { AstNode, ComponentLoadResult, MatchingError, AstContext, addTrace } from "./ast-node";
import { createComponent, Component } from "./component";
import { findMatchingNode } from './schema-utils';
import { Dictionary, isObject } from "lodash";
import { isString, isNumber, isBoolean } from "util";

export type TargetBucket = 'attribute' | 'property' | 'child';
export type NodeValidator = (node: any, context: AstContext) => MatchingError[];

export interface ObjectNodeKeyDetails {
    target: TargetBucket | Set<TargetBucket>;
    child?: () => IterableIterator<AstNode>
    property?: () => IterableIterator<AstNode>
    message?: string;
    validate?: NodeValidator;
    optional?: boolean;
}

interface LoadingDetails {
    nodeKey: string;
    nodeValue: any;
    keyDetail: ObjectNodeKeyDetails;
    result: ComponentLoadResult;
    context: AstContext
}

export abstract class NodeSchema implements AstNode {
    private nodeBucketFilters: Array<[(value: any) => boolean, TargetBucket, (details: LoadingDetails) => void]> = [
        [nodeValue => isString(nodeValue) || isNumber(nodeValue) || isBoolean(nodeValue), 'attribute', this.addAttribute],
        [nodeValue => Array.isArray(nodeValue), 'child', this.addChild],
        [nodeValue => isObject(nodeValue), 'property', this.addProperty.bind(this)],
    ]

    public constructor(
        public type: string,
        private keys: { [id: string]: ObjectNodeKeyDetails }
    ) {

    }

    public abstract hasIdentity(node: any): boolean;

    public load(node: any, context: AstContext): ComponentLoadResult {
        const result: ComponentLoadResult = {
            errors: [],
            component: createComponent(this.type)
        }

        if (!Array.isArray(node) && isObject(node)) {
            this.detectMissingKeys(node, result, context);
        }


        const entries = Object.entries(node).sort(([keyA]: [string, any], [keyB]: [string, any]) => keyA.localeCompare(keyB))

        for (let [nodeKey, nodeValue] of entries) {
            if (this.keys.hasOwnProperty(nodeKey)) {
                this.applyTargetAction(nodeKey, nodeValue, result, context);
            }
            else {
                result.errors.push({
                    error: `No key '${nodeKey}' in possible keys {${Object.keys(this.keys).join(', ')}}`,
                    context
                });
            }
        }

        return result;
    }

    private applyTargetAction(nodeKey: string, nodeValue: any, result: ComponentLoadResult, context: AstContext) {
        const keyDetail = this.keys[nodeKey]
        const targets: Set<TargetBucket> = isString(keyDetail.target) ? new Set<TargetBucket>([keyDetail.target]) : keyDetail.target;

        for (const [isInThisBucket, bucketName, addInBucket] of this.nodeBucketFilters) {
            if (isInThisBucket(nodeValue)) {
                if (targets.has(bucketName)) {
                    addInBucket({ nodeKey, nodeValue, keyDetail, result, context })
                    break;
                }
                else {
                    result.errors.push({
                        error: `Key'${nodeKey}' cannot be a ${bucketName} only ${Array.from(targets.values()).join(', ')}`,
                        context
                    })
                }
            }
        }
    }

    private detectMissingKeys(node: object, result: ComponentLoadResult, context: AstContext): void {
        for (const key of Object.keys(this.keys)) {
            if (!node.hasOwnProperty(key) && this.keys[key].optional !== true) {
                result.errors.push({
                    error: `Missing required key '${key}' in ${Object.keys(node).join(', ')}.`,
                    context
                })
            }
        }
    }

    private addAttribute({ nodeKey, nodeValue, keyDetail, result, context }: LoadingDetails): void {
        if (keyDetail.validate === undefined) throw new Error(`Attribute ${nodeKey} require a validator`);

        const errors = keyDetail.validate(nodeValue, context)

        if (errors.length === 0) {
            result.component.attributes[nodeKey] = nodeValue;
        } else {
            result.errors.push(...errors);
        }
    }

    private addProperty({ nodeKey, nodeValue, keyDetail, result, context }: LoadingDetails): void {
        if (keyDetail.property === undefined) throw new Error(`Property ${nodeKey} require a child ast node`);

        const astNode = findMatchingNode(nodeValue, keyDetail.property)
        const subNodeResult = astNode.load(nodeValue, addTrace(context, nodeKey))

        if (subNodeResult.errors.length === 0) {
            result.component.properties[nodeKey] = subNodeResult.component
        } else {
            result.errors.push(...subNodeResult.errors);
        }
    }

    private addChild({ nodeKey, nodeValue: nodeValues, keyDetail, result, context }: LoadingDetails): void {
        if (keyDetail.child === undefined) {
            throw new Error(`Children of ${nodeKey} require a child ast node`);
        }

        if (!Array.isArray(nodeValues)) {
            result.errors.push({
                error: 'Expected an array',
                context
            });

            nodeValues = [nodeValues]
        }

        const children: Component[] = [];

        result.component.children[nodeKey] = children;

        for (const nodeValue of nodeValues) {
            const astNode = findMatchingNode(nodeValue, keyDetail.child)
            const subNodeResult = astNode.load(nodeValue, addTrace(context, nodeKey))

            if (subNodeResult.errors.length === 0) {
                children.push(subNodeResult.component)
            } else {
                result.errors.push(...subNodeResult.errors);
            }
        }
    }
}
