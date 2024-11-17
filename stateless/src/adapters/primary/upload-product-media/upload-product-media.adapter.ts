// import { APIGatewayProxyHandler, APIGatewayProxyEvent } from "aws-lambda";
// import * as AWS from "aws-sdk";
// import { config } from "@config";
// import { logger, errorHandler } from "@shared";
// import middy from "@middy/core";
// import httpErrorHandler from "@middy/http-error-handler";
// import { injectLambdaContext } from "@aws-lambda-powertools/logger/middleware";
// import { captureLambdaHandler } from "@aws-lambda-powertools/tracer/middleware";
// import { logMetrics } from "@aws-lambda-powertools/metrics/middleware";
// import { Tracer } from "@aws-lambda-powertools/tracer";
// import { Metrics, MetricUnit } from "@aws-lambda-powertools/metrics";

// const s3 = new AWS.S3();
// const bucketName = config.get("eCommerceAppBucket");
// const tracer = new Tracer();
// const metrics = new Metrics();

// export const generatePresignedUrl: APIGatewayProxyHandler = async (
//   event: APIGatewayProxyEvent
// ) => {
//   try {
//     const { id, fileName, fileType } = JSON.parse(event.body || "");

//     // Generate presigned URL
//     const s3Params = {
//       Bucket: bucketName,
//       Key: `products/${id}/${fileName}`,
//       Expires: 300,
//       ContentType: fileType,
//     };

//     const presignedUrl = await s3.getSignedUrlPromise("putObject", s3Params);

//     return {
//       statusCode: 200,
//       body: JSON.stringify({
//         presignedUrl,
//         filePath: `https://${bucketName}.s3.amazonaws.com/products/${id}/${fileName}`,
//       }),
//     };
//   } catch (error) {
//     metrics.addMetric("GeneratePreSignedUrlFail", MetricUnit.Count, 1);
//     return errorHandler(error);
//   }
// };

// export const handler = middy(generatePresignedUrl)
//   .use(injectLambdaContext(logger))
//   .use(captureLambdaHandler(tracer))
//   .use(logMetrics(metrics))
//   .use(httpErrorHandler());

// import { injectLambdaContext } from '@aws-lambda-powertools/logger/middleware';
// import { Metrics, MetricUnit } from '@aws-lambda-powertools/metrics';
// import { logMetrics } from '@aws-lambda-powertools/metrics/middleware';
// import { Tracer } from '@aws-lambda-powertools/tracer';
// import { captureLambdaHandler } from '@aws-lambda-powertools/tracer/middleware';
// import middy from '@middy/core';
// import { Handler } from 'aws-lambda';
// import { uploadProductImages } from '@use-cases/create-products/upload-product-image';
// import { logger } from '@shared';

// const tracer = new Tracer();
// const metrics = new Metrics();

// interface productImage {
//   name: string;
//   url: string;
//   id?: string;
// }

// const uploadProductImage: Handler<productImage, productImage> = async (
//   event: productImage,
// ): Promise<productImage> => {
//   if (!event.url || !event.name) {
//     throw new Error('Missing required fields: url and name');
//   }

//   try {
//     await uploadProductImages(event);

//     logger.debug(`Applicant Document: ${JSON.stringify(event)}`);

//     metrics.addMetric('BlobUrlHandlerSuccess', MetricUnit.Count, 1);

//     return event;
//   } catch (error) {
//     metrics.addMetric('BlobUrlHandlerError', MetricUnit.Count, 1);
//     logger.error(`Error handling blob: ${error}`);
//     throw error;
//   }
// };

// export const handler = middy(blobUrlHandler)
//   .use(injectLambdaContext(logger))
//   .use(captureLambdaHandler(tracer))
//   .use(logMetrics(metrics));

import { S3 } from "aws-sdk";
import { DynamoDB } from "aws-sdk";
import { APIGatewayProxyHandler } from "aws-lambda";

import { config } from "@config";
import { logger, errorHandler } from "@shared";
import middy from "@middy/core";
import httpErrorHandler from "@middy/http-error-handler";
import { injectLambdaContext } from "@aws-lambda-powertools/logger/middleware";
import { captureLambdaHandler } from "@aws-lambda-powertools/tracer/middleware";
import { logMetrics } from "@aws-lambda-powertools/metrics/middleware";
import { Tracer } from "@aws-lambda-powertools/tracer";
import { Metrics, MetricUnit } from "@aws-lambda-powertools/metrics";
import { uploadToS3 } from "@adapters/secondary/s3-adapter";

const s3 = new S3();
const dynamoDb = new DynamoDB.DocumentClient();

const tableName = process.env.E_COMMERCE_APP_TABLE!;

const bucketName = config.get("eCommerceAppBucket");
const tracer = new Tracer();
const metrics = new Metrics();

export const productMediaUpload: APIGatewayProxyHandler = async (event) => {
  try {
    const body = JSON.parse(event.body || "{}");
    const { productId, mediaType, fileName, fileContent } = body;

    if (!productId || !mediaType || !fileName || !fileContent) {
      return {
        statusCode: 400,
        body: JSON.stringify({ message: "Missing required fields" }),
      };
    }

    // Upload the media to S3
    const mediaUrl = await uploadToS3(
      productId,
      mediaType,
      fileName,
      fileContent
    );

    return {
      statusCode: 200,
      body: JSON.stringify({
        message: "Media uploaded successfully",
        mediaUrl,
      }),
    };
  } catch (error) {
    metrics.addMetric("S3 Media Upload Fail", MetricUnit.Count, 1);
    return errorHandler(error);
  }
};

export const handler = middy(productMediaUpload)
  .use(injectLambdaContext(logger))
  .use(captureLambdaHandler(tracer))
  .use(logMetrics(metrics))
  .use(httpErrorHandler());
