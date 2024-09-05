import { DynamoDBClient, PutItemCommand } from "@aws-sdk/client-dynamodb";
import { logger } from "@shared";
const client = new DynamoDBClient({});
import { marshall, unmarshall } from "@aws-sdk/util-dynamodb";

export async function createItem(
  tableName: string,
  item: Record<string, any>
): Promise<void> {
  try {
    const putCommand = new PutItemCommand({
      TableName: tableName,
      Item: marshall(item, { removeUndefinedValues: true }),
    });

    await client.send(putCommand);
  } catch (error) {
    logger.error(`Error creating item: ${error}`);
    throw error;
  }
}

export function unmarshallItem<T extends Record<string, any>>(
  input: Record<string, any>
) {
  return unmarshall(input) as T;
}
