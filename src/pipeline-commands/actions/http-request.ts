import { injectable } from 'inversify';
import { PipelineActionHandler } from '../action-handler';
import { PipelineActionDetails } from '../action-details';
import axios, { Method } from 'axios';
import { Agent } from 'https';
import FormData from 'form-data';

export interface HttpRequestDetails extends PipelineActionDetails {
  output?: (obj: unknown) => Promise<void>;
  contentType?: string;
  method: string;
  baseUrl: string;
  url: string;
  body?: unknown;
  headers?: Record<string, string>;
  queries?: Record<string, string>;
  continueOnlyWhenOk?: boolean;
}

interface FormDataElement {
  name: string;
  value: unknown;
  options: FormData.AppendOptions;
}

export const HTTP_REQUEST_ACTION_HANDLER = Symbol.for(
  'HttpRequestActionHandler',
);

@injectable()
export class HttpRequestActionHandler
  implements PipelineActionHandler<HttpRequestDetails> {
  public async run(actionDetails: HttpRequestDetails): Promise<void> {
    const agent = new Agent({
      rejectUnauthorized: false,
    });

    let response: any;
    let data: any = actionDetails.body;
    let headers: any = actionDetails.headers || {};

    if (actionDetails.contentType === 'form-data') {
      const formData = new FormData();

      for (const element of actionDetails.body as FormDataElement[]) {
        formData.append(element.name, element.value, element.options);
      }

      data = formData;
      headers = { ...headers, ...formData.getHeaders() };
    }

    try {
      response = await axios({
        method: actionDetails.method as Method,
        baseURL: actionDetails.baseUrl,
        url: actionDetails.url,
        headers,
        params: actionDetails.queries,
        data,
        httpsAgent: agent,
        withCredentials: true,
      });
    } catch (e) {
      response = e.response;

      if (actionDetails.continueOnlyWhenOk !== false) {
        throw e;
      }
    }

    if (actionDetails.output != undefined) {
      await actionDetails.output({
        status: response.status,
        data: response.data,
        headers: response.headers,
      });
    }
  }
}
