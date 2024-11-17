import {
  APIGatewayTokenAuthorizerEvent,
  APIGatewayAuthorizerResult,
  Callback,
  PolicyDocument,
} from "aws-lambda";

export const authorizerAdapter = async (
  event: APIGatewayTokenAuthorizerEvent,
  callback: Callback
): Promise<any> => {
  const token = event.authorizationToken;
  if (!token) {
    callback("No authorization token provided");
    return {
      statusCode: 401,
      body: JSON.stringify({ message: "Unauthorized" }),
    };
  }
  if (token === "user-deny") {
    callback(null, generatePolicy(token, "Deny", event.methodArn));
    return {
      statusCode: 403,
      body: JSON.stringify({ message: "Forbidden" }),
    };
  }
  if (token === "user-allow") {
    callback(null, generatePolicy(token, "Allow", event.methodArn));
    return {
      statusCode: 200,
      body: JSON.stringify({ message: "Authorized" }),
    };
  }
};

// Helper function to generate IAM policies
const generatePolicy = (
  principalId: string,
  effect: "Allow" | "Deny", // Restrict to valid values
  resource: string
): APIGatewayAuthorizerResult => {
  const policyDocument: PolicyDocument = {
    Version: "2012-10-17",
    Statement: [
      {
        Action: "execute-api:Invoke",
        Effect: effect, // Now type-safe
        Resource: resource,
      },
    ],
  };

  const authResponse: APIGatewayAuthorizerResult = {
    principalId,
    policyDocument,
    context: {
      exampleKey: "exampleValue", // Add custom context if needed
    },
  };

  return authResponse;
};

