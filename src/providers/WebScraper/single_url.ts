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

export async function scrapSingleUrl(urlToScrap: string, toMarkdown: boolean = true): Promise<Document> {
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
    var TurndownService = require('turndown')

    const turndownService = new TurndownService();
    let markdownContent = '';
    if (toMarkdown) {
      markdownContent = turndownService.turndown(content);
    }


    const soup2 = cheerio.load(content);
    const metadata = extractMetadata(soup2, urlToScrap);
    const soup = cheerio.load(markdownContent);


    soup("script, style, iframe, noscript").remove();
    let formattedText = '';
    soup('body').children().each(function() {
      const tagName = this.tagName.toLowerCase();
      if (["p", "br", "h1", "h2", "h3", "h4", "h5", "h6"].includes(tagName)) {
        formattedText += `${soup(this).text()}\n`;
      } else if (tagName === 'pre' || tagName === 'code' || tagName === 'span') {
        formattedText += `${soup(this).text()}`;
      } else {
        let text = soup(this).text();
        text = text.split('\n').map(line => line.replace(/\s+/g, ' ').trim()).join('\n').replace(/\n{3,}/g, '\n\n');
        formattedText += `${text} `;
      }
    });

    const text = sanitizeText(formattedText.trim());

    if (metadata) {
      console.log(markdownContent)
      console.log("here", toMarkdown)
      return {
        content: text,
        provider: "web-scraper",
        metadata: { ...metadata, sourceURL: urlToScrap },
      } as Document;
    } else {
      return {
        content: text,
        provider: "web-scraper",
        metadata: { sourceURL: urlToScrap },
      } as Document;
    }
    return {
      content: markdownContent,
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
