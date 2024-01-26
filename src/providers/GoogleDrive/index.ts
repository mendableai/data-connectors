import { DataProvider } from "../DataProvider";
import { Document } from "../../entities/Document";
import { google, drive_v3 } from "googleapis";
import { Nango } from "@nangohq/node";
import dotenv from "dotenv";
dotenv.config();

export type GoogleDriveInputOptions = {
  access_token: string;
  // url: string;
  // selectors: string[];
}

export interface NangoAuthorizationOptions {
  nango_connection_id: string;
  nango_integration_id?: string;
}

export interface GoogleDriveOptions
  extends GoogleDriveInputOptions,
    NangoAuthorizationOptions {}

export class GoogleDriveDataProvider implements DataProvider<GoogleDriveOptions> {
  // private oauth2Client: OAuth2Client;
  // private refresh_token: string = "";
  private drive: drive_v3.Drive;
  private using_nango: boolean = false;
  private nango_integration_id: string = "google-drive";
  private nango_connection_id: string = "";
  private nango: Nango;
  private access_token: string = "";

  constructor() {
    if (!process.env.NANGO_SECRET_KEY) {
      throw new Error("Nango secret key is required");
    }
    this.nango = new Nango({ secretKey: process.env.NANGO_SECRET_KEY });
  }

  async authorize({
    access_token,
  }: {
    access_token: string;
  }): Promise<void> {
    if (!access_token) {
      throw new Error("Google Drive access_token is required");
    }

    const CLIENT_ID = process.env.GOOGLE_DRIVE_CLIENT_ID;
    const CLIENT_SECRET = process.env.GOOGLE_DRIVE_CLIENT_SECRET;
    const REDIRECT_URI = process.env.GOOGLE_DRIVE_REDIRECT_URI;
    // const scopes = ['https://www.googleapis.com/auth/drive.readonly']

    if (!CLIENT_ID || !CLIENT_SECRET || !REDIRECT_URI || !access_token) {
      throw new Error("Google Drive credentials not set");
    }

    const oauth2Client = new google.auth.OAuth2(
      CLIENT_ID,
      CLIENT_SECRET,
      REDIRECT_URI
    );

    oauth2Client.setCredentials({
      access_token,
    });

    this.drive = google.drive({ version: "v3", auth: oauth2Client });
  }

  async authorizeNango(
    authorizeOptions: NangoAuthorizationOptions
  ): Promise<void> {
    const connection = await this.nango.getConnection(
      authorizeOptions.nango_integration_id || this.nango_integration_id,
      authorizeOptions.nango_connection_id
    );

    this.nango_connection_id = authorizeOptions.nango_connection_id;
    this.access_token = connection.credentials.raw.access_token;
    this.using_nango = true;

    this.authorize({ access_token: this.access_token });
  }


  async getDocuments(): Promise<Document[] | []> {
    const request = await this.drive.files.list();
    const files = request.data.files;
  
    const resultFiles: Document[] = [];
    for (const file of files) {
      let resultFile = null;
      switch (file.mimeType) {
        case ('application/vnd.google-apps.spreadsheet'): {
          resultFile = await this.drive.files.export({
            fileId: file.id,
            mimeType: 'text/csv',
          });
          break;
        }

        case ('application/vnd.google-apps.document'): {
          resultFile = await this.drive.files.export({
            fileId: file.id,
            mimeType: 'text/plain',
          });
          break;
        }

        case ('application/pdf'): {
          resultFile = await this.drive.files.get({
            fileId: file.id,
            alt: 'media',
          }, { responseType: 'stream' });
          break;
        }

        case ('application/vnd.google-apps.folder'): {
          // TODO: implement the folder logic
          break;
        }

        case ('text/plain'): {
          resultFile = await this.drive.files.export({
            fileId: file.id,
            mimeType: 'text/plain',
          });
          break;
        }

        default: {
          break;
        }
      }

      if (resultFile) {
        resultFiles.push({
          content: resultFile.data,
          type: "document",
          provider: "google-drive",
          metadata: {
            sourceURL: file.webViewLink || '',
            mimeType: file.mimeType,
          },
        });
      }
    }

    return resultFiles;
  }

  setOptions(): void {
    // if (!options.refresh_token) {
    //   throw new Error("Google Drive redirect URI is required");
    // }
    // this.refresh_token = options.refresh_token;
  }

}