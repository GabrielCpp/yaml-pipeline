import { PipelineActionDetails } from '../action-details';
import { injectable } from 'inversify';
import { PipelineActionHandler } from '../action-handler';
import { chain } from 'stream-chain';
import { createReadStream, createWriteStream } from 'mz/fs';
import { once } from 'events';

export interface FilterLogActionDetails extends PipelineActionDetails {
  sourceFilePath: string;
  outputFilePath: string;
  avoidStartWiths: string[];
  avoidContains: string[];
}

export const FILTER_LOG_ACTION_HANDLER = Symbol.for('FilterLogActionHandler');

@injectable()
export class FilterLogActionHandler
  implements PipelineActionHandler<FilterLogActionDetails> {
  public async run(actionDetails: FilterLogActionDetails): Promise<void> {
    const Stringer = (await import('stream-json/jsonl/Stringer' as any)) as any;
    const JsonlParser = (await import(
      'stream-json/jsonl/Parser' as any
    )) as any;

    function buildFiletingPipeline(
      sourceFilePath: string,
      outputFilePath: string,
      filterValue: (value: unknown) => unknown,
    ) {
      const pipeline = chain([
        createReadStream(sourceFilePath),
        new JsonlParser.default(),
        (data) => data.value,
        filterValue,
        new Stringer.default(),
        createWriteStream(outputFilePath),
      ]);

      return pipeline;
    }

    const pipeline = buildFiletingPipeline(
      actionDetails.sourceFilePath,
      actionDetails.outputFilePath,
      (value: unknown) => {
        const record = value as Record<string, unknown>;
        const message = record['message'] as string;

        if (message === undefined) {
          return value;
        }

        if (
          actionDetails.avoidStartWiths.some((str) => message.startsWith(str))
        ) {
          return null;
        }

        if (actionDetails.avoidContains.some((str) => message.includes(str))) {
          return null;
        }

        return value;
      },
    );

    await once(pipeline, 'end');
  }
}
