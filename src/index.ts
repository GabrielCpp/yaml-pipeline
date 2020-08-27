import { config } from 'dotenv';
import { Container } from 'inversify';
import 'module-alias/register';
import 'reflect-metadata';
import yargs from 'yargs';
import { INVERSIFY_CONTAINER } from './container';
import * as modules from './modules';
import {
  ProcedureFileExecutor,
  PROCEDURE_FILE_EXECUTOR,
} from './pipeline-commands/procedure-file-executor';

const commandLine = yargs.command(
  'stalk [procedureFilePath]',
  'Save a session',
  (options) => {
    options.positional('procedureFilePath', {
      describe: 'procedure to execute',
    });
  },
);

async function main() {
  const commandOptions =
    process.env.COMMAND === undefined
      ? commandLine.argv
      : commandLine.parse(process.env.COMMAND as string);

  const container = new Container();
  container.bind(INVERSIFY_CONTAINER).toConstantValue(container);
  await container.loadAsync(...Object.values(modules));

  const procedureFileExecutor = container.get<ProcedureFileExecutor>(
    PROCEDURE_FILE_EXECUTOR,
  );
  await procedureFileExecutor.executeProcedureFile(
    commandOptions['procedureFilePath'] as string,
  );
}

if (require.main === module) {
  config();
  main().catch((e) => console.error(`error: `, e));
}
