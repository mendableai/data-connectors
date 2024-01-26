import { Document } from "./Document";

export class NangoDocument {
  id: string;
  url: string;
  content: string;
  title: string;

  constructor(data: Partial<NangoDocument>) {
    this.id = data.id || "";
    this.url = data.url || "";
    this.content = data.content;
    this.title = data.title || "";
  }

  transformToDocument(provider: string, type?: string): Document {
    return new Document({
      id: this.id,
      content: this.content,
      type: type || "default",
      provider: provider,
      metadata: {
        sourceURL: this.url,
      },
    });
  }
}
