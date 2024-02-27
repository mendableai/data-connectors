import { createDataConnector } from "../../../DataConnector";
import dotenv from "dotenv";
dotenv.config();

test(
  "Confluence Provider Testing",
  async () => {
    // const confluenceDataConnector = createDataConnector({
    //   provider: "confluence",
    // });

    // if (!process.env.NANGO_CONFLUENCE_CONNECTION_ID_TEST) {
    //   throw new Error(
    //     "Please specify the NANGO_CONFLUENCE_CONNECTION_ID_TEST environment variable."
    //   );
    // }

    // await confluenceDataConnector.authorizeNango({
    //   nango_connection_id: process.env.NANGO_CONFLUENCE_CONNECTION_ID_TEST,
    // });

    // const pages = await confluenceDataConnector.getDocuments();
    // expect(pages.length).toBeGreaterThan(0);
    // pages.forEach((issue) => {
    //   expect(issue.provider).toBe("confluence");
    //   expect(issue.type).toBe("page");
    //   expect(issue.content).not.toBe(null);
    //   expect(issue.createdAt).not.toBe(undefined);
    //   expect(issue.updatedAt).not.toBe(undefined);
    //   expect(issue.metadata.sourceURL).not.toBe(null);
    // });
  },
  10 * 1000
); // 10 seconds
