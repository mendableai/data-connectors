// import * as cheerio from 'cheerio';
import { CheerioAPI } from "cheerio";
interface Metadata {
  title: string | null;
  description: string | null;
  language: string | null;
}

export function extractMetadata(soup: CheerioAPI, url: string): Metadata {
  let title: string | null = null;
  let description: string | null = null;
  let language: string | null = null;

  try {
    title = soup("title").text() || null;
    description = soup('meta[name="description"]').attr("content") || null;

    // Assuming the language is part of the URL as per the regex pattern
    const pattern = /([a-zA-Z]+-[A-Z]{2})/;
    const match = pattern.exec(url);
    language = match ? match[1] : null;
  } catch (error) {
    console.error("Error extracting metadata:", error);
  }

  return { title, description, language };
}
