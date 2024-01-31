import { Nango } from "@nangohq/node";
import { DataProvider } from "../DataProvider";
import { Document } from "../../entities/Document";
import { NangoAuthorizationOptions } from "../GoogleDrive";
import { Version3Client, Config } from "jira.js";
import { Issue } from "jira.js/out/version3/models/issue";
import { Document as JiraDocument } from "jira.js/out/version3/models/document";

export type JiraInputOptions = object;

export type JiraAuthorizationOptions = {
  /**
   * Your JIRA host. Example: "https://your-domain.atlassian.net"
   */
  host?: string;

  /**
   * Your JIRA authentication smethod. [Read more here.](https://github.com/mrrefactoring/jira.js/?tab=readme-ov-file#authentication)
   */
  auth?: Config.Authentication;
};

export interface JiraOptions
  extends JiraInputOptions,
    JiraAuthorizationOptions,
    NangoAuthorizationOptions {}

/**
 * Retrieves all projects from Jira.
 */
async function getAllIssues(
  jira: Version3Client,
  startAt?: number
): Promise<Issue[]> {
  const projects = await jira.issueSearch.searchForIssuesUsingJql({
    jql: "",
    fields: [
      "id",
      "key",
      "summary",
      "description",
      "issuetype",
      "status",
      "assignee",
      "reporter",
      "project",
      "created",
      "updated",
    ],
    startAt,
    maxResults: 50,
  });

  if (projects.total === 50) {
    return (projects.issues ?? []).concat(
      await getAllIssues(jira, projects.startAt + projects.total)
    );
  } else {
    return projects.issues ?? [];
  }
}

/**
 * Attemts to prettify an issue URL.
 * This only works well if the host is a real instance, and not derived from a cloudId.
 * If the latter is true, this will return the ugly API URL.
 */
function prettifyIssueURL(host: string, issue: Issue): string {
  if (host.startsWith("https://api.atlassian.com/ex/jira/")) {
    // This host means that the Atlassian workspace is referred to via a cloudId,
    // which means that we cannot create a pretty URL. An API URL has to be returned instead.
    return issue.self;
  } else {
    let out = host;
    if (!out.endsWith("/")) {
      out += "/";
    }

    out += `browse/${issue.fields.project.key}-${issue.id}`;
  }
}

/**
 * Converts a JIRA API Document to Markdown.
 */
function documentToMarkdown(document: JiraDocument): string {
  const output = [];
  let currentNodes: {
    document: Omit<JiraDocument, "version">;
    ref: any[];
    parents: JiraDocument["type"][];
  }[] = [{ document, ref: output, parents: [] }];

  while (currentNodes.length > 0) {
    const nextNodes: typeof currentNodes = [];
    for (const { document, ref, parents } of currentNodes) {
      const nextRef = [];

      if (document.type === "paragraph") {
        ref.push(nextRef);
        if (parents.includes("listItem")) {
          ref.push("\n");
        } else {
          ref.push("\n\n");
        }
      } else if (document.type === "heading") {
        ref.push("#".repeat(document.attrs.level) + " ");
        ref.push(nextRef);
        ref.push("\n\n");
      } else if (document.type === "text") {
        let markMd = "";
        let link = undefined;
        (document.marks ?? []).forEach((mark) => {
          if (mark.type === "code") {
            markMd += "`";
          } else if (mark.type === "em") {
            markMd += "*";
          } else if (mark.type === "strike") {
            markMd += "~~";
          } else if (mark.type === "strong") {
            markMd += "**";
          } else if (mark.type === "link") {
            link = mark.attrs;
          }
        });

        const md = markMd + document.text + [...markMd].reverse().join("");

        if (link !== undefined) {
          ref.push(`[${md}](${link.href})`);
        } else {
          ref.push(md);
        }
      } else if (document.type === "emoji") {
        ref.push(document.attrs.text);
      } else if (document.type === "code") {
        ref.push("`");
        ref.push(nextRef);
        ref.push("`");
      } else if (document.type === "strong") {
        ref.push("**");
        ref.push(nextRef);
        ref.push("**");
      } else if (document.type === "em") {
        ref.push("*");
        ref.push(nextRef);
        ref.push("*");
      } else if (document.type === "strike") {
        ref.push("~~");
        ref.push(nextRef);
        ref.push("~~");
      } else if (document.type === "link") {
        ref.push("[");
        ref.push(nextRef);
        ref.push("](${document.attrs.href})");
      } else if (document.type === "listItem") {
        ref.push(
          "  ".repeat(
            parents.filter((x) => x == "bulletList" || x == "orderedList")
              .length
          )
        );
        const rev = [...parents].reverse();
        const type = rev.find((x) => x == "bulletList" || x == "orderedList");
        if (type == "bulletList") {
          ref.push("- ");
        } else if (type == "orderedList") {
          ref.push("1. ");
        }
        ref.push(nextRef);
      } else {
        ref.push(nextRef);
      }

      if (document.content) {
        for (const child of document.content) {
          nextNodes.push({
            document: child,
            ref: nextRef,
            parents: [...parents, document.type],
          });
        }
      }
    }
    currentNodes = nextNodes;
  }

  return output.flat(Infinity).join("");
}

