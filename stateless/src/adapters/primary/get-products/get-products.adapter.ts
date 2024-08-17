import { APIGatewayProxyResult } from "aws-lambda";
import { logger, errorHandler } from "@shared";
import { injectLambdaContext } from "@aws-lambda-powertools/logger/middleware";
import { Metrics, MetricUnit } from "@aws-lambda-powertools/metrics";
import { logMetrics } from "@aws-lambda-powertools/metrics/middleware";
import { Tracer } from "@aws-lambda-powertools/tracer";
import { captureLambdaHandler } from "@aws-lambda-powertools/tracer/middleware";
import middy from "@middy/core";
import httpErrorHandler from "@middy/http-error-handler";

const tracer = new Tracer();
const metrics = new Metrics();

export const getProductsHandler = async (): Promise<APIGatewayProxyResult> => {
  try {
    return {
      statusCode: 200,
      body: JSON.stringify({
        message: "Hello from getProductsHandler",
      }),
    };
  } catch (error) {
    metrics.addMetric("GetProducts", MetricUnit.Count, 1);
    logger.error(`Error getting products: ${error}`);
    return errorHandler(error);
  }
};

export const handler = middy(getProductsHandler)
  .use(injectLambdaContext(logger))
  .use(captureLambdaHandler(tracer))
  .use(logMetrics(metrics))
  .use(httpErrorHandler());
