import { ProductRecord } from "@adapters/secondary/product-adapter";
import { logger } from "@shared";
import { createItem } from '@adapters/secondary/database-adapter';
import { config } from '@config';


const tableName = config.get('eCommerceAppTable');

export const createNewProductRecord = async (product: ProductRecord) => {
  logger.info(`Data stored: ${JSON.stringify(product)}`);
  await createItem(tableName, product);
};
