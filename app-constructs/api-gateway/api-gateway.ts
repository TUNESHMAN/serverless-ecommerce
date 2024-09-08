import * as apigateway from "aws-cdk-lib/aws-apigateway";
import { NodejsFunction } from "aws-cdk-lib/aws-lambda-nodejs";
import { Construct } from "constructs";
import * as logs from "aws-cdk-lib/aws-logs";
import * as cdk from "aws-cdk-lib";
import * as iam from "aws-cdk-lib/aws-iam";
import * as route53 from "aws-cdk-lib/aws-route53";
import * as route53Target from "aws-cdk-lib/aws-route53-targets";

interface ApiGatewayRestApiConstructProps {
  apiName: string;
  lambdaFunction: NodejsFunction;
  authorizerConfig: {
    lambdaAuthorizer: NodejsFunction;
    authorizerName: string;
    identitySources: string[];
  };
  domain?: {
    domainName: string;
    certificateARN: string;
    hostedZoneId: string;
    hostedZoneName: string;
  };
  stageName: string;
  method: string;
  resourceName: string;
  logsConfig: {
    logGroupName: string;
    retentionDays: logs.RetentionDays;
    removalPolicy: cdk.RemovalPolicy;
  };
  credentials?: iam.IRole;
}

export class ApiGatewayConstruct extends Construct {
  public readonly restApi: apigateway.RestApi;
  public readonly restApiName: string;

  constructor(
    scope: Construct,
    id: string,
    props: ApiGatewayRestApiConstructProps
  ) {
    super(scope, id);
    this.restApiName = props.apiName;

    //  Create a cloudwatch log group
    const logGroup = new logs.LogGroup(this, props.logsConfig.logGroupName, {
      logGroupName: props.logsConfig.logGroupName,
      retention: props.logsConfig.retentionDays,
      removalPolicy: props.logsConfig.removalPolicy,
    });

    // Create an API Gateway
    this.restApi = new apigateway.RestApi(this, props.apiName, {
      // disableExecuteApiEndpoint: true,
      deployOptions: {
        stageName: props.stageName,
        loggingLevel: apigateway.MethodLoggingLevel.INFO,
        dataTraceEnabled: true,
        metricsEnabled: true,
        accessLogDestination: new apigateway.LogGroupLogDestination(logGroup),
        accessLogFormat: apigateway.AccessLogFormat.jsonWithStandardFields(),
      },
      // cloudWatchRole: false,
      // cloudWatchRoleRemovalPolicy: props.logsConfig.removalPolicy,
      deploy: true,
      endpointTypes: [apigateway.EndpointType.REGIONAL],
      failOnWarnings: true,
      defaultCorsPreflightOptions: {
        allowOrigins: apigateway.Cors.ALL_ORIGINS,
        allowMethods: apigateway.Cors.ALL_METHODS,
        allowCredentials: true,
      },
      defaultIntegration: new apigateway.LambdaIntegration(
        props.lambdaFunction,
        {
          proxy: true,
        }
      ),
    });

    // const authorizer = new apigateway.RequestAuthorizer(
    //   this,
    //   props.authorizerConfig.authorizerName,
    //   {
    //     handler: props.authorizerConfig.lambdaAuthorizer,
    //     identitySources: props.authorizerConfig.identitySources,
    //   }
    // );

    // Create a resource and method
    this.restApi.root.addResource(props.resourceName).addMethod(
      props.method,
      new apigateway.LambdaIntegration(props.lambdaFunction, {
        proxy: true,
        allowTestInvoke: true,
      }),
      {
        authorizationType: apigateway.AuthorizationType.CUSTOM,
        // authorizer,
      }
    );
    if (props.domain) {
      const hostedZone = route53.HostedZone.fromHostedZoneAttributes(
        this,
        "hostedZone",
        {
          hostedZoneId: props.domain.hostedZoneId,
          zoneName: props.domain.hostedZoneName,
        }
      );

      new route53.ARecord(this, "AliasRecord", {
        zone: hostedZone,
        recordName: props.domain.domainName,
        target: route53.RecordTarget.fromAlias(
          new route53Target.ApiGateway(this.restApi)
        ),
      });

      // Configure Gateway Response for errors
      this.restApi.addGatewayResponse("MissingAuthenticationToken", {
        type: apigateway.ResponseType.DEFAULT_4XX,
        statusCode: "403",
        responseHeaders: {
          "Access-Control-Allow-Origin": "'*'",
          "Access-Control-Allow-Credentials": "'true'",
        },
        templates: {
          "application/json": JSON.stringify({
            message: "Invalid Credentials",
          }),
        },
      });

      this.restApi.addGatewayResponse("InternalServerError", {
        type: apigateway.ResponseType.DEFAULT_5XX,
        statusCode: "500",
        responseHeaders: {
          "Access-Control-Allow-Origin": "'*'",
          "Access-Control-Allow-Credentials": "'true'",
        },
        templates: {
          "application/json": JSON.stringify({
            message: "Internal Server Error",
          }),
        },
      });
    }
  }
}
