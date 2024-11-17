import {
  APIGatewayProxyResult,
  APIGatewayProxyEvent,
  Context,
} from "aws-lambda";
import { logger, errorHandler } from "@shared";
import { injectLambdaContext } from "@aws-lambda-powertools/logger/middleware";
import { Metrics, MetricUnit } from "@aws-lambda-powertools/metrics";
import { logMetrics } from "@aws-lambda-powertools/metrics/middleware";
import { Tracer } from "@aws-lambda-powertools/tracer";
import { captureLambdaHandler } from "@aws-lambda-powertools/tracer/middleware";
import middy from "@middy/core";
import httpErrorHandler from "@middy/http-error-handler";
import { fetchProducts } from "@use-cases/fetch-products";

const tracer = new Tracer();
const metrics = new Metrics();

export const getProductsHandler = async (
  event: APIGatewayProxyEvent,
  context: Context
): Promise<APIGatewayProxyResult> => {
  try {
    logger.info("Fetching all products");
    metrics.addMetric("GetProducts", MetricUnit.Count, 1);
    const products = await fetchProducts();
    if (!products || products.length === 0) {
      return {
        statusCode: 404,
        body: JSON.stringify({
          message: "No products found",
        }),
      };
    }
    return {
      statusCode: 200,
      body: JSON.stringify(products),
    };
  } catch (error) {
    metrics.addMetric("GetProductsFail", MetricUnit.Count, 1);
    logger.error(`Error getting products: ${error}`);
    return errorHandler(error);
  }
};

export const handler = middy(getProductsHandler)
  .use(injectLambdaContext(logger))
  .use(captureLambdaHandler(tracer))
  .use(logMetrics(metrics))
  .use(httpErrorHandler());
