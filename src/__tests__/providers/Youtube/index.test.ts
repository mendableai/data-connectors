import { createDataConnector } from "../../../DataConnector";
import dotenv from "dotenv";
dotenv.config();


test('Youtube Provider Testing', async () => {
  const youtubeConnector = createDataConnector({
    provider: 'youtube',
  });

  await youtubeConnector.setOptions({
    mode:"video-urls",
    urls: ["https://www.youtube.com/watch?v=DagdM1jPlpo"]
  });


  await youtubeConnector.authorizeNango({
    nango_connection_id: process.env.NANGO_CONNECTION_ID_TEST ?? "",
  })

  const documents = await youtubeConnector.getDocuments(); 
  expect(documents.length).toBeGreaterThan(0);
  expect(documents[0].content).not.toBe(null);
  expect(documents[0].content.length).toBeGreaterThan(0);
  expect(documents[0].provider).toBe('youtube');
  expect(documents[0].metadata).not.toBe(null);
  expect(documents[0].metadata.sourceURL).not.toBe(null);
  expect(documents[0].metadata.sourceURL).toBeInstanceOf(String);
}, 30 * 1000); // 10 seconds