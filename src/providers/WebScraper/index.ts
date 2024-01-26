import { DataProvider } from "../DataProvider";
import { Document } from "../../entities/Document";
import { Progress } from "../../entities/Progress";
import { scrapSingleUrl } from "./single_url";
import { batchProcess } from "../../utils/batchProcess";
import { getLinksFromSitemap } from "./sitemap";

export type WebScraperOptions = {
  urls: string[];
  mode: "single_urls" | "sitemap" | "crawl";
};
export class WebScraperDataProvider implements DataProvider<WebScraperOptions> {
  private urls: string[] = [""];
  private mode: "single_urls" | "sitemap" | "crawl" = "single_urls";

  authorize(): void {
    throw new Error("Method not implemented.");
  }

  authorizeNango(): Promise<void> {
    throw new Error("Method not implemented.");
  }

  private async convertUrlsToDocuments(
    urls: string[],
    inProgress?: (progress: Progress) => void
  ): Promise<Document[]> {
    const totalUrls = urls.length;
    let processedUrls = 0;
    const results: (Document | null)[] = new Array(urls.length).fill(null);
    await batchProcess(urls, 10, async (url: string, index: number) => {
      const result = await scrapSingleUrl(url);
      processedUrls++;
      if (inProgress) {
        inProgress({
          current: processedUrls,
          total: totalUrls,
          status: "SCRAPING",
          currentDocumentUrl: url,
        });
      }
      results[index] = result;
    });
    return results.filter((result) => result !== null) as Document[];
  }

  async getDocuments(
    inProgress?: (progress: Progress) => void
  ): Promise<Document[] | []> {
    if (this.urls[0].trim() === "") {
      throw new Error("Url is required");
    }
    if (this.mode === "crawl") {
      throw new Error("Crawl mode not implemented");
    }

    if (this.mode === "single_urls") {
      return this.convertUrlsToDocuments(this.urls, inProgress);
    }
    if (this.mode === "sitemap") {
      const links = await getLinksFromSitemap(this.urls[0]);
      console.log(`Found ${links.length} urls in sitemap`);
      return this.convertUrlsToDocuments(links, inProgress);
    }

    throw new Error("Method not implemented.");
  }

  setOptions(options: WebScraperOptions): void {
    if (!options.urls) {
      throw new Error("Urls are required");
    }
    this.urls = options.urls;
    this.mode = options.mode;
  }
}
