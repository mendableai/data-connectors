import { createDataConnector } from "../../../DataConnector";
import dotenv from "dotenv";
dotenv.config();

test(
  "OneDrive Provider Testing",
  async () => {
    const onedriveDataConnector = createDataConnector({
      provider: "one-drive",
    });

    if (!process.env.NANGO_ONEDRIVE_CONNECTION_ID_TEST) {
        throw new Error(
          "Please specify the NANGO_ONEDRIVE_CONNECTION_ID_TEST environment variable."
        );
      }

    await onedriveDataConnector.authorizeNango({
      nango_connection_id: process.env.NANGO_ONEDRIVE_CONNECTION_ID_TEST,
    });

    await onedriveDataConnector.setOptions({
      filesIds: []
    });

    const documents = await onedriveDataConnector.getDocuments();
    for (const doc of documents) {
      console.log({doc})
    }
    
    expect(documents.length).toBeGreaterThan(0);
    expect(documents[0].content).not.toBe(null);
    expect(documents[0].content.length).toBeGreaterThan(0);
    expect(documents[0].provider).toBe("one-drive");
    expect(documents[0].metadata).not.toBe(null);
    expect(documents[0].metadata.sourceURL).not.toBe(null);
  },
  60 * 1000
); // 60 seconds
