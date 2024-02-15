import { DataProvider } from "../DataProvider";
import { Document } from "../../entities/Document";
import { google, drive_v3 } from "googleapis";
import { Nango } from "@nangohq/node";
import dotenv from "dotenv";
import { Progress } from "../../entities/Progress";
dotenv.config();

export type GoogleDriveInputOptions = {
  filesIds?: string[];
};

export interface NangoAuthorizationOptions {
  nango_connection_id: string;
  nango_integration_id?: string;
}

export type GDriveAuthorizationOptions = {
  access_token: string;
}

export interface GoogleDriveOptions
  extends GoogleDriveInputOptions, GDriveAuthorizationOptions,
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
  private filesIds: string[] = [];

  constructor() {
    if (!process.env.NANGO_SECRET_KEY) {
      throw new Error("Nango secret key is required");
    }
    this.nango = new Nango({ secretKey: process.env.NANGO_SECRET_KEY });
  }

  async authorize({ access_token }: GDriveAuthorizationOptions): Promise<void> {
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

  async getDocuments(inProgress?: (progress: Progress) => void): Promise<Document[] | []> {
    let files = [];

    if (this.filesIds.length > 0) {
      const promises = this.filesIds.map(async (fileId) => {
        const request = await this.drive.files.get({
          fileId: fileId,
          fields: 'id, name, mimeType, webViewLink, permissions',
        });
        return request.data;
      });
      files = await Promise.all(promises);
    } else {
      const request = await this.drive.files.list({
        fields: 'files(id, name, mimeType, webViewLink, permissions)',
      });
      files = request.data.files;
    }

    const resultFiles: Document[] = [];
    for (let i = 0; i < files.length; i++) {
      if (inProgress) {
        inProgress({
          current: i + 1,
          total: files.length,
          status: "SCRAPING",
          currentDocumentUrl: files[i].webViewLink || "",
        });
      }

      let resultFile = null;

      if (files[i].mimeType === "application/vnd.google-apps.folder") {
        const folderId = files[i].id;
        const query = `'${folderId}' in parents and trashed=false`;
        const folderRequest = await this.drive.files.list({
          q: query,
          fields: "files(id, name, mimeType, webViewLink, permissions)",
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
                permissions: folderFile.permissions ? folderFile.permissions.map((permission) => {
                  return {
                    id: permission.id,
                    emailAddresses: permission.emailAddress,
                    type: permission.type as "user" | "group" | "domain" | "anyone",
                    role: permission.role as "owner" | "organizer" | "fileOrganizer" | "writer" | "commenter" | "reader",
                    allowFileDiscovery: permission.allowFileDiscovery,
                  };
                }): [],
                metadata: {
                  sourceURL: folderFile.webViewLink || "",
                  mimeType: folderFile.mimeType,
                },
              });
            }
          }
        }
      } else {
        resultFile = await this.parseFile(files[i]);
      }

      if (resultFile) {
        resultFiles.push({
          content: resultFile.data,
          type: "document",
          provider: "google-drive",
          permissions: files[i].permissions ? files[i].permissions.map((permission) => {
            return {
              id: permission.id,
              emailAddresses: permission.emailAddress,
              type: permission.type as "user" | "group" | "domain" | "anyone",
              role: permission.role as "owner" | "organizer" | "fileOrganizer" | "writer" | "commenter" | "reader",
              allowFileDiscovery: permission.allowFileDiscovery || false,
            };
          }): [],
          metadata: {
            sourceURL: files[i].webViewLink || "",
            mimeType: files[i].mimeType,
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

  setOptions(options: GoogleDriveInputOptions): void {
    if (options.filesIds) {
      this.filesIds = options.filesIds;
    }
  }
}
