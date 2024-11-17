import {
  CognitoIdentityProviderClient,
  ConfirmSignUpCommand,
} from "@aws-sdk/client-cognito-identity-provider";
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

const client = new CognitoIdentityProviderClient({});

export const confirmSignup = async (event: {
  body: string;
}): Promise<{ statusCode: number; body: string }> => {
  try {
    const { username, code } = JSON.parse(event.body) as {
      username?: string;
      code?: string;
    };

    if (username === undefined || code === undefined) {
      return Promise.resolve({
        statusCode: 400,
        body: "Missing username or confirmation code",
      });
    }

    const userPoolClientId = "jcl119vae8c7l80pkm6dqra82";

    await client.send(
      new ConfirmSignUpCommand({
        ClientId: userPoolClientId,
        Username: username,
        ConfirmationCode: code,
      })
    );
    logger.info(`User confirmed: ${username}`);
    return { statusCode: 200, body: "User confirmed" };
  } catch (error) {
    logger.info(`User unconfirmed: ${error}`);
    return errorHandler(error);
  }
};

export const handler = middy(confirmSignup)
  .use(injectLambdaContext(logger))
  .use(captureLambdaHandler(tracer))
  .use(logMetrics(metrics))
  .use(httpErrorHandler());
