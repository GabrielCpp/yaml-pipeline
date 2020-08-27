export function newError(
  name: string,
  message: string,
  properties: Record<string, unknown> = {},
) {
  const error = new Error(message);
  error.name = name;
  Object.assign(error, properties);
  return error;
}
