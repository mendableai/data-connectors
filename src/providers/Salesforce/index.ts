import axios, { AxiosResponse } from "axios";
import { Nango } from "@nangohq/node";
import { DataProvider } from "../DataProvider";
import { Document } from "../../entities/Document";
import { NangoAuthorizationOptions } from "../GoogleDrive";
import { Progress } from "../../entities/Progress";

export const salesforceModes = [
  "accounts",
  "articles",
  "contacts",
  "deals",
  "tickets",
] as const;
const salesforceRecordBasics = [
  "attributes",
  "Id",
  "Name",
  "Subject",
  "Title",
  "Description",
  "CreatedDate",
  "LastModifiedDate",
  "Account",
  "Contact",
  "Owner",
];

export type SalesforceInputOptions = {
  /**
   * Salesforce integration mode. Can be one of the following: accounts, articles, contacts, deals, tickets
   */
  mode?: (typeof salesforceModes)[number];

  /**
   * Knowledgebase prefix. Depends on Salesforce configuration, defaults to "Knowledge"
   */
  knowledge_prefix?: string;
};

export type SalesforceAuthorizationOptions = {
  /**
   * Your Salesforce host. Example: "https://your-domain.my.salesforce.com"
   */
  host?: string;

  /**
   * Your Salesforce access token.
   */
  access_token?: string;
};

export interface SalesforceOptions
  extends SalesforceInputOptions,
    SalesforceAuthorizationOptions,
    NangoAuthorizationOptions {}

/**
 * The Salesforce Data Provider retrieves all pages from a Salesforce workspace.
 */
export class SalesforceDataProvider implements DataProvider<SalesforceOptions> {
  private host: string | undefined = undefined;
  private access_token: string | undefined = undefined;
  private mode: SalesforceInputOptions["mode"] = undefined;
  private knowledge_prefix: string = "Knowledge";

  /**
   * Authorizes the Salesforce Data Provider.
   */
  async authorize(options: SalesforceAuthorizationOptions): Promise<void> {
    if (options.host === undefined || options.host === null) {
      throw new Error("options.host is required.");
    }

    if (options.access_token === undefined || options.access_token === null) {
      throw new Error("options.access_token is required.");
    }

    this.host = options.host;
    this.access_token = options.access_token;
  }

  /**
   * Authorizes the Salesforce Data Provider via Nango.
   */
  async authorizeNango(options: NangoAuthorizationOptions): Promise<void> {
    if (!process.env.NANGO_SECRET_KEY) {
      throw new Error(
        "Nango secret key is required. Please specify it in the NANGO_SECRET_KEY environment variable."
      );
    }
    const nango = new Nango({ secretKey: process.env.NANGO_SECRET_KEY });

    const connection = await nango.getConnection(
      options.nango_integration_id ?? "salesforce",
      options.nango_connection_id
    );

    await this.authorize({
      host: connection.connection_config.instance_url,
      access_token: connection.credentials.raw.access_token,
    });
  }

  private async queryAll(
    query: string,
    inProgress?: (progress: Progress) => void
  ): Promise<any[]> {
    const uObj = new URL("services/data/v53.0/query", this.host);
    uObj.searchParams.set("q", query);
    let url = uObj.toString(), response: AxiosResponse<any, any>;

    const records = [];

    do {
      response = await axios(url, {
        headers: {
          Authorization: `Bearer ${this.access_token}`,
        },
      });

      if (inProgress) {
        inProgress({
          current: records.length + 1,
          total: response.data.totalSize,
          status: "SCRAPING",
        });
      }

      records.push(...response.data.records);

      url = new URL(response.data.nextRecordsUrl, this.host).toString();
    } while (!response.data.done)

    return records;
  }

  recordToDocument(record: any, type: string, lightningType: string): Document {
    return {
      id: record.Id,
      content: `${record.Name ?? record.Subject ?? record.Title}${
        record.Description ? `\n\n${record.Description}` : ""
      }`,
      createdAt: new Date(record.CreatedDate),
      updatedAt: new Date(record.LastModifiedDate),
      metadata: {
        sourceURL: new URL(
          `/lightning/r/${lightningType}/${encodeURIComponent(record.Id)}/view`,
          this.host
        ).toString(),

        // Dump non-basic metadata fields into metadata (e.g. NumberOfEmployees, Industry, Website, so on)
        ...Object.fromEntries(
          Object.entries(record).filter(
            ([k, v]) => !salesforceRecordBasics.includes(k) && v !== null
          )
        ),

        // Extract AccountName if Account was queried
        ...(record.Account
          ? {
              AccountName: record.Account.Name,
            }
          : {}),

        // Extract ContactName if Contact was queried
        ...(record.Contact
          ? {
              ContactName: record.Contact.Name,
            }
          : {}),

        // Extract OwnerName if Owner was queried
        ...(record.Contact
          ? {
              OwnerName: record.Owner.Name,
            }
          : {}),
      },
      type: type,
      provider: "salesforce",
    };
  }

  async getAccounts(
    inProgress?: (progress: Progress) => void
  ): Promise<Document[]> {
    const records = await this.queryAll(
      "SELECT Id, Name, Description, CreatedDate, LastModifiedDate, AccountNumber, Industry, AnnualRevenue, NumberOfEmployees, Phone, Rating, Site, Type, Website FROM Account",
      inProgress
    );
    return records.map((record) =>
      this.recordToDocument(record, "account", "Account")
    );
  }

