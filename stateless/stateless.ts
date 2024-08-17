import * as cdk from "aws-cdk-lib";
import * as iam from "aws-cdk-lib/aws-iam";
import * as lambda from "aws-cdk-lib/aws-lambda";
import * as stepfunction from "aws-cdk-lib/aws-stepfunctions";
import * as tasks from "aws-cdk-lib/aws-stepfunctions-tasks";
import * as path from "path";
import * as logs from "aws-cdk-lib/aws-logs";
import * as events from "aws-cdk-lib/aws-events";
import {
  s3Construct,
  DynamoDbConstruct,
  LambdaConstruct,
} from "../app-constructs";
import { Construct } from "constructs";
import { IConfigProps, NamingUtils } from "../utils/naming-utils";

export interface CustomStackProps extends cdk.StackProps {
  retainResource: boolean;
  custName: string;
  appName: string;
  servName: string;
  stackName: string;
  stage: string;
  table: DynamoDbConstruct;
  s3Bucket: s3Construct;
  domain: {
    hostedZoneName: string;
    hostedZoneId: string;
    domainName: string;
    certId: string;
  };
}

export class EcommerceAppStatelessStack extends cdk.Stack {
  private readonly eCommerceTable: DynamoDbConstruct;
  private readonly s3Bucket: s3Construct;
  constructor(scope: Construct, id: string, props: CustomStackProps) {
    super(scope, id, props);
    const { table, s3Bucket } = props;
    this.eCommerceTable = table;
    this.s3Bucket = s3Bucket;

    const lambdaPowerToolsConfig = {
      LOG_LEVEL: "DEBUG",
      POWERTOOLS_LOGGER_LOG_EVENT: props.stage !== "prod" ? "true" : "false",
      POWERTOOLS_LOGGER_SAMPLE_RATE: "1",
      POWERTOOLS_TRACE_ENABLED: "enabled",
      POWERTOOLS_TRACER_CAPTURE_HTTPS_REQUESTS: "captureHTTPsRequests",
      POWERTOOLS_SERVICE_NAME: `${props.servName}-${props.stage}`,
      POWERTOOLS_TRACER_CAPTURE_RESPONSE: "captureResult",
      POWERTOOLS_METRICS_NAMESPACE: `${props.servName}-${props.stage}`,
    };

    const config: IConfigProps = {
      customName: props.custName,
      appName: props.appName,
      stageName: props.stage,
      serviceName: props.servName,
      region: cdk.Stack.of(this).region,
      accountId: cdk.Stack.of(this).account,
    };

    const namingUtils = new NamingUtils(config);
    const getProductLambda = new LambdaConstruct(this, "GetProductLambda", {
      functionName: namingUtils.createResourceName("getProducts"),
      handler: 'handler',
      runtime: lambda.Runtime.NODEJS_20_X,
      codePath: path.join(
        __dirname,
        "../stateless/src/adapters/primary/get-products/get-products.adapter.ts"
      ),
      memorySize: 256,
      roleName: namingUtils.createResourceName("getProductsRole"),
      logRetention: logs.RetentionDays.ONE_DAY,
      removalPolicy: this.resourceRetained(props.retainResource),
      environment: {
        E_COMMERCE_APP_TABLE: this.eCommerceTable.table.tableName,
        ...lambdaPowerToolsConfig,
      },
    });

    this.eCommerceTable.table.grantReadData(getProductLambda.lambdaFunction);
  }

  resourceRetained(retainResource: boolean) {
    return retainResource
      ? cdk.RemovalPolicy.RETAIN
      : cdk.RemovalPolicy.DESTROY;
  }
}
