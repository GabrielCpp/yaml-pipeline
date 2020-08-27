import stream, { Writable } from 'stream';
import { createWriteStream } from 'mz/fs';
import { once } from 'events';
import * as util from 'util';

const finished = util.promisify(stream.finished);

export function createJsonlWriter(
  outputStream: Writable,
): (data: string) => Promise<void> {
  let isFirst = true;

  return async (data: string): Promise<void> => {
    if (isFirst === false) {
      if (!outputStream.write('\n')) {
        await once(outputStream, 'drain');
      }
    }

    if (!outputStream.write(data)) {
      await once(outputStream, 'drain');
    }

    isFirst = false;
  };
}

export async function dumpJsonlToFile(
  dumpFile: string,
  elements: AsyncGenerator<string>,
) {
  const fileDumpJsonl = createWriteStream(dumpFile, {
    flags: 'w',
  });

  try {
    const write = createJsonlWriter(fileDumpJsonl);

    for await (const element of elements) {
      await write(element);
    }
  } finally {
    fileDumpJsonl.end();
    await finished(fileDumpJsonl);
    fileDumpJsonl.close();
  }
}
