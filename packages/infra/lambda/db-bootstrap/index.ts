import { SecretsManagerClient, GetSecretValueCommand } from "@aws-sdk/client-secrets-manager";
import { Client } from "pg";

export const handler = async () => {
  const secrets = new SecretsManagerClient({}) as any;

  const get = async (arn: string) => {
    const { SecretString } = await secrets.send(new GetSecretValueCommand({ SecretId: arn }));
    return JSON.parse(SecretString!);
  };

  const admin = await get(process.env.RDS_ADMIN_SECRET_ARN!);
  const newUser = await get(process.env.NEW_USER_SECRET_ARN!);

  const client = new Client({
    host: process.env.RDS_HOST,
    port: parseInt(process.env.RDS_PORT!),
    database: process.env.RDS_DB,
    user: admin.username,
    password: admin.password,
  });

  await client.connect();

  const userExists = await client.query(`SELECT 1 FROM pg_roles WHERE rolname = $1`, [ newUser.username ]);
  if (userExists.rowCount === 0) {
    await client.query(`CREATE USER "${newUser.username}" WITH PASSWORD $1`, [ newUser.password ]);
    await client.query(`GRANT CONNECT ON DATABASE ${process.env.RDS_DB} TO "${newUser.username}"`);
    await client.query(`GRANT USAGE ON SCHEMA public TO "${newUser.username}"`);
    await client.query(`GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO "${newUser.username}"`);
  }

  await client.end();
};