  async getContacts(
    inProgress?: (progress: Progress) => void
  ): Promise<Document[]> {
    const records = await this.queryAll(
      "SELECT Id, Name, Description, CreatedDate, LastModifiedDate, Phone, Email, Account.Name FROM Contact",
      inProgress
    );
    return records.map((record) =>
      this.recordToDocument(record, "contact", "Contact")
    );
  }

  async getDeals(
    inProgress?: (progress: Progress) => void
  ): Promise<Document[]> {
    const records = await this.queryAll(
      "SELECT Id, Name, Description, CreatedDate, LastModifiedDate, Amount, StageName, Account.Name FROM Opportunity",
      inProgress
    );
    return records.map((record) =>
      this.recordToDocument(record, "deal", "Opportunity")
    );
  }

  async getTickets(
    inProgress?: (progress: Progress) => void
  ): Promise<Document[]> {
    const records = await this.queryAll(
      "SELECT Id, Subject, Description, CreatedDate, LastModifiedDate, CaseNumber, Account.Name, Contact.Name, Owner.Name, Priority, Status, Type, ClosedDate, Origin, IsClosed, IsEscalated FROM Case",
      inProgress
    ).catch((x) => {
      throw x.response.data;
    });
    return records.map((record) =>
      this.recordToDocument(record, "ticket", "Case")
    );
  }

  async getArticles(
    inProgress?: (progress: Progress) => void
  ): Promise<Document[]> {
    const records = await this.queryAll(
      `SELECT Id FROM ${this.knowledge_prefix}__kav WHERE IsLatestVersion = true AND IsDeleted = false`
    );

    return await Promise.all(
      records.map(async ({ Id }, i) => {
        if (inProgress) {
          inProgress({
            current: i + 1,
            total: records.length,
            status: "SCRAPING",
          });
        }

        const { data: record } = await axios(
          new URL(
            `services/data/v53.0/sobjects/${
              this.knowledge_prefix
            }__kav/${encodeURIComponent(Id)}`,
            this.host
          ).toString(),
          {
            headers: {
              Authorization: `Bearer ${this.access_token}`,
            },
          }
        );

        // These fields carry the content in knowledgebase articles.
        const customFields = Object.entries(record)
          .filter(([k, v]) => k.endsWith("__c") && typeof v === "string")
          .map(([k, v]) => [k.slice(0, -3), v]);

        // manually flip order of Answer and Question from the normal API response for the rendered markdown to look better
        if (
          customFields[0][0] === "Answer" &&
          customFields[1][0] === "Question"
        ) {
          customFields.reverse();
        }

        return {
          id: record.Id,
          content: `<h1>${record.Title}</h1>\n\n${customFields
            .map(([title, content]) => `<h2>${title}</h2>\n\n${content}`)
            .join("\n\n")}`,
          createdAt: new Date(record.CreatedDate),
          updatedAt: new Date(record.LastModifiedDate),
          metadata: {
            sourceURL: new URL(
              `/lightning/r/${this.knowledge_prefix}__kav/${encodeURIComponent(
                record.Id
              )}/view`,
              this.host
            ).toString(),
            ...Object.fromEntries(
              Object.entries(record).filter(
                ([k, v]) =>
                  [
                    "Summary",
                    "Language",
                    "PublishStatus",
                    "ValidationStatus",
                    "ArticleNumber",
                    "ArticleMasterlanguage",
                  ].includes(k) && v !== null
              )
            ),
          },
          type: "article",
          provider: "salesforce",
        };
      })
    );
  }

  /**
   * Retrieves all pages from the authorized Salesforce workspace.
   * All documents are returned with a plaintext content, except for articles, which are formatted with HTML.
   */
  async getDocuments(
    inProgress?: (progress: Progress) => void
  ): Promise<Document[]> {
    if (this.host === undefined || this.access_token === undefined) {
      throw new Error(
        "You must authorize the SalesforceDataProvider before requesting documents."
      );
    }

    if (!salesforceModes.includes(this.mode)) {
      throw new Error(
        "You must set the SalesforceDataProvider's mode before requesting documents."
      );
    }

    if (this.mode === "accounts") {
      return await this.getAccounts(inProgress);
    } else if (this.mode === "contacts") {
      return await this.getContacts(inProgress);
    } else if (this.mode === "deals") {
      return await this.getDeals(inProgress);
    } else if (this.mode === "tickets") {
      return await this.getTickets(inProgress);
    } else if (this.mode === "articles") {
      return await this.getArticles(inProgress);
    } else {
      throw new Error("Unimplemented mode " + this.mode);
    }
  }

  /**
   * Sets the options (e.g. the mode) of the Salesforce Data Provider.
   */
  setOptions(options: SalesforceOptions): void {
    if (!salesforceModes.includes(options.mode)) {
      throw new Error(
        "Invalid value for options.mode, must be one of the following: " +
          salesforceModes.join(", ")
      );
    }

    this.mode = options.mode;
    this.knowledge_prefix = options.knowledge_prefix ?? this.knowledge_prefix;
  }
}
