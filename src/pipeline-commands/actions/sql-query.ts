import { injectable } from 'inversify';
import { PipelineActionDetails } from '../action-details';
import { PipelineActionHandler } from '../action-handler';
import { getConnection, getConnectionManager, Connection } from 'typeorm';

export interface SqlQuery {
  output?: (iterator: AsyncIterableIterator<string | Buffer>) => Promise<void>;
  display?: string;
  sql: string;
  bindings?: Record<string, unknown>;
  params?: string[];
}

export interface SqlQueryActionDetails extends PipelineActionDetails {
  envVarName: string;
  queries: SqlQuery[];
}

export const SQL_QUERY_ACTION_HANDLER = Symbol.for('SqlQueryActionHandler');

@injectable()
export class SqlQueryActionHandler
  implements PipelineActionHandler<SqlQueryActionDetails> {
  public async run(actionDetails: SqlQueryActionDetails): Promise<void> {
    const connectionManager = getConnectionManager();
    let connection: Connection;

    if (connectionManager.has(actionDetails.envVarName)) {
      connection = getConnection(actionDetails.envVarName);
    } else {
      const connectionOptions = process.env[actionDetails.envVarName] as string;
      const options = JSON.parse(connectionOptions);

      connection = connectionManager.create({
        name: actionDetails.envVarName,
        ...options,
      });
    }

    if (!connection.isConnected) {
      await connection.connect();
    }

    const runner = connection.createQueryRunner();

    for (const query of actionDetails.queries) {
      const { params = [], bindings = {} } = query;

      const parameters = params.map((name) => bindings[name]);

      if (query.display !== undefined) {
        const finalMessage = Object.keys(bindings).reduce(
          (message, bindedName) => {
            return message.replace(
              new RegExp(`%${bindedName}`, 'g'),
              (bindings[bindedName] as any).toString(),
            );
          },
          query.display,
        );

        console.log(finalMessage);
      }

      const result = (await runner.query(query.sql.trim(), parameters)) || [];

      if (query.output !== undefined) {
        await query.output(
          (async function* () {
            yield* result;
          })(),
        );
      }
    }
  }
}
