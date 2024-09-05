#!/usr/bin/env node
import "source-map-support/register";
import * as cdk from "aws-cdk-lib";
import { ECommerceStack } from "../lib/e-commerce-stack";
import { EcommerceAppStatefulStack } from "../stateful/stateful";
import { EcommerceAppStatelessStack } from "../stateless/stateless";
import { setEnv } from "./env";

const dynamicEnv = setEnv(process.env.CDK_DEPLOY_STAGE);
const dynamicStageName = dynamicEnv.branchName;
const CUST_NAME = "l8on";
const APP_NAME = "hr";
const SERVICE_NAME = "autom8";

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
    s3Bucket: eCommerceAppStatefulStack.s3Bucket,
    domain: {
      hostedZoneName: dynamicEnv.hostedZoneName,
      hostedZoneId: dynamicEnv.hostedZoneId,
      domainName: dynamicEnv.domain,
      certId: dynamicEnv.certId,
    },
  }
);
