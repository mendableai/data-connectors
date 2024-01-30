import { createDataConnector } from "../../../DataConnector";

describe('FileDataProvider', () => {
  it('should return correct documents', async () => {
    const fileDataConnector = createDataConnector({ provider: 'file' });

    await fileDataConnector.setOptions({
      files: [
        './src/__tests__/providers/File/files/test.csv',
        './src/__tests__/providers/File/files/test.md',
        './src/__tests__/providers/File/files/test.pdf',
        './src/__tests__/providers/File/files/test.txt',
        './src/__tests__/providers/File/files/test.xml'
      ],
    });

    const documents = await fileDataConnector.getDocuments();
    expect(documents).not.toBe(null);
    expect(documents.length).toBe(5);
    expect(documents[0].content).not.toBe(null);
    expect(documents[0].content.length).toBeGreaterThan(0);
    expect(documents).toEqual([
      {
        content: 'id, column1, column2, column3\n1, test, 11111, test test\n2, test2 test2, 22222, test\n3, test3, 33333, test test test',
        metadata: { sourceURL: expect.stringMatching(/^#FILE_\d+$/) },
        provider: 'file',
        type: 'csv'
      },
      {
        content: '# This is a test markdown file\n\nThis file is used for testing purposes. Below is a list of items:\n\n- Item 1\n- Item 2\n- Item 3\n\nEnd of file.\n',
        metadata: { sourceURL: expect.stringMatching(/^#FILE_\d+$/) },
        provider: 'file',
        type: 'md'
      },
      {
        content: '\n\nDummy PDF file',
        metadata: { sourceURL: expect.stringMatching(/^#FILE_\d+$/) },
        provider: 'file',
        type: 'pdf'
      },
      {
        content: 'This is a test file.\n',
        metadata: { sourceURL: expect.stringMatching(/^#FILE_\d+$/) },
        provider: 'file',
        type: 'txt'
      },
      {
        content: '<?xml version="1.0" encoding="UTF-8"?>\n<tests>\n  <test>\n    <id>1</id>\n    <column1>test</column1>\n    <column2>11111</column2>\n    <column3>test test</column3>\n  </test>\n  <test>\n    <id>2</id>\n    <column1>test2 test2</column1>\n    <column2>22222</column2>\n    <column3>test</column3>\n  </test>\n  <test>\n    <id>3</id>\n    <column1>test3</column1>\n    <column2>33333</column2>\n    <column3>test test test</column3>\n  </test>\n</tests>\n',
        metadata: { sourceURL: expect.stringMatching(/^#FILE_\d+$/) },
        provider: 'file',
        type: 'xml'
      }
    ]);
  });

  it('should fetch documents from URLs', async () => {
    const fileUrlDataConnector = createDataConnector({ provider: 'file' });

    const optionsURLs = {
      urls: [
        'https://s3.us-east-1.amazonaws.com/storage.mendable.ai/rafa-testing/test.csv',
        'https://s3.us-east-1.amazonaws.com/storage.mendable.ai/rafa-testing/test.md',
        'https://s3.us-east-1.amazonaws.com/storage.mendable.ai/rafa-testing/test%20%281%29.pdf',
        'https://s3.us-east-1.amazonaws.com/storage.mendable.ai/rafa-testing/test.txt',
        'https://s3.us-east-1.amazonaws.com/storage.mendable.ai/rafa-testing/test.xml'
      ]
    }

    await fileUrlDataConnector.setOptions(optionsURLs);
    const documentsByURL = await fileUrlDataConnector.getDocuments();

    expect(documentsByURL).not.toBe(null);
    // expect(documents.length).toBe(5);
    expect(documentsByURL[0].content).not.toBe(null);
    expect(documentsByURL[0].content.length).toBeGreaterThan(0);
    expect(documentsByURL[0].metadata.sourceURL).not.toBe(null);
    expect(documentsByURL[0].provider).toBe('file');
    expect(documentsByURL).toContainEqual({
      content: 'id, column1, column2, column3\n1, test, 11111, test test\n2, test2 test2, 22222, test\n3, test3, 33333, test test test\n',
      metadata: { sourceURL: optionsURLs.urls[0] },
      provider: 'file',
      type: 'csv'
    });
    expect(documentsByURL).toContainEqual({
      content: expect.stringContaining('# This is a test markdown file\n\nThis file is used for testing purposes. Below is a list of items:\n\n- Item 1\n- Item 2\n- Item 3\n\nEnd of file.\n'),
      metadata: { sourceURL: optionsURLs.urls[1] },
      provider: 'file',
      type: 'md'
    });
    expect(documentsByURL).toContainEqual({
      content: expect.stringContaining('Dummy PDF file'),
      metadata: { sourceURL: optionsURLs.urls[2] },
      provider: 'file',
      type: 'pdf'
    });
    expect(documentsByURL).toContainEqual({
      content: expect.stringContaining('This is a test file.'),
      metadata: { sourceURL: optionsURLs.urls[3] },
      provider: 'file',
      type: 'txt'
    });
    expect(documentsByURL).toContainEqual({
      content: expect.stringContaining('<?xml version="1.0" encoding="UTF-8"?>\n<tests>\n  <test>\n    <id>1</id>\n    <column1>test</column1>\n    <column2>11111</column2>\n    <column3>test test</column3>\n  </test>\n  <test>\n    <id>2</id>\n    <column1>test2 test2</column1>\n    <column2>22222</column2>\n    <column3>test</column3>\n  </test>\n  <test>\n    <id>3</id>\n    <column1>test3</column1>\n    <column2>33333</column2>\n    <column3>test test test</column3>\n  </test>\n</tests>'),
      metadata: { sourceURL: optionsURLs.urls[4] },
      provider: 'file',
      type: 'xml'
    });
  });
});
