import { getSecret } from "@/utils/aws/secrets";
import { DatabaseClient } from "@/utils/db";
import type { CloudFormationCustomResourceEvent, Context } from "aws-lambda";

type ResourceProperties = {
  adminSecretArn: string;
  database: string;
}

export const handler = async (event: CloudFormationCustomResourceEvent<ResourceProperties>, ctx: Context) => {
  console.log("Event:", JSON.stringify(event));
  console.log("Context:", JSON.stringify(ctx));
  const { adminSecretArn, database } = event.ResourceProperties;
  const requestType = event.RequestType;

  const { username, password } = await getSecret(adminSecretArn);
  const client = await DatabaseClient.newClient(username, password);

  if (requestType === "Create") {
    try {
      console.log(`checking if "${database}" database exists...`);
      const exists = await client.checkDatabaseExists(database);
      if (!exists) {
        console.log(`creating "${database}" database`);
        await client.queryFmt(`CREATE DATABASE %I`, database);
        console.log(`database "${database}" created successfully.`);
      } else {
        console.log(`database "${database}" already exists`);
      }
    } catch (e: unknown) {
      console.error("error creating database:", e);
      throw e;
    }
  }
  await client.disconnect();

  return {
    PhysicalResourceId: database,
  };
};
