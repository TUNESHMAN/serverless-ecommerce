// import { CustomerAccountDto } from '@dto/customer-account';
import { logger } from '@shared';
import { fetchSingleProduct } from '@adapters/secondary/database-adapter';
import { config } from "@config";
// import { schema } from '@schemas/customer-account.schema';
// import { schemaValidator } from '@packages/schema-validator';

// primary adapter --> (use case) --> secondary adapter(s)

/**
 * Retrive a Product
 * Input: Product ID
 * Output: CustomerAccountDto
 *
 * Primary course:
 *
 *  1.Retrieve the customer account based on ID
 */
const tableName = config.get("eCommerceAppTable");
export async function fetchProductById(
  id: string
) {
  const product = await fetchSingleProduct(id,tableName);

  logger.info(`retrieved product for ${id}`);

//   schemaValidator(schema, product);
  logger.debug(`product  validated for ${product.id}`);

  return product;
}