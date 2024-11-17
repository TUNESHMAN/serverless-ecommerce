import { ProductRecord } from "@adapters/secondary/product-adapter";
import { fetchProductItem } from "@adapters/secondary/database-adapter";
import { config } from "@config";
import { unmarshall } from "@aws-sdk/util-dynamodb";
import { logger } from "@shared";

const tableName = config.get("eCommerceAppTable");

export const fetchProducts = async () => {
  const products = await fetchProductItem(tableName);
  logger.info(`Fetched ${products.length} items from table: ${tableName}`);
  logger.info(`Fetched HEREE ${products} items from table: ${tableName}`);
  //   schemaValidator(schema, product);
  return products;
};
