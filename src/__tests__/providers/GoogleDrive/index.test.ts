import { createDataConnector } from "../../../DataConnector";
import dotenv from "dotenv";
dotenv.config();

test(
  "Google Drive Provider Testing",
  async () => {
    // const googleDriveDataConnector = createDataConnector({
    //   provider: "google-drive",
    // });

    // await googleDriveDataConnector.authorizeNango({
    //   nango_connection_id: process.env.NANGO_CONNECTION_ID_GOOGLE_DRIVE_TEST,
    // });

    // await googleDriveDataConnector.setOptions({
    //   filesIds:[]
    // })
    // const documents = await googleDriveDataConnector.getDocuments();
    // for (const doc of documents) {
    //   console.log({doc})
    // }
    
    // expect(documents.length).toBeGreaterThan(0);
    // expect(documents[0].content).not.toBe(null);
    // expect(documents[0].content.length).toBeGreaterThan(0);
    // expect(documents[0].type).toBe("document");
    // expect(documents[0].provider).toBe("google-drive");
    // expect(documents[0].metadata).not.toBe(null);
    // expect(documents[0].metadata.sourceURL).not.toBe(null);
    // expect(documents[0].metadata.mimeType).not.toBe(null);
    // expect(documents[0].metadata.title).not.toBe(null);

    // // // not reliable test:
    // // expect(documents[3].permissions).toEqual(expect.arrayContaining([
    // //   expect.objectContaining({
    // //     id: expect.any(String),
    // //     type: 'user',
    // //     role: 'owner',
    // //     allowFileDiscovery: false
    // //   })
    // // ]));

    // // expect(documents).toContainEqual({
    // //   content: expect.stringContaining(
    // //     "Jack plays soccer\r\nMaria plays volleybal\r\nThey play sports"
    // //   ),
    // //   metadata: {
    // //     sourceURL: expect.any(String),
    // //     mimeType: expect.any(String),
    // //     title: expect.any(String),
    // //   },
    // //   provider: "google-drive",
    // //   type: "document",
    // //   permissions: []
    // // });
  },
  30 * 1000
); // 20 seconds
