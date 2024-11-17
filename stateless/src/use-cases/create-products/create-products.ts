import { ProductRecord } from "@adapters/secondary/product-adapter";
import { createItem,uploadItemsToS3 } from "@adapters/secondary/database-adapter";
import { config } from "@config";
import { v4 as uuidv4 } from "uuid";
import { logger, schemaValidator, errorHandler, getISOString } from "@shared";
import { createProductSchema } from "../../../src/adapters/primary/create-products/create-product.schema";
const tableName = config.get("eCommerceAppTable");
const bucketName = config.get("eCommerceAppBucket");

export const createNewProductRecord = async (product: ProductRecord) => {
  schemaValidator(createProductSchema, product);
  logger.info(`Data stored: ${JSON.stringify(product)}`);
  // Store the product metadata in dynamoDB
  await createItem(tableName, product);
  // Store the product images and videos in S3
  await uploadItemsToS3(bucketName, product.id,product.imageUrls);
  await uploadItemsToS3(bucketName, product.id,product.videoUrls);
};
