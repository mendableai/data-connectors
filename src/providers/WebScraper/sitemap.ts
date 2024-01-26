import axios from "axios";
import { parseStringPromise } from "xml2js";

export async function getLinksFromSitemap(
  sitemapUrl: string,
  allUrls: string[] = []
): Promise<string[]> {
  try {
    let content: string;
    try {
      const response = await axios.get(sitemapUrl);
      content = response.data;
    } catch (error) {
      console.error(`Request failed for ${sitemapUrl}: ${error}`);
      return allUrls;
    }

    const parsed = await parseStringPromise(content);
    const root = parsed.urlset || parsed.sitemapindex;

    if (root && root.sitemap) {
      for (const sitemap of root.sitemap) {
        if (sitemap.loc && sitemap.loc.length > 0) {
          await getLinksFromSitemap(sitemap.loc[0], allUrls);
        }
      }
    } else if (root && root.url) {
      for (const url of root.url) {
        if (url.loc && url.loc.length > 0) {
          allUrls.push(url.loc[0]);
        }
      }
    }
  } catch (error) {
    console.error(`Error processing ${sitemapUrl}: ${error}`);
  }

  return allUrls;
}
