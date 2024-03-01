import { Nango } from "@nangohq/node";
import { APIErrorCode, Client } from "@notionhq/client";
import { DataProvider } from "../DataProvider";
import { Document } from "../../entities/Document";
import { NangoAuthorizationOptions } from "../GoogleDrive";
import {
  BlockObjectResponse,
  ListBlockChildrenResponse,
  PageObjectResponse,
  RichTextItemResponse,
  SearchResponse,
} from "@notionhq/client/build/src/api-endpoints";

export type NotionInputOptions = object;

export type NotionAuthorizationOptions = {
  token?: string;
};

export interface NotionOptions
  extends NotionInputOptions,
    NotionAuthorizationOptions,
    NangoAuthorizationOptions {}

/**
 * Represents a Notion block and its children, which are also blocks that may themselves have children too.
 */
export type NotionBlockWithChildren = {
  block: BlockObjectResponse;
  children: NotionBlockWithChildren[];
};

/**
 * Represents a Notion page and its blocks.
 */
type NotionPageWithBlocks = {
  page: PageObjectResponse;
  blocks: NotionBlockWithChildren[];
};

/**
 * Recursively retrieves the children of a block.
 *
 * @param notion The (initialized, authenticated) Notion client.
 * @param block_id The block ID to retrive all children of.
 */
async function recursiveBlockChildren(
  notion: Client,
  block_id: string
): Promise<NotionBlockWithChildren[]> {
  const blocks: NotionBlockWithChildren[] = [];
  let req: ListBlockChildrenResponse;
  const i = 0;
  let exponentialBackoff = 1;

  do {
    try {
      req = await notion.blocks.children.list({ block_id });
    } catch (error) {
      if (error.code === APIErrorCode.RateLimited) {
        console.log(
          `Rate limited, retrying in ${exponentialBackoff} seconds...`
        );
        await new Promise((resolve) =>
          setTimeout(resolve, exponentialBackoff * 1000)
        );
        exponentialBackoff *= 2;
        continue;
      }
    }
    const results = req.results as BlockObjectResponse[];

    for (const block of results) {
      // Using recursive function calls in here is fine,
      // because we use (real) async functions,
      // so the call stack will not overflow.
      blocks.push({
        block,
        children: block.has_children
          ? await recursiveBlockChildren(notion, block.id)
          : [],
      });
    }
  } while (req.has_more);

  return blocks;
}

/**
 * Converts a Notion rich text item to Markdown.
 * Thoroughly supports TextRichTextItems, dumps the plain_text value for others (equations, mentions).
 */
function textItemToMarkdown(item: RichTextItemResponse): string {
  if (item.type === "text") {
    let md = "";

    if (item.annotations.code) {
      md += "```";
    }

    if (item.annotations.bold) {
      md += "**";
    }

    if (item.annotations.italic) {
      md += "*";
    }

    if (item.annotations.strikethrough) {
      md += "~~";
    }

    const mdEnd = [...md].reverse().join("");

    return (
      md +
      (item.text.link
        ? `[${item.text.content}](${item.text.link.url})`
        : item.text.content) +
      mdEnd
    );
  } else {
    return item.plain_text;
  }
}

/**
 * Converts an array of rich text items to plain text.
 */
