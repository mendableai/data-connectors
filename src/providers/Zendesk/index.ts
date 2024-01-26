import { DataProvider } from "../DataProvider";
import { Document } from "../../entities/Document";
import { ZendeskReader } from "./zendesk";

export type ZendeskInputOptions = {
  zendesk_brand_name: string;
};
export class ZendeskDataProvider implements DataProvider<ZendeskInputOptions> {
  private zendesk_brand_name: string = "";
  authorize(): void {
    // no need
    return;
  }

  async getDocuments(): Promise<Document[]> {
    if (!this.zendesk_brand_name) {
      throw new Error("Zendesk brand name not set");
    }

    const loader = new ZendeskReader(this.zendesk_brand_name);
    const documents = await loader.loadData();
    const fileTexts: Document[] = [];

    for (let i = 0; i < documents.length; i++) {

      const d = documents[i];
      fileTexts.push({
        content: d.text,
        type: "article",
        provider: "zendesk",
        metadata: {
          sourceURL: d.extra_info.url,
          language: d.extra_info.locale,
        },
      });
      // Update task status (implementation depends on your environment)
      // updateTaskStatus(i, documents.length);
    }

    return fileTexts;
  }

  authorizeNango(): void {
    throw new Error("Method not implemented.");
  }

  setOptions(options: ZendeskInputOptions ): void {
    if (!options.zendesk_brand_name) {
      throw new Error("Zendesk brand name is required");
    }
    this.zendesk_brand_name = options.zendesk_brand_name;
  }

}
