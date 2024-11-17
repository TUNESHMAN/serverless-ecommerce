import {
  DynamoDBClient,
  PutItemCommand,
  ScanCommand,
  GetItemCommand,
} from "@aws-sdk/client-dynamodb";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { logger } from "@shared";
const client = new DynamoDBClient({});
const s3Client = new S3Client();
import { marshall, unmarshall } from "@aws-sdk/util-dynamodb";
import { config } from "@config";

const region = "eu-west-2";

export async function createItem(
  tableName: string,
  item: Record<string, any>
): Promise<void> {
  try {
    // Marshall the item to DynamoDB format
    const marshalledItem = marshall(item, {
      removeUndefinedValues: true,
      convertClassInstanceToMap: true,
    });
    logger.info(`Creating item in table: ${marshalledItem}`);
    const putCommand = new PutItemCommand({
      TableName: tableName,
      Item: marshalledItem,
    });

    await client.send(putCommand);
  } catch (error) {
    logger.error(`Error creating item: ${error}`);
    throw error;
  }
}

export async function fetchProductItem(
  tableName: string
): Promise<Record<string, any>> {
  try {
    logger.info(`Fetching all items from table: ${tableName}`);

    const scanCommand = new ScanCommand({
      TableName: tableName,
    });

    const result = await client.send(scanCommand);
    if (!result.Items) {
      return [];
    }
    // Unmarshall the items from DynamoDB format to JavaScript objects
    const items = result.Items?.map((item) => unmarshall(item)) || [];
    logger.info(`Fetched ${items.length} items from table: ${tableName}`);
    return items;
  } catch (error) {
    logger.error(`Error fetching item: ${error}`);
    throw error;
  }
}

export async function fetchSingleProduct(id: string, tableName: string) {
  try {
    const getItemCommand = new GetItemCommand({
      TableName: tableName,
      Key: {
        id: { S: id }, // S denotes a string type in DynamoDB
      },
    });

    const { Item } = await client.send(getItemCommand);

    if (!Item) {
      throw new Error(`Product with ID ${id} not found`);
    }

    const product = unmarshall(Item);
    logger.info(`Product ${product.id} retrieved from ${tableName}`);

    return product;
  } catch (error) {
    logger.error(`Error fetching product: ${error}`);
    throw error;
  }
}

export async function uploadItemsToS3(
  bucketName: string,
  baseKey: string, // Base path or prefix in S3
  items: Array<{
    content: string | Buffer | Uint8Array;
    contentType: string;
    filename: string;
  }>
): Promise<string[]> {
  try {
    logger.info(`Uploading ${items.length} items to S3 bucket: ${bucketName}`);

    const uploadPromises = items.map(async (item) => {
      const key = `${baseKey}/${item.filename}`;
      logger.info(`Uploading item to S3 with key: ${key}`);

      const putCommand = new PutObjectCommand({
        Bucket: bucketName,
        Key: key,
        Body: item.content,
        ContentType: item.contentType,
      });

      await s3Client.send(putCommand);

      return `https://${bucketName}.s3.${region}.amazonaws.com/${key}`;
    });

    const uploadedUrls = await Promise.all(uploadPromises);
    logger.info(`Successfully uploaded ${uploadedUrls.length} items to S3.`);
    return uploadedUrls;
  } catch (error) {
    logger.error(`Error uploading items to S3: ${error}`);
    throw error;
  }
}

export function unmarshallItem<T extends Record<string, any>>(
  input: Record<string, any>
) {
  return unmarshall(input) as T;
}
