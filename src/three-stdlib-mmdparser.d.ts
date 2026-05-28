declare module 'three-stdlib-mmdparser' {
  export class CharsetEncoder {
    s2u(uint8Array: Uint8Array): string;
    s2uTable: Record<number, number>;
  }
}
