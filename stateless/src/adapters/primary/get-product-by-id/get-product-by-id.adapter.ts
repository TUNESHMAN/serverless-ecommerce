import { APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda";
import { Metrics, MetricUnit } from "@aws-lambda-powertools/metrics";
import { Tracer } from "@aws-lambda-powertools/tracer";
import { captureLambdaHandler } from "@aws-lambda-powertools/tracer/middleware";
import { logMetrics } from "@aws-lambda-powertools/metrics/middleware";
import { errorHandler } from "@shared";
import { injectLambdaContext } from "@aws-lambda-powertools/logger/middleware";
import { logger } from "@shared";
import middy from "@middy/core";
import { fetchProductById } from "@use-cases/fetch-product-by-id";
import { ValidationError } from "@errors";

const tracer = new Tracer();
const metrics = new Metrics();

// (primary adapter) --> use case --> secondary adapter(s)
export const getProductByIdHandler = async ({
  pathParameters,
}: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  try {
    if (!pathParameters || !pathParameters?.id)
      throw new ValidationError("no id in the path parameters of the event");

    const { id } = pathParameters;

    logger.info(`customer account id: ${id}`);

    const product = await fetchProductById(id);

    logger.info(`product: ${JSON.stringify(product)}`);

    metrics.addMetric("ProductByIdSuccessful", MetricUnit.Count, 1);

    if (!product) {
      return {
        statusCode: 404,
        body: JSON.stringify({
          message: "Product not found",
        }),
      };
    }

    return {
      statusCode: 200,
      body: JSON.stringify(product),
    };
  } catch (error) {
    metrics.addMetric("GetProducByIdFail", MetricUnit.Count, 1);
    logger.error(`Error getting product: ${error}`);
    return errorHandler(error);
  }
};

export const handler = middy(getProductByIdHandler)
  .use(injectLambdaContext(logger))
  .use(captureLambdaHandler(tracer))
  .use(logMetrics(metrics));
