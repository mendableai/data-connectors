import { createDataConnector } from "../../../DataConnector";
import dotenv from "dotenv";
dotenv.config();

test(
  "Notion Provider Testing",
  async () => {
    const notionDataConnector = createDataConnector({
      provider: "notion",
    });

    if (!process.env.NANGO_CONNECTION_ID_TEST) {
      throw new Error(
        "Please specify the NANGO_CONNECTION_ID_TEST environment variable."
      );
    }

    await notionDataConnector.authorizeNango({
      nango_connection_id: process.env.NANGO_CONNECTION_ID_TEST,
    });

    const pages = await notionDataConnector.getDocuments();
    expect(pages.length).toBeGreaterThan(0);
    pages.forEach((page) => {
      expect(page.provider).toBe("notion");
      expect(page.type).toBe("page");
      expect(page.content).not.toBe(null);
      expect(page.createdAt).not.toBe(undefined);
      expect(page.updatedAt).not.toBe(undefined);
      expect(page.metadata.sourceURL).not.toBe(null);
    });
  },
  30 * 1000
); // 30 seconds
