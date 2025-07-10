import { GetSecretValueCommand, SecretsManagerClient } from "@aws-sdk/client-secrets-manager";

const sm = new SecretsManagerClient({});

export type SecretValue = {
  username: string;
  password: string;
}

export const getSecret = async (SecretId?: string): Promise<SecretValue> => {
  if (!SecretId) {
    throw new Error("Missing SecretId");
  }
  const command = new GetSecretValueCommand({ SecretId });
  const { SecretString } = await sm.send(command);
  if (!SecretString) {
    throw new Error(`Secret ${SecretId} not found`);
  }
  return JSON.parse(SecretString);
};
