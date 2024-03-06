import { DataProvider } from "../DataProvider";
import { Document } from "../../entities/Document";
import { Progress } from "../../entities/Progress";
import { transformVideoToAudio } from "./transformVideoToAudio";
import { transcribeAudio } from "./transcribeAudio";
import { fetchAndProcessVideo } from "./fetchAndProcessVideo";

export type VideoFileInputOptions = {
  urls?: string[];
};

export class VideoFileDataProvider implements DataProvider<VideoFileInputOptions> {
  private urls: string[] = [];
  
  authorize(): void {
    // no need
    return;
  }

  async getDocuments(inProgress?: (progress: Progress) => void): Promise<Document[]> {
    let content: string = "";
    let documents: Document[] = [];

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
        const videoBuffer = await fetchAndProcessVideo(this.urls[i]);
        const audio = await transformVideoToAudio(videoBuffer);
        content = await transcribeAudio(audio);
      } catch (error) {
        throw new Error(`Error fetching URL ${this.urls[i]}: ${error}`);
      }

      documents.push({
        content,
        metadata: {
          sourceURL: this.urls[i],
        },
        provider: "video",
        type: "video",
      });
    }

    return documents;
  }

  async authorizeNango(): Promise<void> {
    // no need
    return;
  }

  setOptions(options: VideoFileInputOptions): void {
    if (!options.urls) {
      throw new Error("Urls are required");
    }

    this.urls = options.urls;
  }
}
