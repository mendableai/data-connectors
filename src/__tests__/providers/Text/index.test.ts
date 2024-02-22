import { createDataConnector } from "../../../DataConnector";

describe("Text Data Connector", () => {
  it("should return correct documents", async () => {
    const textDataConnector = createDataConnector({
      provider: "text",
    });

    await textDataConnector.setOptions({
      text: "Violets are blue",
    });

    const documents = await textDataConnector.getDocuments();
    expect(documents).not.toBe(null);
    expect(documents.length).toBeGreaterThan(0);
    expect(documents[0].content).not.toBe(null);
    expect(documents[0].content.length).toBeGreaterThan(0);
    expect(documents[0].content).toBe("Violets are blue");
    expect(documents[0].provider).toBe("text");
    expect(documents[0].metadata.sourceURL).not.toBe(null);
  });

  test("Text Get Documents", async () => {
    const textDataConnector = createDataConnector({
      provider: "text",
    });
  
    await textDataConnector.setOptions({
      text: "Violets are blue",
    });
  
    const documents = await textDataConnector.getDocuments();
    expect(documents).not.toBe(null);
    expect(documents.length).toBeGreaterThan(0);
    expect(documents[0].content).not.toBe(null);
    expect(documents[0].content.length).toBeGreaterThan(0);
    expect(documents[0].content).toBe("Violets are blue");
    expect(documents[0].provider).toBe("text");
    expect(documents[0].metadata.sourceURL).not.toBe(null);
  });

  it("should return correct documents for records", async () => {
    const textDataConnector = createDataConnector({
      provider: "text",
    });

    await textDataConnector.setOptions({
      records: [
        {
          content: "Violets are blue",
          source: "https://example.com",  
        },
        {
          content: "Violets are red",
          source: "https://example2.com",  
        },
        {
          content: "Violets are yellow",
          source: "https://example3.com",
          metadata: {
            title: 'Violets'
          }
        },
      ]
    });

    const documents = await textDataConnector.getDocuments();

    expect(documents).not.toBe(null);
    expect(documents.length).toBe(3);
    expect(documents[0].content).not.toBe(null);
    expect(documents[0].content.length).toBeGreaterThan(0);
    expect(documents[0].content).toBe("Violets are blue");
    expect(documents[0].provider).toBe("text");
    expect(documents[0].metadata.sourceURL).toBe("https://example.com");

    expect(documents[1].content).not.toBe(null);
    expect(documents[1].content.length).toBeGreaterThan(0);
    expect(documents[1].content).toBe("Violets are red");
    expect(documents[1].provider).toBe("text");
    expect(documents[1].metadata.sourceURL).toBe("https://example2.com");

    expect(documents[2].content).not.toBe(null);
    expect(documents[2].content.length).toBeGreaterThan(0);
    expect(documents[2].content).toBe("Violets are yellow");
    expect(documents[2].provider).toBe("text");
    expect(documents[2].metadata.sourceURL).toBe("https://example3.com");
    expect(documents[2].metadata.title).toBe("Violets");
  });

  test("Text Get Documents", async () => {
    const textDataConnector = createDataConnector({
      provider: "text",
    });
  
    await textDataConnector.setOptions({
      text: "Violets are blue",
    });
  
    const documents = await textDataConnector.getDocuments(); 
    expect(documents).not.toBe(null);
    expect(documents.length).toBeGreaterThan(0);
    expect(documents[0].content).not.toBe(null);
    expect(documents[0].content.length).toBeGreaterThan(0);
    expect(documents[0].content).toBe("Violets are blue");
    expect(documents[0].provider).toBe("text");
    expect(documents[0].metadata.sourceURL).not.toBe(null);
  });
})

//   // timeout of 3minutes
// }, 3 * 60 * 1000);
