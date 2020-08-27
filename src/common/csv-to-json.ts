import parse from 'csv-parser';
import { createReadStream, writeFile } from 'mz/fs';

export async function convertCsvToJson(inputFile: string, outputFile: string) {
  const results = await new Promise((resolve) => {
    const results: Record<string, unknown>[] = [];

    createReadStream(inputFile)
      .pipe(
        parse({
          separator: '\t',
        }),
      )
      .on('data', (data: Record<string, unknown>) => results.push(data))
      .on('end', () => {
        resolve(results);
      });
  });

  const content = JSON.stringify(results, null, 4);
  await writeFile(outputFile, content, 'utf8');
}
