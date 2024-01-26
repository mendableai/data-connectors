import { createDataConnector } from "../../../DataConnector";

test("Text Get Documents", async () => {
  const textDataConnector = createDataConnector({
    provider: "text",
  });

  await textDataConnector.setOptions({
    text: "Violets are blue",
  });

  const documents = await textDataConnector.getDocuments(); // { type: "accounts" }
  expect(documents).not.toBe(null);
  expect(documents.length).toBeGreaterThan(0);
  expect(documents[0].content).not.toBe(null);
  expect(documents[0].content.length).toBeGreaterThan(0);
  expect(documents[0].content).toBe("Violets are blue");
  expect(documents[0].provider).toBe("text");
  expect(documents[0].metadata.sourceURL).not.toBe(null);
});

//   // timeout of 3minutes
// }, 3 * 60 * 1000);
