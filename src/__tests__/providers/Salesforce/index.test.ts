import { createDataConnector } from "../../../DataConnector";
import dotenv from "dotenv";
dotenv.config();

test(
  "Salesforce Provider Testing",
  async () => {
    const salesforceDataConnector = createDataConnector({
      provider: "salesforce",
    });

    if (!process.env.NANGO_SALESFORCE_CONNECTION_ID_TEST) {
      throw new Error(
        "Please specify the NANGO_SALESFORCE_CONNECTION_ID_TEST environment variable."
      );
    }

    await salesforceDataConnector.authorizeNango({
      nango_connection_id: process.env.NANGO_SALESFORCE_CONNECTION_ID_TEST,
    });

    salesforceDataConnector.setOptions({ mode: "accounts" });

    const accounts = await salesforceDataConnector.getDocuments();
    expect(accounts.length).toBeGreaterThan(0);
    accounts.forEach((account) => {
      expect(account.provider).toBe("salesforce");
      expect(account.type).toBe("account");
      expect(account.content).not.toBe(null);
      expect(account.createdAt).not.toBe(undefined);
      expect(account.updatedAt).not.toBe(undefined);
      expect(account.metadata.sourceURL).not.toBe(null);
    });

    salesforceDataConnector.setOptions({ mode: "contacts" });

    const contacts = await salesforceDataConnector.getDocuments();
    expect(contacts.length).toBeGreaterThan(0);
    contacts.forEach((contact) => {
      expect(contact.provider).toBe("salesforce");
      expect(contact.type).toBe("contact");
      expect(contact.content).not.toBe(null);
      expect(contact.createdAt).not.toBe(undefined);
      expect(contact.updatedAt).not.toBe(undefined);
      expect(contact.metadata.sourceURL).not.toBe(null);
    });

    salesforceDataConnector.setOptions({ mode: "deals" });

    const deals = await salesforceDataConnector.getDocuments();
    expect(deals.length).toBeGreaterThan(0);
    deals.forEach((deal) => {
      expect(deal.provider).toBe("salesforce");
      expect(deal.type).toBe("deal");
      expect(deal.content).not.toBe(null);
      expect(deal.createdAt).not.toBe(undefined);
      expect(deal.updatedAt).not.toBe(undefined);
      expect(deal.metadata.sourceURL).not.toBe(null);
    });

    salesforceDataConnector.setOptions({ mode: "tickets" });

    const tickets = await salesforceDataConnector.getDocuments();
    expect(tickets.length).toBeGreaterThan(0);
    tickets.forEach((ticket) => {
      expect(ticket.provider).toBe("salesforce");
      expect(ticket.type).toBe("ticket");
      expect(ticket.content).not.toBe(null);
      expect(ticket.createdAt).not.toBe(undefined);
      expect(ticket.updatedAt).not.toBe(undefined);
      expect(ticket.metadata.sourceURL).not.toBe(null);
    });

    salesforceDataConnector.setOptions({ mode: "articles" });

    const articles = await salesforceDataConnector.getDocuments();
    expect(articles.length).toBeGreaterThan(0);
    articles.forEach((article) => {
      expect(article.provider).toBe("salesforce");
      expect(article.type).toBe("article");
      expect(article.content).not.toBe(null);
      expect(article.createdAt).not.toBe(undefined);
      expect(article.updatedAt).not.toBe(undefined);
      expect(article.metadata.sourceURL).not.toBe(null);
    });
  },
  15 * 1000
); // 15 seconds
