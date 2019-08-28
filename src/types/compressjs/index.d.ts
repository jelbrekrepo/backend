declare module 'compressjs' {
  export class Bzip2 {
    static compressFile(input: Buffer): Buffer
  }
}