function blockToMarkdown(
  block: BlockObjectResponse,
  listLevel: number
): { md: string | null; isList: boolean } {
  let md = "",
    isList = false,
    suffix = "\n\n";

  if (block.type === "heading_1") {
    md = "# ";
  } else if (block.type === "heading_2") {
    md = "## ";
  } else if (block.type === "heading_3") {
    md = "### ";
  } else if (block.type == "bulleted_list_item") {
    md = "  ".repeat(listLevel) + "- ";
    suffix = "\n";
    isList = true;
  } else if (block.type == "numbered_list_item") {
    // Markdown renderers automatically increment numbers in ordered lists if every list number is 1.
    // We can't get the proper list numbers anyways (Notion numbered lists don't always start at one, and the API doesn't expose it), so why bother?
    md = "  ".repeat(listLevel) + "1. ";
    suffix = "\n";
    isList = true;
  } else if (block.type === "quote") {
    // Add quote character to the start of the line
    return {
      md: block.quote.rich_text
        .map((item) => textItemToMarkdown(item))
        .join("")
        .split("\n")
        .map((line) => "> " + line)
        .join("\n"),
      isList: false,
    };
  } else if (block.type === "divider") {
    md = "---";
  } else if (block.type === "table") {
    // Quick and dirty table hack
    return { md: "", isList };
  } else if (block.type === "table_row") {
    // Quick and dirty table row hack
    // Headerless tables are not supported by some Markdown renderers, but it should be enough.
    return {
      md:
        "|" +
        block.table_row.cells
          .map((cell) => cell.map((item) => textItemToMarkdown(item)).join(""))
          .join("|") +
        "|\n",
      isList: false,
    };
  } else if (block.type === "image") {
    const caption = block.image[block.image.type].caption;
    md = `![${
      caption
        ? caption.map((item) => textItemToMarkdown(item)).join("")
        : "image"
    }](${block.image[block.image.type].url})`;
  } else if (block.type === "link_preview") {
    return {
      md: `[${block.link_preview.url}](${block.link_preview.url})`,
      isList: false,
    };
  }

  const rich_text: RichTextItemResponse[] | undefined =
    block[block.type].rich_text;

  if (rich_text !== undefined) {
    md += rich_text.map((item) => textItemToMarkdown(item)).join("");
  }

  if (block.type === "code") {
    md =
      "```" + (block.code.language ?? "") + "\n" + md.replace(/```/g, "`\v``"); // prevent code block escapes
  }

  if (md.length === 0 && rich_text === undefined) {
    // Block type is unsupported by Markdown and it doesn't have a plain text conversion from the Notion API.
    return { md: null, isList };
  } else {
    return { md: md + suffix, isList };
  }
}

/**
 * Converts blocks and their children (recursively) to Markdown.
 */
function blocksToMarkdown(blocks: NotionBlockWithChildren[]): string {
  const output = [];

  // Using recursive function calls in here is NOT fine,
  // because big pages will exceed the call stack limit,
  // so shenanigans have to ensue.

  let currentBlocks: {
    block: NotionBlockWithChildren;
    ref: any[];
    listLevel: number;
  }[] = blocks.map((block) => ({ block, ref: output, listLevel: 0 }));

  while (currentBlocks.length > 0) {
    const nextBlocks: typeof currentBlocks = [];
    for (const {
      block: { block, children },
      ref,
      listLevel,
    } of currentBlocks) {
      const listContext = {
        listLevel,
        listNumber: 1,
      };

      const { md, isList } = blockToMarkdown(block, listLevel) ?? {
        md: null,
        isList: false,
      };

      if (md !== null) {
        ref.push(md);
      }

      const next = [];
      ref.push(next);

      for (const block of children) {
        nextBlocks.push({
          block,
          ref: next,
          listLevel: listLevel + (isList ? 1 : 0),
        });
      }
    }
    currentBlocks = nextBlocks;
  }

  return output.flat(Infinity).join("");
}

/**
 * The Notion Data Provider retrieves all pages from a Notion workspace.
 */
export class NotionDataProvider implements DataProvider<NotionOptions> {
  private notion: Client = undefined;

  /**
   * Authorizes the Notion Data Provider.
   * **The Notion integration must have the "Read content" capability.**
   */
  async authorize(options: NotionAuthorizationOptions): Promise<void> {
    if (options.token === undefined || options.token === null) {
      throw new Error("options.token is required.");
    }

    this.notion = new Client({
      auth: options.token,
    });
  }

  /**
   * Authorizes the Notion Data Provider via Nango.
   * **The Notion integration must have the "Read content" capability.**
   */
  async authorizeNango(options: NangoAuthorizationOptions): Promise<void> {
    if (!process.env.NANGO_SECRET_KEY) {
      throw new Error(
        "Nango secret key is required. Please specify it in the NANGO_SECRET_KEY environment variable."
      );
    }
    const nango = new Nango({ secretKey: process.env.NANGO_SECRET_KEY });

    const connection = await nango.getConnection(
      options.nango_integration_id ?? "notion",
      options.nango_connection_id
    );

    await this.authorize({
      token: connection.credentials.raw.access_token,
    });
  }

  /**
   * Retrieves all authorized pages from the authorized Notion workspace.
   * The pages' content will be converted to Markdown.
   */
  async getDocuments(): Promise<Document[]> {
    if (this.notion === undefined) {
      throw Error(
        "You must authorize the NotionDataProvider before requesting documents."
      );
    }

    const all: NotionPageWithBlocks[] = [];

    let req: SearchResponse = undefined;

    let exponentialBackoff = 1;

    do {
      try {
        req = await this.notion.search({
          start_cursor: req?.next_cursor,
          filter: {
            property: "object",
            value: "page",
          },
          page_size: 100,
        });
      } catch (error) {
        if (error.code === APIErrorCode.RateLimited) {
          console.log(
            `Rate limited, retrying in ${exponentialBackoff} seconds...`
          );
          await new Promise((resolve) =>
            setTimeout(resolve, exponentialBackoff * 1000)
          );
          exponentialBackoff *= 2;
          continue;
        }
      }

      const pages = req.results.filter(
        (x) => x.object === "page"
      ) as PageObjectResponse[];

      const pagesWithBlocks: NotionPageWithBlocks[] = await Promise.all(
        pages.map(async (page) => {
          return {
            page,
            blocks: await recursiveBlockChildren(this.notion, page.id),
          };
        })
      );

      all.push(...pagesWithBlocks);
    } while (req.has_more);

    const pages = all.map(({ page, blocks }) => {
      return {
        page,
        content: blocksToMarkdown(blocks),
      };
    });

    return pages.map(({ page, content }) => ({
      provider: "notion",
      id: page.id,
      createdAt: new Date(page.created_time),
      updatedAt: new Date(page.last_edited_time),
      content,
      metadata: {
        sourceURL: page.public_url ?? page.url,
      },
      type: "page",
    }));
  }

  /**
   * Do not call. The Notion Data Provider doesn't have any integrations.
   */
  setOptions(_options: NotionOptions): void {}
}
