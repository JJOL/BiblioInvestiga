declare module 'pdf.mjs' {
  export function getDocument(url: string): {
    promise: Promise<any>
  }
}