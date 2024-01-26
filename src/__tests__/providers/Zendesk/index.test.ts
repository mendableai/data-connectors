import { DataConnector, createDataConnector } from "../../../DataConnector";

test('Zendesk Get Documents', async () => {

  const zendeskDataConnector = createDataConnector({
    provider: 'zendesk',
  });

  await zendeskDataConnector.setOptions({
    zendesk_brand_name:"tinder"
  })

  const documents = await zendeskDataConnector.getDocuments(); // { type: "accounts" }
  expect(documents).not.toBe(null);
  expect(documents.length).toBeGreaterThan(0);
  expect(documents[0].content).not.toBe(null);
  expect(documents[0].content.length).toBeGreaterThan(0);
  expect(documents[0].type).toBe('article');
  expect(documents[0].provider).toBe('zendesk');
  expect(documents[0].metadata).not.toBe(null);
  expect(documents[0].metadata.sourceURL).not.toBe(null);
  expect(documents[0].metadata.language).not.toBe(null);

  // timeout of 3minutes
}, 3 * 60 * 1000);