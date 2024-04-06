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
    limit?: number;

  };
  concurrentRequests?: number;
};
export class WebScraperDataProvider implements DataProvider<WebScraperOptions> {
  private urls: string[] = [""];
  private mode: "single_urls" | "sitemap" | "crawl" = "single_urls";
  private includes: string[];
  private excludes: string[];
  private maxCrawledLinks: number;
  private returnOnlyUrls: boolean;
  private limit: number = 10000;
  private concurrentRequests: number = 20;

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
    for (let i = 0; i < urls.length; i += this.concurrentRequests) {
      const batchUrls = urls.slice(i, i + this.concurrentRequests);
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
        limit: this.limit,
      });
      const links = await crawler.start(inProgress,5,this.limit);
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
      return this.convertUrlsToDocuments(links.slice(0, this.limit), inProgress);
    }

    throw new Error("Method not implemented.");
  }

  setOptions(options: WebScraperOptions): void {
    if (!options.urls) {
      throw new Error("Urls are required");
    }
    this.urls = options.urls;
    this.mode = options.mode;
    this.concurrentRequests = options.concurrentRequests ?? 20;
    this.includes = options.crawlerOptions?.includes ?? [];
    this.excludes = options.crawlerOptions?.excludes ?? [];
    this.maxCrawledLinks = options.crawlerOptions?.maxCrawledLinks ?? 1000;
    this.returnOnlyUrls = options.crawlerOptions?.returnOnlyUrls ?? false;
    this.limit = options.crawlerOptions?.limit ?? 10000;
  }
}
