import { AsyncCursor } from './async-cursor';

export interface CursorState<T, TContinuationToken> {
  entries: T[];
  continuationToken?: TContinuationToken;
}

export class PaginatedAsyncCursor<T, TContinuationToken>
  implements AsyncCursor<T> {
  private lastFetched:
    | CursorState<T, TContinuationToken>
    | undefined = undefined;

  private executeQuery: (
    continuationToken?: TContinuationToken,
  ) => Promise<CursorState<T, TContinuationToken>>;

  public constructor(
    executeQuery: (
      continuationToken?: TContinuationToken,
    ) => Promise<CursorState<T, TContinuationToken>>,
  ) {
    this.executeQuery = executeQuery;
  }

  public async next(): Promise<boolean> {
    if (this.lastFetched === undefined) {
      this.lastFetched = await this.executeQuery();
    } else if (
      this.lastFetched.continuationToken !== null &&
      this.lastFetched.continuationToken !== undefined
    ) {
      this.lastFetched = await this.executeQuery(
        this.lastFetched.continuationToken,
      );
    } else {
      return false;
    }

    return this.lastFetched.entries.length > 0;
  }

  get data(): T[] {
    if (this.lastFetched === undefined) {
      return [];
    }

    return this.lastFetched.entries;
  }
}
