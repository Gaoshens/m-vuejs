export function isObject(v): v is Object {
  return typeof v === 'object' && v !== null;
}

export function isPlainObject(v): v is Record<string | symbol, any> {
  return Object.prototype.toString.call(v) === '[object Object]';
}
