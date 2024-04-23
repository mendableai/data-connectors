import { DataProvider } from "../DataProvider";
import { Document } from "../../entities/Document";
import oneDriveAPI from "onedrive-api";
import { Nango } from "@nangohq/node";
import dotenv from "dotenv";
import { Progress } from "../../entities/Progress";
import fs from "fs";
dotenv.config();
import { Readable } from "stream";
import { processPdfStreamToText, processPdfToText } from "../File/pdfProcessor";

type DriveItem = Awaited<ReturnType<oneDriveAPI.ListChildrenFn>>["value"][number];

export type OneDriveInputOptions = object;

export interface NangoAuthorizationOptions {
  nango_connection_id: string;
  nango_integration_id?: string;
}

export type OneDriveAuthorizationOptions = {
  accessToken: string;
};

export interface OneDriveOptions
  extends OneDriveInputOptions,
    OneDriveAuthorizationOptions,
    NangoAuthorizationOptions {}

export class OneDriveDataProvider
  implements DataProvider<OneDriveOptions>
{
  private nango: Nango;
  private accessToken: string = "";

  constructor() {
    if (!process.env.NANGO_SECRET_KEY) {
      throw new Error("Nango secret key is required");
    }
    this.nango = new Nango({ secretKey: process.env.NANGO_SECRET_KEY });
  }

  async downloadFile(itemId: string, destPath: string): Promise<string> {
    const dest = fs.createWriteStream(destPath);
    const response = await oneDriveAPI.items.download({
      accessToken: this.accessToken,
      itemId,
    });

    return new Promise((resolve, reject) => {
      response
        .on("end", () => {
          resolve(destPath);
        })
        .on("error", (err) => {
          console.error("Error downloading file.", err);
          reject(err);
        })
        .pipe(dest);
    });
  }

  async extractTextFromPdf(buf: Buffer) {
    try {
      return await processPdfStreamToText(Readable.from(buf), "fakefile.pdf");
    } catch (error) {
      console.error("Error extracting text:", error);
      return "";
    }
  }

  async authorize({ accessToken }: OneDriveAuthorizationOptions): Promise<void> {
    if (!accessToken) {
      throw new Error("Google Drive access_token is required");
    }

    this.accessToken = accessToken;
  }

  async authorizeNango(
    authorizeOptions: NangoAuthorizationOptions
  ): Promise<void> {
    try {
      const connection = await this.nango.getConnection(
        authorizeOptions.nango_integration_id || "one-drive",
        authorizeOptions.nango_connection_id
      );

      await this.authorize({ accessToken: connection.credentials.raw.access_token });
    } catch (error) {
      throw new Error(error.message);
    }
  }

  async getDocuments(
    inProgress?: (progress: Progress) => void
  ): Promise<Document[] | []> {
    const files = [];
    let folders: DriveItem[] = [];

    const items = await this.parseItems((await oneDriveAPI.items.listChildren({
      accessToken: this.accessToken,
      itemId: "root",
    })).value);

    files.push(...items.files);
    folders.push(...items.folders);

    while (folders.length > 0) {
      const nextFolders = [];

      for (const folder of folders) {
        const items = await this.parseItems((await oneDriveAPI.items.listChildren({
          accessToken: this.accessToken,
          itemId: folder.id,
        })).value);

        files.push(...items.files);
        nextFolders.push(...items.folders);
      }

      folders = nextFolders;
    }
    
    return files;
  }

  downloadToBuffer(stream: NodeJS.ReadableStream): Promise<Buffer> {
    return new Promise((resolve, reject) => {
      const bufs = [];
      stream.on("error", err => reject(err));
      stream.on("data", d => bufs.push(d));
      stream.on("end", () => resolve(Buffer.concat(bufs)));
    });
  }

  async parseItems(
    items: DriveItem[],
  ): Promise<{
    files: Document[],
    folders: DriveItem[],
  }> {
    const files: Document[] = [];
    const folders: DriveItem[] = [];

    const types: { [ Mime: string ]: {
      type: string,
      convert: boolean,
      typeOut: "pdf" | "html" | "md" | "txt",
    } } = {
      "application/msword": {
        type: "document",
        convert: true,
        typeOut: "pdf",
      },
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document": {
        type: "document",
        convert: true,
        typeOut: "pdf",
      },
      "application/epub+zip": {
        type: "book",
        convert: true,
        typeOut: "pdf",
      },
      "text/html": {
        type: "webpage",
        convert: false,
        typeOut: "html",
      },
      "application/pdf": {
        type: "document",
        convert: false,
        typeOut: "pdf",
      },
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": {
        type: "spreadsheet",
        convert: true,
        typeOut: "pdf",
      },
      "application/vnd.ms-excel.sheet.macroEnabled.12": {
        type: "spreadsheet",
        convert: true,
        typeOut: "pdf",
      },
      "application/vnd.ms-excel": {
        type: "spreadsheet",
        convert: true,
        typeOut: "pdf",
      },
      "message/rfc822": {
        type: "email",
        convert: true,
        typeOut: "html",
      },
      "application/vnd.ms-outlook": {
        type: "email",
        convert: true,
        typeOut: "html",
      },
      "text/markdown": {
        type: "document",
        convert: false,
        typeOut: "md",
      },
      "application/vnd.oasis.opendocument.presentation": {
        type: "presentation",
        convert: true,
        typeOut: "pdf",
      },
      "application/vnd.oasis.opendocument.text": {
        type: "document",
        convert: true,
        typeOut: "pdf",
      },
      "application/vnd.oasis.opendocument.spreadsheet": {
        type: "spreadsheet",
        convert: true,
        typeOut: "pdf",
      },
      "application/vnd.ms-powerpoint": {
        type: "presentation",
        convert: true,
        typeOut: "pdf",
      },
      "application/vnd.openxmlformats-officedocument.presentationml.presentation": {
        type: "presentation",
        convert: true,
        typeOut: "pdf",
      },
      "application/vnd.openxmlformats-officedocument.presentationml.slideshow": {
        type: "presentation",
        convert: true,
        typeOut: "pdf",
      },
      "application/rtf": {
        type: "document",
        convert: true,
        typeOut: "pdf",
      },
      "text/plain": {
        type: "document",
        convert: false,
        typeOut: "txt",
      }
    };

    for (const item of items) {
      if (item.folder) {
        if (item.folder.childCount === null || item.folder.childCount === undefined || item.folder.childCount > 0) {
          folders.push(item);
        }
      } else if (item.file) {
        const action = types[item.file.mimeType];
        if (action) {
          const buf: Buffer = await this.downloadToBuffer(await oneDriveAPI.items.download({
            accessToken: this.accessToken,
            itemId: item.id,
            ...(action.convert ? ({
              format: action.typeOut as any,
            }) : {}),
          }));

          const content = action.typeOut === "pdf"
            ? await this.extractTextFromPdf(buf)
            : buf.toString("utf-8");
          
          files.push({
            id: item.id,
            content,
            type: action.type,
            createdAt: item.createdDateTime ? new Date(item.createdDateTime) : undefined,
            updatedAt: item.lastModifiedDateTime ? new Date(item.lastModifiedDateTime) : undefined,
            provider: "one-drive",
            metadata: {
              sourceURL: item.webUrl,
            },
          });
        }
      }
    }

    return {
      files,
      folders,
    };
  }

  setOptions(_: OneDriveInputOptions): void {}
}
