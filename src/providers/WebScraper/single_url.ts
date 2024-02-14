import * as cheerio from "cheerio";
import { ScrapingBeeClient } from "scrapingbee";
import { attemptScrapWithRequests, sanitizeText } from "./utils/utils";
import { extractMetadata } from "./utils/metadata";
import dotenv from "dotenv";
import { Document } from "../../entities/Document";
dotenv.config();

async function scrapWithScrapingBee(url: string): Promise<string | null> {
  try {
    const client = new ScrapingBeeClient(process.env.SCRAPING_BEE_API_KEY);
    const response = await client.get({
      url: url,
      params: { timeout: 15000 },
      headers: { "ScrapingService-Request": "TRUE" },
    });

    if (response.status !== 200 && response.status !== 404) {
      console.error(
        `Scraping bee error in ${url} with status code ${response.status}`
      );
      return null;
    }
    const decoder = new TextDecoder();
    const text = decoder.decode(response.data);
    return text;
  } catch (error) {
    console.error(`Error scraping with Scraping Bee: ${error}`);
    return null;
  }
}

export async function scrapSingleUrl(urlToScrap: string): Promise<Document> {
  urlToScrap = urlToScrap.trim();

  try {
    let content = await scrapWithScrapingBee(urlToScrap);

    if (!content) {
      const res = await attemptScrapWithRequests(urlToScrap);
      if (!res) {
        return null;
      }
      content = res;
    }

    const soup = cheerio.load(content);
    soup("script").remove();
    soup("style").remove();

    const text = sanitizeText(soup.text());
    const metadata = extractMetadata(soup, urlToScrap);

    if (metadata) {
      return {
        content: text,
        provider: "web-scraper",
        metadata: { ...metadata, sourceURL: urlToScrap },
      } as Document;
    }
    return {
      content: text,
      provider: "web-scraper",
      metadata: { sourceURL: urlToScrap },
    } as Document;
  } catch (error) {
    console.error(`Error: ${error} - Failed to fetch URL: ${urlToScrap}`);
    return {
      content: "",
      provider: "web-scraper",
      metadata: { sourceURL: urlToScrap },
    } as Document;
  }
}
