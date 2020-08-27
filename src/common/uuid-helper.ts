import { Binary } from 'mongodb';

function base64ToHex(base64: string) {
  const base64Digits =
    'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=';
  const hexDigits = '0123456789abcdef';
  let hex = '';
  for (let i = 0; i < 24; ) {
    const e1 = base64Digits.indexOf(base64[i++]);
    const e2 = base64Digits.indexOf(base64[i++]);
    const e3 = base64Digits.indexOf(base64[i++]);
    const e4 = base64Digits.indexOf(base64[i++]);
    const c1 = (e1 << 2) | (e2 >> 4);
    const c2 = ((e2 & 15) << 4) | (e3 >> 2);
    const c3 = ((e3 & 3) << 6) | e4;
    hex += hexDigits[c1 >> 4];
    hex += hexDigits[c1 & 15];
    if (e3 != 64) {
      hex += hexDigits[c2 >> 4];
      hex += hexDigits[c2 & 15];
    }
    if (e4 != 64) {
      hex += hexDigits[c3 >> 4];
      hex += hexDigits[c3 & 15];
    }
  }
  return hex;
}

export function toCSUUID(bin: Buffer) {
  let hex = base64ToHex(bin.toString('base64'));
  const a =
    hex.substr(6, 2) + hex.substr(4, 2) + hex.substr(2, 2) + hex.substr(0, 2);
  const b = hex.substr(10, 2) + hex.substr(8, 2);
  const c = hex.substr(14, 2) + hex.substr(12, 2);
  const d = hex.substr(16, 16);
  hex = a + b + c + d;
  const uuid =
    hex.substr(0, 8) +
    '-' +
    hex.substr(8, 4) +
    '-' +
    hex.substr(12, 4) +
    '-' +
    hex.substr(16, 4) +
    '-' +
    hex.substr(20, 12);
  return uuid;
}

export function toMongoNuuid(uuidString: string) {
  const hex = uuidString.replace(/-/g, '').toLowerCase();
  const mangledHex =
    hex.substr(6, 2) +
    hex.substr(4, 2) +
    hex.substr(2, 2) +
    hex.substr(0, 2) +
    hex.substr(10, 2) +
    hex.substr(8, 2) +
    hex.substr(14, 2) +
    hex.substr(12, 2) +
    hex.substr(16, 16);

  return new Binary(Buffer.from(mangledHex, 'hex'), Binary.SUBTYPE_UUID_OLD);
}
