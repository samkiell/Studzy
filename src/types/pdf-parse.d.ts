declare module "pdf-parse" {
  interface PDFData {
    numpages: number;
    numrender: number;
    info: any;
    metadata: any;
    text: string;
    version: string;
  }

  interface PDFOptions {
    max?: number;
    version?: string;
    pagerender?: (pageData: any) => string;
  }

  function pdfParse(
    dataBuffer: Buffer | Uint8Array,
    options?: PDFOptions
  ): Promise<PDFData>;

  export = pdfParse;
}
