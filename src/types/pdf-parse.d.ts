declare module "pdf-parse" {
  interface PDFParseOptions {
    data?: Buffer | Uint8Array;
    url?: string;
    verbosity?: number;
  }

  interface PDFTextResult {
    text: string;
  }

  interface PDFInfoResult {
    numPages: number;
    [key: string]: unknown;
  }

  export class PDFParse {
    constructor(options: PDFParseOptions);
    getText(): Promise<PDFTextResult>;
    getInfo(): Promise<PDFInfoResult>;
    destroy(): Promise<void>;
    load(): Promise<void>;
  }

  export const VerbosityLevel: {
    ERRORS: number;
    WARNINGS: number;
    INFOS: number;
  };
}
