/**
 * mmd-parser (npm + three-stdlib bundled copy) logs "unknown char code N"
 * and stops decoding on some Shift_JIS bytes. Patch all CharsetEncoder copies.
 */
import * as MMDParserModule from 'mmd-parser';
import { CharsetEncoder as StdlibCharsetEncoder } from 'three-stdlib-mmdparser';

type CharsetEncoderProto = {
  s2u: (uint8Array: Uint8Array) => string;
  s2uTable: Record<number, number>;
};

type CharsetEncoderCtor = { prototype: CharsetEncoderProto };

function patchCharsetEncoderClass(CharsetEncoder: CharsetEncoderCtor): void {
  if ((CharsetEncoder.prototype as { __mmdPatched?: boolean }).__mmdPatched) {
    return;
  }

  CharsetEncoder.prototype.s2u = function s2uPatched(uint8Array: Uint8Array): string {
    const table = this.s2uTable;
    let str = '';
    let p = 0;

    while (p < uint8Array.length) {
      let key = uint8Array[p++];

      const isSingleByte =
        (key >= 0x00 && key <= 0x7e) || (key >= 0xa1 && key <= 0xdf);

      if (!isSingleByte && p < uint8Array.length) {
        key = (key << 8) | uint8Array[p++];
      }

      const mapped = table[key];
      if (mapped !== undefined) {
        str += String.fromCharCode(mapped);
      } else if (isSingleByte && key <= 0x7f) {
        str += String.fromCharCode(key);
      } else {
        str += '\uFFFD';
      }
    }

    return str;
  };

  (CharsetEncoder.prototype as { __mmdPatched?: boolean }).__mmdPatched = true;
}

function resolveNpmCharsetEncoder(): CharsetEncoderCtor | null {
  const mod = MMDParserModule as {
    CharsetEncoder?: CharsetEncoderCtor;
    default?: { CharsetEncoder?: CharsetEncoderCtor; Parser?: unknown };
    Parser?: unknown;
  };
  return mod.CharsetEncoder ?? mod.default?.CharsetEncoder ?? null;
}

patchCharsetEncoderClass(StdlibCharsetEncoder);

const npmCharsetEncoder = resolveNpmCharsetEncoder();
if (npmCharsetEncoder) {
  patchCharsetEncoderClass(npmCharsetEncoder);
}
