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
import { createNewProductRecord } from '@use-cases/create-products';

const tracer = new Tracer();
const metrics = new Metrics();

export const createNewProduct = async (
  { body }: APIGatewayProxyEvent,
  context: Context
): Promise<APIGatewayProxyResult> => {
  try {
    if (!body) {
      throw new Error("Missing product data");
    }
    const newProduct = JSON.parse(body) as ProductRecord;
    schemaValidator(createProductSchema, newProduct);
    const createdProduct = await createNewProductRecord(newProduct);
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
