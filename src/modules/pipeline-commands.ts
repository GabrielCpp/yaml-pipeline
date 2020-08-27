import {
  PipelineActionDetails,
  PipelineActionHandler,
  PipelineActionHandlerMap,
  PIPELINE_ACTION_HANDLER_MAP,
} from '@/pipeline-commands';
import {
  ActionDetailsPreprocessor,
  ACTION_DETAILS_PREPROCESSOR,
} from '@/pipeline-commands/action-details-preprocessor';
import {
  CustomCommandActionHandler,
  CUSTOM_COMMAND_ACTION_HANDLER,
} from '@/pipeline-commands/actions/custom-command';
import {
  FilterLogActionHandler,
  FILTER_LOG_ACTION_HANDLER,
} from '@/pipeline-commands/actions/filter-log';
import {
  HttpRequestActionHandler,
  HTTP_REQUEST_ACTION_HANDLER,
} from '@/pipeline-commands/actions/http-request';
import {
  InvokeProcedureFileActionHandler,
  INVOKE_PROCEDURE_FILE_ACTION_HANDLER,
} from '@/pipeline-commands/actions/invoke-procedure-file';
import {
  MOGNO_QUERY_ACTION_HANDLER,
  MongoQueryActionHandler,
} from '@/pipeline-commands/actions/mongo-query';
import {
  PollTargetActionHandler,
  POLL_TARGET_ACTION_HANDLER,
} from '@/pipeline-commands/actions/poll-target';
import {
  PuppeteerJobActionHandler,
  PUPPETEER_JOB_ACTION_HANDLER,
} from '@/pipeline-commands/actions/puppeteer-job';
import {
  ShellCommandActionHandler,
  SHELL_COMMAND_ACTION_HANDLER,
} from '@/pipeline-commands/actions/shell-command';
import {
  SpawnCommandActionHandler,
  SPAWN_COMMAND_ACTION_HANDLER,
} from '@/pipeline-commands/actions/spawn-command';
import {
  SqlQueryActionHandler,
  SQL_QUERY_ACTION_HANDLER,
} from '@/pipeline-commands/actions/sql-query';
import {
  ProcedureFileExecutor,
  PROCEDURE_FILE_EXECUTOR,
} from '@/pipeline-commands/procedure-file-executor';
import { AsyncContainerModule, Container, interfaces } from 'inversify';

const extractActionHandlerMap = new Map<
  string,
  (container: Container) => PipelineActionHandler<PipelineActionDetails>
>([
  ['filter-log', (container) => container.get(FILTER_LOG_ACTION_HANDLER)],
  ['sql-query', (container) => container.get(SQL_QUERY_ACTION_HANDLER)],
  ['mongo-query', (container) => container.get(MOGNO_QUERY_ACTION_HANDLER)],
  ['puppeteer-job', (container) => container.get(PUPPETEER_JOB_ACTION_HANDLER)],
  ['http-request', (container) => container.get(HTTP_REQUEST_ACTION_HANDLER)],
  ['shell', (container) => container.get(SHELL_COMMAND_ACTION_HANDLER)],
  [
    'custom-command',
    (container) => container.get(CUSTOM_COMMAND_ACTION_HANDLER),
  ],
  [
    'invoke-procedure-file',
    (container) => container.get(INVOKE_PROCEDURE_FILE_ACTION_HANDLER),
  ],
  ['poll-target', (container) => container.get(POLL_TARGET_ACTION_HANDLER)],
  ['spawn', (container) => container.get(SPAWN_COMMAND_ACTION_HANDLER)],
]);

export const extractActionHandlerModule = new AsyncContainerModule(
  async (bind: interfaces.Bind, unbind: interfaces.Unbind) => {
    bind<PipelineActionHandlerMap>(PIPELINE_ACTION_HANDLER_MAP).toConstantValue(
      extractActionHandlerMap,
    );
    bind<FilterLogActionHandler>(FILTER_LOG_ACTION_HANDLER).to(
      FilterLogActionHandler,
    );
    bind<SqlQueryActionHandler>(SQL_QUERY_ACTION_HANDLER).to(
      SqlQueryActionHandler,
    );
    bind<MongoQueryActionHandler>(MOGNO_QUERY_ACTION_HANDLER).to(
      MongoQueryActionHandler,
    );
    bind<PuppeteerJobActionHandler>(PUPPETEER_JOB_ACTION_HANDLER).to(
      PuppeteerJobActionHandler,
    );
    bind<HttpRequestActionHandler>(HTTP_REQUEST_ACTION_HANDLER).to(
      HttpRequestActionHandler,
    );
    bind<ShellCommandActionHandler>(SHELL_COMMAND_ACTION_HANDLER).to(
      ShellCommandActionHandler,
    );
    bind<CustomCommandActionHandler>(CUSTOM_COMMAND_ACTION_HANDLER).to(
      CustomCommandActionHandler,
    );
    bind<InvokeProcedureFileActionHandler>(
      INVOKE_PROCEDURE_FILE_ACTION_HANDLER,
    ).to(InvokeProcedureFileActionHandler);
    bind<PollTargetActionHandler>(POLL_TARGET_ACTION_HANDLER).to(
      PollTargetActionHandler,
    );
    bind<SpawnCommandActionHandler>(SPAWN_COMMAND_ACTION_HANDLER).to(
      SpawnCommandActionHandler,
    );

    bind<ActionDetailsPreprocessor>(ACTION_DETAILS_PREPROCESSOR).to(
      ActionDetailsPreprocessor,
    );
    bind<ProcedureFileExecutor>(PROCEDURE_FILE_EXECUTOR).to(
      ProcedureFileExecutor,
    );
  },
);
