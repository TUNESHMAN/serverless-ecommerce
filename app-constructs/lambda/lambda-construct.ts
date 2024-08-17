import { RemovalPolicy } from "aws-cdk-lib";
import * as iam from "aws-cdk-lib/aws-iam";
import * as lambda from "aws-cdk-lib/aws-lambda";
import * as path from "path";
import { Construct } from "constructs";
import * as cdk from "aws-cdk-lib";
import { NodejsFunction } from "aws-cdk-lib/aws-lambda-nodejs";
import * as logs from "aws-cdk-lib/aws-logs";

export interface LambdaConstructProps {
  functionName: string;
  handler: string;
  runtime: lambda.Runtime;
  codePath: string;
  environment?: { [key: string]: string };
  memorySize?: number;
  memory?: number;
  timeout?: number;
  roleName: string;
  logRetention: logs.RetentionDays;
  removalPolicy: RemovalPolicy;
  extraPolicies?: iam.PolicyStatement[];
}

export class LambdaConstruct extends Construct {
  public readonly lambdaFunction: NodejsFunction;
  public readonly lambdaFunctionName: string;

  constructor(scope: Construct, id: string, props: LambdaConstructProps) {
    super(scope, id);

    // Create an IAM role for Lambda execution
    const lambdaExecutionRole = new iam.Role(this, props.roleName, {
      assumedBy: new iam.ServicePrincipal("lambda.amazonaws.com"),
    });

    // Attach default policies to Lambda execution role
    lambdaExecutionRole.addManagedPolicy(
      iam.ManagedPolicy.fromAwsManagedPolicyName(
        "service-role/AWSLambdaBasicExecutionRole"
      )
    );

    // Attach extra IAM policies if provided
    if (props.extraPolicies) {
      props.extraPolicies.forEach((policy) => {
        lambdaExecutionRole.addToPolicy(policy);
      });
    }

    this.lambdaFunctionName = props.functionName;

    this.lambdaFunction = new NodejsFunction(this, props.functionName, {
      functionName: props.functionName,
      entry: path.resolve(props.codePath),
      handler: props.handler,
      runtime: props.runtime,
      environment: props.environment ? props.environment : {},
      timeout: props.timeout
        ? cdk.Duration.minutes(props.timeout)
        : cdk.Duration.minutes(1),
      memorySize: props.memorySize,
      role: lambdaExecutionRole,
      logRetention: props.logRetention,
      bundling: {
        externalModules: ["aws-sdk"],
        minify: true,
        target: "node20",
      },
    });
  }
}
