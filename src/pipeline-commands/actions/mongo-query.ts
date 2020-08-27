import { injectable } from 'inversify';
import { PipelineActionDetails } from '../action-details';
import { PipelineActionHandler } from '../action-handler';
import { MongoClient } from 'mongodb';

export interface MongoQuery {
  output?: (data: AsyncIterableIterator<unknown>) => Promise<void>;
  collectionName: string;
  query: string;
  params: Record<string, unknown>;
}

export interface MongoQueryActionDetails extends PipelineActionDetails {
  envVarName: string;
  storageEnvVarName: string;
  databaseName: string;
  queries: MongoQuery[];
}

export const MOGNO_QUERY_ACTION_HANDLER = Symbol.for('MongoQueryActionHandler');

@injectable()
export class MongoQueryActionHandler
  implements PipelineActionHandler<MongoQueryActionDetails> {
  public async run(actionDetails: MongoQueryActionDetails): Promise<void> {
    const connectionString = process.env[actionDetails.envVarName] as string;
    const client = await MongoClient.connect(connectionString, {
      useUnifiedTopology: true,
    });
    const db = client.db(actionDetails.databaseName);

    for (const query of actionDetails.queries) {
      const paramNames = Object.keys(query.params);
      const buildQuery = new Function(
        ...paramNames,
        `return (${query.query.trim()});`,
      );
      const queryFilter = buildQuery(
        ...paramNames.map((name) => query.params[name]),
      );
      const collection = db.collection(query.collectionName);
      const cursor = collection.find(queryFilter);

      if (query.output !== undefined) {
        await query.output(cursor);
      }
    }
  }
}
