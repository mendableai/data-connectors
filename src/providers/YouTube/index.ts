import { DataProvider } from "../DataProvider";
import { Document } from "../../entities/Document";
import { YoutubeTranscript } from 'youtube-transcript';
import puppeteer from 'puppeteer';

export type YouTubeInputOptions = {
  urls: string[];
  isChannel?: boolean;
};

export class YouTubeDataProvider implements DataProvider<YouTubeInputOptions> {
  private urls: string[] = [];
  private isChannel: boolean = false;
  authorize(): void {
    // no need
    return;
  }

  async getDocuments(): Promise<Document[]> {
    const documents: Document[] = [];
    const videosUrls: string[] = [];

    if (this.isChannel) {
      for (const url of this.urls) {
        const videoUrls = await this.fetchAllVideoUrlsFromChannel(url);
        videosUrls.push(...videoUrls);
      }

      this.urls = videosUrls;
    }

    for (const url of this.urls) {
      let content = "";
      try {
        const data = await YoutubeTranscript.fetchTranscript(url);
        for (const item of data) {
          content += item.text + " \n";
        }
  
        documents.push({
          content: content.replace(/  +/g, ' ').trim(),
          metadata: {
            sourceURL: url,
          },
          provider: "youtube",
          type: "text",
        })
      } catch (error) {
        console.log("Error fetching video transcript. Skipping video:", url);
      }
    }
    
    return documents;
  }

  async fetchAllVideoUrlsFromChannel (channelUrl: string): Promise<string[] | []> {
    const urls: string[] = [];

    try {
      const browser = await puppeteer.launch({ headless: "new" });
      const page = await browser.newPage();
  
      await page.goto(channelUrl);
      const thubmnails = await page.$$('a#thumbnail');
      for (const thumbnail of thubmnails) {
        const href = await thumbnail.evaluate((node) => node.getAttribute('href'));
        if (href != null) {
          urls.push(`https://www.youtube.com${href}`);
        }
      }

      await browser.close();
      return urls;
    } catch (error) {
      console.error("Error fetching video URLs from channel:", error);
      return [];
    }
  }

  async authorizeNango(): Promise<void> {
    // no need
    return;
  }

  setOptions(options: YouTubeInputOptions): void {
    if (!options.urls) {
      throw new Error("Urls is required");
    }
    this.urls = options.urls;

    if (options.isChannel != undefined) {
      this.isChannel = options.isChannel;
    }
  }
}
