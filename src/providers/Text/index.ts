import { DataProvider } from "../DataProvider";
import { Document } from "../../entities/Document";
import { Progress } from "../../entities/Progress";

export type TextInputOptions = {
  text?: string;
  records?: { source: string, content: string, metadata?: any }[];
};
export class TextDataProvider implements DataProvider<TextInputOptions> {
  private text: string = "";
  private records: { source: string, content: string, metadata?: any }[] = [];
  authorize(): void {
    // no need
    return;
  }

  async getDocuments(inProgress?: (progress: Progress) => void): Promise<Document[]> {
    if (this.records) {
      if (this.records.length > 0) {
        return this.records.map((record, i) => {
          if (inProgress) {
            inProgress({
              current: i + 1,
              total: this.records.length,
              status: "SCRAPING",
              currentDocumentUrl: record.source,
            });
          }

          return {
            content: record.content,
            metadata: {
              ...record.metadata,
              sourceURL: record.source,
            },
            provider: "text",
            type: "text",
          };
        });
      }
    }

    const randomNumber = Math.floor(Math.random() * 100000000);
    // remove https from text
    return [
      {
        content: this.text,
        metadata: {
          sourceURL: "#TEXT_" + randomNumber.toString(),
        },
        provider: "text",
        type: "text",
      },
    ];
  }

  async authorizeNango(): Promise<void> {
    // no need
    return;
  }

  setOptions(options: TextInputOptions): void {
    if (!options.text && !options.records) {
      throw new Error("Either text or records is required");
    }

    if (options.text && options.text != "") {
      this.text = options.text;
      this.records = [];
      return;
    }

    if (options.records && options.records.length > 0) {
      this.text = "";
      this.records = options.records;
      return;
    }
  }
}
