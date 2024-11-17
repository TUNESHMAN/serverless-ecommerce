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



export const secret = async (): Promise<{
  statusCode: number;
  body: string;
}> => {
  return Promise.resolve({
    statusCode: 200,
    body: "CAUTION !!! THIS IS VERY SECRET",
  });
};

export const handler = middy(secret)
  .use(injectLambdaContext(logger))
  .use(captureLambdaHandler(tracer))
  .use(logMetrics(metrics))
  .use(httpErrorHandler());