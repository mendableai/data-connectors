import { Nango } from "@nangohq/node";
import { DataProvider } from "../DataProvider";
import { Document } from "../../entities/Document";
import { NangoAuthorizationOptions } from "../GoogleDrive";
import { ConfluenceClient, Config } from "confluence.js";
import { Content } from "confluence.js/out/api/models";
import axios from "axios";
import { Progress } from "../../entities/Progress";

export type ConfluenceInputOptions = object;

export type ConfluenceAuthorizationOptions = {
  /**
   * Your Confluence host. Example: "https://your-domain.atlassian.net"
   */
  host?: string;

  /**
   * Your Confluence authentication method. [Read more here.](https://github.com/mrrefactoring/confluence.js/?tab=readme-ov-file#authentication)
   */
  auth?: Config.Authentication;
};

export interface ConfluenceOptions
  extends ConfluenceInputOptions,
    ConfluenceAuthorizationOptions,
    NangoAuthorizationOptions {}

/**
 * Retrieves all pages from Confluence.
 */
async function getAllPages(
  confluence: ConfluenceClient,
  start?: number
): Promise<Content[]> {
  const content = await confluence.content.getContent({
    start,
    expand: ["body.storage", "history", "history.lastUpdated", "ancestors"],
    type: "page",
  });

  if (content.size === content.limit) {
    return (content.results ?? []).concat(
      await getAllPages(confluence, content.start + content.size)
    );
  } else {
    return content.results ?? [];
  }
}

/**
 * The Confluence Data Provider retrieves all pages from a Confluence workspace.
 */
export class ConfluenceDataProvider implements DataProvider<ConfluenceOptions> {
  private confluence: ConfluenceClient = undefined;

  private cloudUrl: string = "";

  /**
   * Authorizes the Confluence Data Provider.
   */
  async authorize(options: ConfluenceAuthorizationOptions): Promise<void> {
    if (options.host === undefined || options.host === null) {
      throw new Error("options.host is required.");
    }

    if (options.auth === undefined || options.auth === null) {
      throw new Error("options.auth is required.");
    }

    this.confluence = new ConfluenceClient({
      host: options.host,
      authentication: options.auth,
    });
  }

  /**
   * Authorizes the Confluence Data Provider via Nango.
   */
  async authorizeNango(options: NangoAuthorizationOptions): Promise<void> {
    if (!process.env.NANGO_SECRET_KEY) {
      throw new Error(
        "Nango secret key is required. Please specify it in the NANGO_SECRET_KEY environment variable."
      );
    }
    const nango = new Nango({ secretKey: process.env.NANGO_SECRET_KEY });

    const connection = await nango.getConnection(
      options.nango_integration_id ?? "confluence",
      options.nango_connection_id
    );

    const access = await axios.get(
      "https://api.atlassian.com/oauth/token/accessible-resources",
      {
        headers: {
          Accept: "application/json",
          Authorization: `Bearer ${connection.credentials.raw.access_token}`,
        },
      }
    );

    const cloudId = access.data[0].id;
    this.cloudUrl = access.data[0].url

    await this.authorize({
      host: `https://api.atlassian.com/ex/confluence/${cloudId}`,
      auth: {
        oauth2: {
          accessToken: connection.credentials.raw.access_token,
        },
      },
    });
  }

  /**
   * Retrieves all pages from the authorized Confluence workspace.
   * The pages' content will be HTML.
   */
  async getDocuments(inProgress?: (progress: Progress) => void): Promise<Document[]> {
    if (this.confluence === undefined) {
      throw Error(
        "You must authorize the ConfluenceDataProvider before requesting documents."
      );
    }

    const pages = await getAllPages(this.confluence);

    return await Promise.all(
      pages.map(async (page, i) => {
        if (inProgress) {
          inProgress({
            current: i + 1,
            total: pages.length,
            status: "SCRAPING",
            currentDocumentUrl: page._links.webui,
          });
        }

        const ancestor = (page.ancestors ?? [])[0];
        return {
          provider: "confluence",
          id: `${page.id}`,
          content: `<h1>${page.title}</h1>\n${page.body.storage.value}`,
          createdAt: new Date((page as any).history.createdDate),
          updatedAt: new Date((page as any).history.lastUpdated.when),
          metadata: {
            sourceURL: this.cloudUrl + "/wiki" + page._links.webui,
            ancestor: ancestor?.title,
          },
          type: "page",
        };
      })
    );
  }

  /**
   * Do not call. The Confluence Data Provider doesn't have any options.
   */
  setOptions(_options: ConfluenceOptions): void {}
}
