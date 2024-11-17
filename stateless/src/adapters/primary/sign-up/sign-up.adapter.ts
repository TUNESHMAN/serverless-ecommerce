import { CognitoIdentityProviderClient, SignUpCommand } from '@aws-sdk/client-cognito-identity-provider';
import { logger, errorHandler } from "@shared";
import { injectLambdaContext } from "@aws-lambda-powertools/logger/middleware";
import { Metrics, MetricUnit } from "@aws-lambda-powertools/metrics";
import { logMetrics } from "@aws-lambda-powertools/metrics/middleware";
import { Tracer } from "@aws-lambda-powertools/tracer";
import { captureLambdaHandler } from "@aws-lambda-powertools/tracer/middleware";
import middy from "@middy/core";
import httpErrorHandler from "@middy/http-error-handler";
import { config } from "@config";
const tracer = new Tracer();
const metrics = new Metrics();

const client = new CognitoIdentityProviderClient({});

const clientId = config.get("cognitoClientId");

export const signup = async (event: { body: string }): Promise<{ statusCode: number; body: string }> => {
  const { username, password, email } = JSON.parse(event.body) as {
    username?: string;
    password?: string;
    email?: string;
  };

  if (username === undefined || password === undefined || email === undefined) {
    return Promise.resolve({ statusCode: 400, body: 'Missing username, email or password' });
  }

  const userPoolClientId = "jcl119vae8c7l80pkm6dqra82";

  await client.send(
    new SignUpCommand({
      ClientId: userPoolClientId,
      Username: username,
      Password: password,
      UserAttributes: [
        {
          Name: 'email',
          Value: email,
        },
      ],
    }),
  );

  return { statusCode: 200, body: 'User created' };
};

export const handler = middy(signup)
  .use(injectLambdaContext(logger))
  .use(captureLambdaHandler(tracer))
  .use(logMetrics(metrics))
  .use(httpErrorHandler());