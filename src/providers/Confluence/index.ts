import { DataProvider } from "../DataProvider";
import { Document } from "../../entities/Document";
import { Nango } from "@nangohq/node";
import { NangoDocument } from "../../entities/NangoDocument";

export interface ConfluenceInputOptions {
  text: string;
}
export interface ConfluenceAuthorizeOptions {
  access_token: string;
  // client_id: string;
  // client_secret: string;
  // authorization_url: string;
}

export interface NangoConfluenceAuthorizationOptions {
  nango_connection_id: string;
  nango_integration_id?: string;
}

// create an interface thant join the two interfaces above
export interface ConfluenceOptions
  extends ConfluenceInputOptions,
    ConfluenceAuthorizeOptions,
    NangoConfluenceAuthorizationOptions {}

export class ConfluenceDataProvider implements DataProvider<ConfluenceOptions> {
  private client_id: string = "";
  private client_secret: string = "";
  // this is the guy we need to get from the user
  private authorization_url: string = "";
  //
  private scopes: string[] = [
    "read:confluence-space.summary",
    "read:confluence-props",
    "read:confluence-content.all",
    "read:confluence-content.summary",
    "read:confluence-content.permission",
    "readonly:content.attachment:confluence",
    "read:content:confluence",
    "read:content-details:confluence",
    "read:page:confluence",
    "read:attachment:confluence",
    "read:blogpost:confluence",
    "read:custom-content:confluence",
    "read:content.metadata:confluence",
  ];
  private token_url: string = "https://auth.atlassian.com/oauth/token"; // ??
  private access_token: string = "";
  // Don't need this?
  private redirect_uri: string = "https://X";

  private using_nango: boolean = false;
  private nango_integration_id: string = "confluence";
  private nango_connection_id: string = "";
  private nango: Nango;

  constructor() {
    this.nango = new Nango({ secretKey: process.env.NANGO_SECRET_KEY });
  }

  async authorize({ access_token }: { access_token: string }): Promise<void> {
    throw new Error("Method not implemented.");
  }

  async authorizeNango(
    authorizeOptions: NangoConfluenceAuthorizationOptions
  ): Promise<void> {
    const connection = await this.nango.getConnection(
      authorizeOptions.nango_integration_id || this.nango_integration_id,
      authorizeOptions.nango_connection_id
    );

    this.nango_connection_id = authorizeOptions.nango_connection_id;
    this.access_token = connection.credentials.raw.access_token;
    this.using_nango = true;

    this.authorize({ access_token: this.access_token });

    return;
  }

  async getDocuments(): Promise<Document[] | []> {
    throw new Error("Method not implemented.");

    // if (this.using_nango) {
    //   return new Promise<Document[] | []>((resolve, reject) => {
    //     const intervalId = setInterval(async () => {
    //       const rcs = await this.nango.listRecords({
    //         providerConfigKey: this.nango_integration_id,
    //         connectionId: this.nango_connection_id,
    //         model: "Document",
    //       });
    //       const records = rcs.records as NangoDocument[];
    //       if (records.length > 0) {
    //         clearInterval(intervalId);
    //         const documents = records.map((record) => {
    //           return record.transformToDocument("confluence");
    //         });
    //         resolve(documents);
    //       }
    //     }, 2000);
    //   });
    // }
    // return Promise.resolve([]);
  }

  nangoPoolingDocs(): Promise<Document[] | []> {
    // await for documents to be ready
    return new Promise((resolve, reject) => []);
  }

  setOptions(): void {
    throw new Error("Method not implemented.");
  }
}
