export function sleep(timeMsc: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, timeMsc));
}
