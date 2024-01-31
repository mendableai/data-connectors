import { createDataConnector } from "../../../DataConnector";
import dotenv from "dotenv";
dotenv.config();

test(
  "Jira Provider Testing",
  async () => {
    const jiraDataConnector = createDataConnector({
      provider: "jira",
    });

    if (!process.env.NANGO_CONNECTION_ID_TEST) {
      throw new Error(
        "Please specify the NANGO_CONNECTION_ID_TEST environment variable."
      );
    }

    await jiraDataConnector.authorizeNango({
      nango_connection_id: process.env.NANGO_CONNECTION_ID_TEST,
    });

    const issues = await jiraDataConnector.getDocuments();
    expect(issues.length).toBeGreaterThan(0);
    issues.forEach((issue) => {
      expect(issue.provider).toBe("jira");
      expect(issue.type).toBe("issue");
      expect(issue.content).not.toBe(null);
      expect(issue.createdAt).not.toBe(undefined);
      expect(issue.updatedAt).not.toBe(undefined);
      expect(issue.metadata.sourceURL).not.toBe(null);
      expect(issue.metadata.type).not.toBe(undefined);
      expect(issue.metadata.status).not.toBe(undefined);
      expect(issue.metadata.project).not.toBe(undefined);
    });
  },
  10 * 1000
); // 10 seconds
