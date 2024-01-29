import { createDataConnector } from "../../../DataConnector";
import dotenv from "dotenv";
dotenv.config();


test('GitHub Provider Testing', async () => {
  const githubDataConnector = createDataConnector({
    provider: "github",
  });

  if (!process.env.NANGO_CONNECTION_ID_TEST) {
    throw new Error("Please specify the NANGO_CONNECTION_ID_TEST environment variable.");
  }

  await githubDataConnector.authorizeNango({
    nango_connection_id: process.env.NANGO_CONNECTION_ID_TEST,
  });

  // Test the format of returned documents
  await githubDataConnector.setOptions({
    owner: "mendableai",
    repo: "data-connectors",
  });

  const files = await githubDataConnector.getDocuments();
  expect(files.length).toBeGreaterThan(0);
  files.forEach(file => {
    expect(file.provider).toBe('github');
    expect(file.content).not.toBe(null);
    expect(file.metadata.sourceURL).not.toBe(null);
    expect(file.metadata.githubOwner).toBe("mendableai");
    expect(file.metadata.githubRepo).toBe("data-connectors");
    expect(file.metadata.filePath).not.toBe(null);
  });

  // Verify that docOnly: true only returns documents
  await githubDataConnector.setOptions({
    owner: "mendableai",
    repo: "data-connectors",
    docOnly: true,
  });

  const docs = await githubDataConnector.getDocuments();

  expect(docs.length).toBeGreaterThan(0);
  docs.forEach(doc => {
    expect(doc.type).toBe("document");
  });

  // Verify that path works
  await githubDataConnector.setOptions({
    owner: "mendableai",
    repo: "data-connectors",
    path: "src",
  });

  const code = await githubDataConnector.getDocuments();

  expect(code.length).toBeGreaterThan(0);
  code.forEach(file => {
    expect(file.metadata.filePath).toMatch(/^src\//);
  });
}, 15 * 1000); // 15 seconds
