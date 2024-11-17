import {
  APIGatewayProxyEvent,
  APIGatewayProxyResult,
  Context,
} from "aws-lambda";
import { logger, schemaValidator, errorHandler } from "@shared";
import { captureLambdaHandler } from "@aws-lambda-powertools/tracer/middleware";
import { injectLambdaContext } from "@aws-lambda-powertools/logger/middleware";
import middy from "@middy/core";
import { logMetrics } from "@aws-lambda-powertools/metrics/middleware";
import httpErrorHandler from "@middy/http-error-handler";
import { Tracer } from "@aws-lambda-powertools/tracer";
import { Metrics, MetricUnit } from "@aws-lambda-powertools/metrics";
import { ProductRecord } from "@adapters/secondary/product-adapter";
import { createProductSchema } from "./create-product.schema";
import { createNewProductRecord } from "@use-cases/create-products";
import { v4 as uuidv4 } from "uuid";

const tracer = new Tracer();
const metrics = new Metrics();

export const createNewProduct = async (
  { body }: APIGatewayProxyEvent,
  context: Context
): Promise<APIGatewayProxyResult> => {
  const createdAt = new Date().toISOString();
  const updatedAt = createdAt;
  try {
    if (!body) {
      throw new Error("Missing product data");
    }
    const product = JSON.parse(body) as ProductRecord;
    product.id = uuidv4();
    product.createdAt = createdAt;
    product.updatedAt = updatedAt;
    schemaValidator(createProductSchema, product);

    logger.info("Creating new product", product);
    logger.info(`New Product: ${JSON.stringify(product)}`);
    const createdProduct = await createNewProductRecord(product);
    logger.info(`New Product: ${JSON.stringify(product)}`);
    metrics.addMetric("Product Creation Successful", MetricUnit.Count, 1);
    return {
      statusCode: 201,
      body: JSON.stringify({
        product: createdProduct,
        message: "Product created successfully",
      }),
    };
  } catch (error) {
    metrics.addMetric("ProductCreationError", MetricUnit.Count, 1);
    logger.error(`Error storing data: ${error}`);
    return errorHandler(error);
  }
};

export const handler = middy(createNewProduct)
  .use(injectLambdaContext(logger))
  .use(captureLambdaHandler(tracer))
  .use(logMetrics(metrics))
  .use(httpErrorHandler());
