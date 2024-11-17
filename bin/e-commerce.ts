#!/usr/bin/env node
import "source-map-support/register";
import * as cdk from "aws-cdk-lib";
import { ECommerceStack } from "../lib/e-commerce-stack";
import { EcommerceAppStatefulStack } from "../stateful/stateful";
import { EcommerceAppStatelessStack } from "../stateless/stateless";
import { setEnv } from "./env";

const dynamicEnv = setEnv(process.env.CDK_DEPLOY_STAGE);
const dynamicStageName = dynamicEnv.branchName;
const CUST_NAME = "babs";
const APP_NAME = "service";
const SERVICE_NAME = "ecommerce";

const app = new cdk.App();

const eCommerceAppStatefulStack = new EcommerceAppStatefulStack(
  app,
  "EcommerceStatefulStack",
  {
    stage: dynamicStageName,
    custName: CUST_NAME,
    appName: APP_NAME,
    servName: SERVICE_NAME,
    stackName: `${CUST_NAME}-${SERVICE_NAME}-${APP_NAME}-stateful-${dynamicStageName}`,
    retainResource: dynamicEnv.retainResource,
    domain: {
      hostedZoneName: dynamicEnv.hostedZoneName,
      hostedZoneId: dynamicEnv.hostedZoneId,
      domainName: dynamicEnv.domain,
      certId: dynamicEnv.certId,
    },
  }
);

new EcommerceAppStatelessStack(
  app,
  "EcommerceStatelessStack",
  {
    stage: dynamicStageName,
    custName: CUST_NAME,
    appName: APP_NAME,
    servName: SERVICE_NAME,
    stackName: `${CUST_NAME}-${SERVICE_NAME}-${APP_NAME}-stateless-${dynamicStageName}`,
    retainResource: dynamicEnv.retainResource,
    table: eCommerceAppStatefulStack.eCommerceTable,
    userPool: eCommerceAppStatefulStack.eCommerceUserPool,
    userPoolClient: eCommerceAppStatefulStack.eCommerceUserPoolClient,
    s3Bucket: eCommerceAppStatefulStack.productsMediaBucket,
    domain: {
      hostedZoneName: dynamicEnv.hostedZoneName,
      hostedZoneId: dynamicEnv.hostedZoneId,
      domainName: dynamicEnv.domain,
      certId: dynamicEnv.certId,
    },
  }
);