/**
 * The Jira Data Provider retrieves all pages from a Jira workspace.
 */
export class JiraDataProvider implements DataProvider<JiraOptions> {
  private jira: Version3Client = undefined;
  private host: string;

  /**
   * Authorizes the Jira Data Provider.
   */
  async authorize(options: JiraAuthorizationOptions): Promise<void> {
    if (options.host === undefined || options.host === null) {
      throw new Error("options.host is required.");
    }

    if (options.auth === undefined || options.auth === null) {
      throw new Error("options.auth is required.");
    }

    this.host = options.host;

    this.jira = new Version3Client({
      host: options.host,
      authentication: options.auth,
    });
  }

  /**
   * Authorizes the Jira Data Provider via Nango.
   */
  async authorizeNango(options: NangoAuthorizationOptions): Promise<void> {
    if (!process.env.NANGO_SECRET_KEY) {
      throw new Error(
        "Nango secret key is required. Please specify it in the NANGO_SECRET_KEY environment variable."
      );
    }
    const nango = new Nango({ secretKey: process.env.NANGO_SECRET_KEY });

    const connection = await nango.getConnection(
      options.nango_integration_id ?? "jira",
      options.nango_connection_id
    );

    await this.authorize({
      host: `https://api.atlassian.com/ex/jira/${connection.connection_config.cloudId}`,
      auth: {
        oauth2: {
          accessToken: connection.credentials.raw.access_token,
        },
      },
    });
  }

  /**
   * Retrieves all authorized issues from the authorized Jira workspace.
   * The issues' content will be Markdown.
   */
  async getDocuments(): Promise<Document[]> {
    if (this.jira === undefined) {
      throw Error(
        "You must authorize the JiraDataProvider before requesting documents."
      );
    }

    const issues = await getAllIssues(this.jira);

    return issues.map((issue) => {
      const description = issue.fields.description;

      return {
        provider: "jira",
        id: `${issue.fields.project.key}-${issue.id}`,
        createdAt: new Date(issue.fields.created),
        updatedAt: new Date(issue.fields.updated),
        content:
          "# " +
          issue.fields.summary +
          (description ? "\n\n" + documentToMarkdown(description) : ""),
        metadata: {
          sourceURL: prettifyIssueURL(this.host, issue),
          type: issue.fields.issuetype.name,
          status: issue.fields.status.name,
          assignee: issue.fields.assignee?.displayName,
          reporter: issue.fields.reporter?.displayName,
          project: issue.fields.project.name,
        },
        type: "issue",
      };
    });
  }

  /**
   * Do not call. The Jira Data Provider doesn't have any options.
   */
  setOptions(_options: JiraOptions): void {}
}
