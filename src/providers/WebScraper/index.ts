import { DataProvider } from "../DataProvider";
import { Document } from "../../entities/Document";
import { Progress } from "../../entities/Progress";
import { scrapSingleUrl } from "./single_url";
import { batchProcess } from "../../utils/batchProcess";
import { getLinksFromSitemap } from "./sitemap";
import { WebCrawler } from "./crawler";

export type WebScraperOptions = {
  urls: string[];
  mode: "single_urls" | "sitemap" | "crawl";
  crawlerOptions?: {
    returnOnlyUrls?: boolean;
    includes?: string[];
    excludes?: string[];
    maxCrawledLinks?: number;
  };
};
export class WebScraperDataProvider implements DataProvider<WebScraperOptions> {
  private urls: string[] = [""];
  private mode: "single_urls" | "sitemap" | "crawl" = "single_urls";
  private includes: string[];
  private excludes: string[];
  private maxCrawledLinks: number;
  private returnOnlyUrls: boolean;

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
    for (let i = 0; i < urls.length; i += 10) {
      const batchUrls = urls.slice(i, i + 10);
      await Promise.all(batchUrls.map(async (url, index) => {
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
        results[i + index] = result;
      }));
    }
    return results.filter((result) => result !== null) as Document[];
  }

  async getDocuments(
    inProgress?: (progress: Progress) => void
  ): Promise<Document[] | []> {
    if (this.urls[0].trim() === "") {
      throw new Error("Url is required");
    }
    if (this.mode === "crawl") {
      const crawler = new WebCrawler({
        initialUrl: this.urls[0],
        includes: this.includes,
        excludes: this.excludes,
        maxCrawledLinks: this.maxCrawledLinks,
      });
      const links = await crawler.start();
      if (this.returnOnlyUrls) {
        return links.map((url) => ({
          content: "",
          metadata: { sourceURL: url },
          provider: "web",
          type: "text",
        }));
      }
      return this.convertUrlsToDocuments(links, inProgress);
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
    this.includes = options.crawlerOptions?.includes ?? [];
    this.excludes = options.crawlerOptions?.excludes ?? [];
    this.maxCrawledLinks = options.crawlerOptions?.maxCrawledLinks ?? 1000;
    this.returnOnlyUrls = options.crawlerOptions?.returnOnlyUrls ?? false;
  }
}
