import { DataProvider } from "../DataProvider";
import { Document } from "../../entities/Document";
import fs from "fs";
import pdf from "pdf-parse";
import { Progress } from "../../entities/Progress";

export type FileInputOptions = {
  files?: string[];
  urls?: string[];
};

export class FileDataProvider implements DataProvider<FileInputOptions> {
  private files: string[] = [];
  private urls: string[] = [];

  authorize(): void {
    // no need
    return;
  }

  async getDocuments(inProgress?: (progress: Progress) => void): Promise<Document[]> {
    const documents: Document[] = [];
    let content = "";
    let fileType = "";

    if (this.files.length > 0) {
      for (let i = 0; i < this.files.length; i++) {
        const randomNumber = Math.floor(Math.random() * 100000000);
        if (inProgress) { 
          inProgress({
            current: i + 1,
            total: this.files.length,
            status: "SCRAPING",
            currentDocumentUrl: "#FILE_" + randomNumber.toString(),
          });
        }

        try {
          fileType = this.files[i].split(".").pop() || "";
          if (fileType === "pdf") {
            const fileContent = fs.readFileSync(this.files[i]);
            const data = await pdf(fileContent);
            content = data.text;
          } else {
            const fileContent = fs.readFileSync(this.files[i], { encoding: "utf8" });
            content = fileContent;
          }
        } catch (error) {
          throw new Error(`Error reading file ${this.files[i]}: ${error}`);
        }

        documents.push({
          content,
          metadata: {
            sourceURL: "#FILE_" + randomNumber.toString(),
          },
          provider: "file",
          type: fileType,
        });
      }
    } else if (this.urls.length > 0) {
      for (let i = 0; i < this.urls.length; i++) {
        if (inProgress) {
          inProgress({
            current: i + 1,
            total: this.urls.length,
            status: "SCRAPING",
            currentDocumentUrl: this.urls[i],
          });
        }

        try {
          const response = await fetch(this.urls[i]);
          if (response.ok) {
            fileType = this.urls[i].split(".").pop() || "";

            if (fileType === "pdf") {
              const arrayBuffer = await response.arrayBuffer();
              const buffer = Buffer.from(new Uint8Array(arrayBuffer));
              const data = await pdf(buffer);
              content = data.text;
            } else {
              const urlContent = await response.text();
              content = urlContent + "\n";
            }
          } else {
            throw new Error(
              `Error fetching URL ${this.urls[i]}: ${response.statusText}`
            );
          }
        } catch (error) {
          throw new Error(`Error fetching URL ${this.urls[i]}: ${error}`);
        }

        documents.push({
          content,
          metadata: {
            sourceURL: this.urls[i],
          },
          provider: "file",
          type: fileType,
        });
      }
    }
    return documents;
  }

  async authorizeNango(): Promise<void> {
    // no need
    return;
  }

  setOptions(options: FileInputOptions): void {
    if (!options.files && !options.urls) {
      throw new Error("Either a file path or a URL must be provided");
    }
    if (options.files && options.urls) {
      throw new Error("Only one of file paths or URLs can be provided");
    }
    if (options.files) {
      this.files = options.files;
      this.urls = [];
    }
    if (options.urls) {
      this.urls = options.urls;
      this.files = [];
    }
  }
}
