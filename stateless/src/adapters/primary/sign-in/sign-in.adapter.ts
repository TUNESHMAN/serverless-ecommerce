import { CognitoIdentityProviderClient, InitiateAuthCommand } from '@aws-sdk/client-cognito-identity-provider';
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

export const signin = async (event: { body: string }): Promise<{ statusCode: number; body: string }> => {
  const { username, password } = JSON.parse(event.body) as { username?: string; password?: string };

  if (username === undefined || password === undefined) {
    return Promise.resolve({ statusCode: 400, body: 'Missing username or password' });
  }

  const userPoolClientId = "jcl119vae8c7l80pkm6dqra82";

  const result = await client.send(
    new InitiateAuthCommand({
      AuthFlow: 'USER_PASSWORD_AUTH',
      ClientId: userPoolClientId,
      AuthParameters: {
        USERNAME: username,
        PASSWORD: password,
      },
    }),
  );

  const idToken = result.AuthenticationResult?.IdToken;

  if (idToken === undefined) {
    return Promise.resolve({ statusCode: 401, body: 'Authentication failed' });
  }

  return { statusCode: 200, body: idToken };
};

export const handler = middy(signin)
  .use(injectLambdaContext(logger))
  .use(captureLambdaHandler(tracer))
  .use(logMetrics(metrics))
  .use(httpErrorHandler());