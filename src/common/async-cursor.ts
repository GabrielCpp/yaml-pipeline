export interface AsyncCursor<T> {
  next(): Promise<boolean>;
  data: T[];
}
