import { injectable } from 'inversify';
import { PipelineActionDetails } from '../action-details';
import { PipelineActionHandler } from '../action-handler';
import puppeteer from 'puppeteer';
import { newError } from '@/common/error-utils';

export interface PuppeteerStep extends Record<string, unknown> {
  commandName: string;

  path?: string;
  xpath?: string;

  waitForNetworkIdle?: { timeoutMs: number };
  waitForXPath?: string;
  waitForEvents?: string[];
  waitForSelector?: string;
  waitForFunction?: string;

  snapshotPath?: string;

  url?: string;
  value?: string;
}

export interface PuppeteerJobDetails extends PipelineActionDetails {
  steps: PuppeteerStep[];
}

export const PUPPETEER_JOB_ACTION_HANDLER = Symbol.for(
  'PuppeteerJobActionHandler',
);

@injectable()
export class PuppeteerJobActionHandler
  implements PipelineActionHandler<PuppeteerJobDetails> {
  private puppeteerCommands = new Map<
    string,
    (page: any, step: PuppeteerStep) => Promise<void>
  >([
    ['goto', this.gotoCommand.bind(this)],
    ['click', this.clickCommand.bind(this)],
    ['set-input', this.setInputCommand.bind(this)],
    ['upload', this.uploadFile.bind(this)],
    ['blur', this.blurCommand.bind(this)],
    ['press', this.pressCommand.bind(this)],
    ['eval', this.evalCommand.bind(this)],
  ]);

  public async run(actionDetails: PuppeteerJobDetails): Promise<void> {
    const browser = await puppeteer.launch({
      ignoreHTTPSErrors: true,
      args: ['--window-size=1920,1080'],
    });

    try {
      const page = await browser.newPage();

      for (const step of actionDetails.steps) {
        const command = this.puppeteerCommands.get(step.commandName);

        if (command === undefined) {
          console.error(
            `Puppeteer command ${step.commandName} not found. Abandonning job.`,
          );
          break;
        }

        await command(page, step);
      }
    } finally {
      await browser.close();
    }
  }

  private async gotoCommand(page: any, step: PuppeteerStep): Promise<void> {
    const url = step['url'] as string;

    console.log(`Puppeteer goto('${url}')`);
    await page.goto(url, step['options'] as any, { ignoreSSL: true });
    await this._snapshotOnNeed(page, step.snapshotPath);
  }

  private async clickCommand(page: any, step: PuppeteerStep): Promise<void> {
    const waitFors = this._buildWaitFor(page, step);
    const domNode = await this._pickDomNode(page, step);

    console.log(`click('${step.path || step.xpath}')`);
    await Promise.all([...waitFors.map((w) => w()), domNode.click()]);

    await this._snapshotOnNeed(page, step.snapshotPath);
  }

  private async uploadFile(page: any, step: PuppeteerStep): Promise<void> {
    const inputUploadHandle = await this._pickDomNode(page, step);
    const uploadFiles = step['uploadFiles'] as string[];

    console.log(`upload('${step.path || step.xpath}')`);
    uploadFiles.forEach((uploadFile) =>
      console.log(`Upload file at ${uploadFile}`),
    );
    await inputUploadHandle.uploadFile(...uploadFiles);
    await this._snapshotOnNeed(page, step.snapshotPath);
  }

  // https://stackoverflow.com/questions/47966510/how-to-fill-an-input-field-using-puppeteer
  private async setInputCommand(page: any, step: PuppeteerStep): Promise<void> {
    const value = step['value'] as string;
    const path = step['path'] as string;

    console.log(`Puppeteer $setInput('${path}', '${value}')`);
    await page.$eval(path, new Function('e', `e.value = '${value}'`) as any);
    await this._snapshotOnNeed(page, step.snapshotPath);
  }

  private async blurCommand(page: any, step: PuppeteerStep) {
    console.log(`Puppeteer $blur('${step.path}')`);
    await page.$eval(step.path, new Function('e', `e.blur()`) as any);
    await this._snapshotOnNeed(page, step.snapshotPath);
  }

  private async evalCommand(page: any, step: PuppeteerStep) {
    console.log(`Puppeteer $eval('${step.path}')`);
    await page.$eval(step.path, new Function('e', step.value as string) as any);
    await this._snapshotOnNeed(page, step.snapshotPath);
  }

  private async pressCommand(page: any, step: PuppeteerStep) {
    console.log(`Puppeteer press()`);
    await page.keyboard.press('Tab');
    await this._snapshotOnNeed(page, step.snapshotPath);
  }

  private async _snapshotOnNeed(
    page: any,
    snapshotPath: string | undefined,
  ): Promise<void> {
    if (snapshotPath === undefined) {
      return;
    }

    console.log(`Puppeteer screenshot('${snapshotPath}')`);
    await page.screenshot({ path: snapshotPath });
  }

  private async _pickDomNode(page: any, step: PuppeteerStep): Promise<any> {
    const { path, xpath } = step;

    if (xpath !== undefined) {
      const matches = await page.$x(xpath);

      if (matches.length > 0) {
        return matches[0];
      } else {
        throw newError('failed_find_xpath', xpath);
      }
    }

    return await page.$(path);
  }

  private _buildWaitFor(
    page: any,
    step: PuppeteerStep,
  ): Array<() => Promise<void>> {
    const {
      waitForNetworkIdle,
      waitForXPath,
      waitForEvents,
      waitForSelector,
      waitForFunction,
    } = step;
    const waitFors: Array<() => Promise<void>> = [];

    if (waitForXPath !== undefined) {
      waitFors.push(() => page.waitForXPath(waitForXPath));
    }

    if (waitForSelector !== undefined) {
      waitFors.push(() =>
        page.waitForSelector(waitForSelector, { visible: true }),
      );
    }

    if (waitForEvents !== undefined) {
      waitFors.push(() => page.waitForNavigation({ load: waitForEvents }));
    }

    if (waitForNetworkIdle !== undefined) {
      waitFors.push(() =>
        waitForPageNetworkIdle(page, waitForNetworkIdle.timeoutMs),
      );
    }

    if (waitForFunction !== undefined) {
      waitFors.push(() => page.waitForFunction(waitForFunction));
    }

    return waitFors;
  }
}

// https://stackoverflow.com/questions/54377650/how-can-i-wait-for-network-idle-after-click-on-an-element-in-puppeteer
function waitForPageNetworkIdle(
  page: any,
  timeout: number,
  maxInflightRequests = 0,
): Promise<void> {
  page.on('request', onRequestStarted);
  page.on('requestfinished', onRequestFinished);
  page.on('requestfailed', onRequestFinished);

  let inflight = 0;
  let fulfill: () => void;
  const promise = new Promise<void>((x) => (fulfill = x));
  let timeoutId = setTimeout(onTimeoutDone, timeout);
  return promise;

  function onTimeoutDone() {
    page.removeListener('request', onRequestStarted);
    page.removeListener('requestfinished', onRequestFinished);
    page.removeListener('requestfailed', onRequestFinished);
    fulfill();
  }

  function onRequestStarted() {
    ++inflight;
    if (inflight > maxInflightRequests) clearTimeout(timeoutId);
  }

  function onRequestFinished() {
    if (inflight === 0) return;
    --inflight;
    if (inflight === maxInflightRequests)
      timeoutId = setTimeout(onTimeoutDone, timeout);
  }
}
