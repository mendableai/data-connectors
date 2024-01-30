import { DataProvider } from "../DataProvider";
import { Document } from "../../entities/Document";
import { google, drive_v3 } from "googleapis";
import { Nango } from "@nangohq/node";
import dotenv from "dotenv";
dotenv.config();

export type GoogleDriveInputOptions = {
  access_token: string;
};

export interface NangoAuthorizationOptions {
  nango_connection_id: string;
  nango_integration_id?: string;
}

export interface GoogleDriveOptions
  extends GoogleDriveInputOptions,
    NangoAuthorizationOptions {}

export class GoogleDriveDataProvider
  implements DataProvider<GoogleDriveOptions>
{
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

  async authorize({ access_token }: { access_token: string }): Promise<void> {
    if (!access_token) {
      throw new Error("Google Drive access_token is required");
    }

    const CLIENT_ID = process.env.GOOGLE_DRIVE_CLIENT_ID;
    const CLIENT_SECRET = process.env.GOOGLE_DRIVE_CLIENT_SECRET;
    const REDIRECT_URI = process.env.GOOGLE_DRIVE_REDIRECT_URI;

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
    try {
      const connection = await this.nango.getConnection(
        authorizeOptions.nango_integration_id || this.nango_integration_id,
        authorizeOptions.nango_connection_id
      );

      this.nango_connection_id = authorizeOptions.nango_connection_id;
      this.access_token = connection.credentials.raw.access_token;
      this.using_nango = true;

      this.authorize({ access_token: this.access_token });
    } catch (error) {
      throw new Error(error.message);
    }
  }

  async getDocuments(): Promise<Document[] | []> {
    const request = await this.drive.files.list();
    const files = request.data.files;

    const resultFiles: Document[] = [];
    for (const file of files) {
      let resultFile = null;

      if (file.mimeType === "application/vnd.google-apps.folder") {
        const folderId = file.id;
        const query = `'${folderId}' in parents and trashed=false`;
        const folderRequest = await this.drive.files.list({
          q: query,
          fields: "files(id, name, mimeType, webViewLink)",
        });
        const folderFiles = folderRequest.data.files;
        if (folderFiles.length > 0) {
          for (const folderFile of folderFiles) {
            const parsedFile = await this.parseFile(folderFile);
            if (parsedFile) {
              resultFiles.push({
                content: parsedFile.data,
                type: "document",
                provider: "google-drive",
                metadata: {
                  sourceURL: folderFile.webViewLink || "",
                  mimeType: folderFile.mimeType,
                },
              });
            }
          }
        }
      } else {
        resultFile = await this.parseFile(file);
      }

      if (resultFile) {
        resultFiles.push({
          content: resultFile.data,
          type: "document",
          provider: "google-drive",
          metadata: {
            sourceURL: file.webViewLink || "",
            mimeType: file.mimeType,
          },
        });
      }
    }

    return resultFiles;
  }

  async parseFile(
    file: drive_v3.Schema$File
  ): Promise<{ data: string } | null> {
    let resultFile = null;

    switch (file.mimeType) {
      case "application/vnd.google-apps.spreadsheet": {
        resultFile = await this.drive.files.export({
          fileId: file.id,
          mimeType: "text/csv",
        });
        break;
      }

      case "application/vnd.google-apps.document": {
        resultFile = await this.drive.files.export({
          fileId: file.id,
          mimeType: "text/plain",
        });
        break;
      }

      case "application/pdf": {
        resultFile = await this.drive.files.get(
          {
            fileId: file.id,
            alt: "media",
          },
          { responseType: "stream" }
        );
        break;
      }

      case "text/plain": {
        resultFile = await this.drive.files.export({
          fileId: file.id,
          mimeType: "text/plain",
        });
        break;
      }

      default: {
        break;
      }
    }

    return resultFile;
  }

  setOptions(): void {
    return;
  }
}
