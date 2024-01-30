import { DataProvider } from "../DataProvider";
import { Document } from "../../entities/Document";

export type TextInputOptions = {
  text: string;
};
export class TextDataProvider implements DataProvider<TextInputOptions> {
  private text: string = "";
  authorize(): void {
    // no need
    return;
  }

  async getDocuments(): Promise<Document[]> {
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
    if (!options.text) {
      throw new Error("Text is required");
    }
    this.text = options.text;
  }
}
