// noinspection JSUnusedGlobalSymbols

import { getSecret, type SecretValue } from "@/utils/aws/secrets";
import { DatabaseClient } from "@/utils/db";
import type { CloudFormationCustomResourceEvent, Context } from "aws-lambda";

type Role = "readonly" | "rw";
type ResourceProperties = {
  resourceId: string;
  role: Role;
  userSecretArn: string;
  adminSecretArn: string;
  database: string;
  schema: string;
}

export const handler = async (event: CloudFormationCustomResourceEvent<ResourceProperties>, ctx: Context) => {
  console.log("Event:", JSON.stringify(event));
  console.log("Context:", JSON.stringify(ctx));
  const { resourceId, userSecretArn, adminSecretArn, role, database, schema } = event.ResourceProperties;
  const requestType = event.RequestType;

  const admin = await getSecret(adminSecretArn);
  const client = await DatabaseClient.newClient(admin.username, admin.password);
  const user = await getSecret(userSecretArn);
  let error: Error | null = null;
  switch (requestType) {
    case "Create": {
      error = await createHandler(client, database, schema, user, role);
      break;
    }
    case "Update": {
      error = await updateHandler(client, database, schema, user, role);
      break;
    }
    case "Delete": {
      error = await deleteHandler(client, user);
      break;
    }
  }

  await client.disconnect();
  if (error) {
    throw error;
  }
  return {
    PhysicalResourceId: resourceId,
  };
};

const createHandler = async (
  client: DatabaseClient,
  database: string,
  schema: string,
  user: SecretValue,
  role: Role,
) => {
  try {
    const { username, password } = user;

    const userExists = await client.checkUserExists(username);
    if (!userExists) {
      console.log(`creating user "${username}"`);
      await client.queryFmt(`CREATE USER %I WITH PASSWORD %L`, username, password);
    }
    // intentional await to trigger error if needed
    return await updateHandler(client, database, schema, user, role);
  } catch (e: unknown) {
    console.error("create::error::", e);
    const err = e as Error;
    return new Error(`provisioning failed: ${err.message}`);
  }
};

const updateHandler = async (
  client: DatabaseClient,
  database: string,
  schema: string,
  user: SecretValue,
  role: Role,
) => {
  try {
    const { username, password } = user;
    await client.tx()
      .queryFmt(`ALTER ROLE %I WITH LOGIN PASSWORD %L`, username, password)
      .queryFmt(`GRANT CONNECT ON DATABASE %I TO %I`, database, username)
      .send();

    await client.setDatabase(database, true);
    await client.tx()
      .queryFmt(`CREATE SCHEMA IF NOT EXISTS %I`, schema)
      .queryFmt(`GRANT USAGE ON SCHEMA %I TO %I`, schema, username)
      .queryFmt(`ALTER ROLE %I SET search_path TO %I`, username, schema)
      .queryFmt(
        role === "rw"
          ? `GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA %I TO %I`
          : `GRANT SELECT ON ALL TABLES IN SCHEMA %I TO %I`,
        schema,
        username,
      )
      .send();

    return null;
  } catch (e: unknown) {
    console.error("update::error::", e);
    const err = e as Error;
    return new Error(`provisioning failed: ${err.message}`);
  }
};

const deleteHandler = async (client: DatabaseClient, user: SecretValue) => {
  try {
    const { username } = user;
    await client.queryFmt(`DROP USER IF EXISTS %I`, username);
    return null;
  } catch (e: unknown) {
    console.error("delete::error::", e);
    const err = e as Error;
    return new Error(`Deprovisioning failed: ${err.message}`);
  }
};
