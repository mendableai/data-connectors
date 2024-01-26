import { createDataConnector } from "../../../DataConnector";
import dotenv from "dotenv";
dotenv.config();


test('Google Drive Provider Testing', async () => {
  const googleDriveDataConnector = createDataConnector({
    provider: 'google-drive',
  });

  await googleDriveDataConnector.authorizeNango({
    nango_connection_id: process.env.NANGO_CONNECTION_ID_TEST,
  })

  const documents = await googleDriveDataConnector.getDocuments(); // { type: "accounts" }
  expect(documents.length).toBeGreaterThan(0);
  expect(documents[0].content).not.toBe(null);
  expect(documents[0].content.length).toBeGreaterThan(0);
  expect(documents[0].type).toBe('document');
  expect(documents[0].provider).toBe('google-drive');
  expect(documents[0].metadata).not.toBe(null);
  expect(documents[0].metadata.sourceURL).not.toBe(null);
  expect(documents[0].metadata.mimeType).not.toBe(null);
}, 30 * 1000); // 10 seconds