import * as cdk from "aws-cdk-lib";
import * as iam from "aws-cdk-lib/aws-iam";
import * as lambda from "aws-cdk-lib/aws-lambda";

import * as nodeLambda from "aws-cdk-lib/aws-lambda-nodejs";
import * as path from "path";
import * as tasks from "aws-cdk-lib/aws-stepfunctions-tasks";

import * as logs from "aws-cdk-lib/aws-logs";
import * as events from "aws-cdk-lib/aws-events";
import * as apigateway from "aws-cdk-lib/aws-apigateway";
import * as cognito from "aws-cdk-lib/aws-cognito";
import {
  s3Construct,
  DynamoDbConstruct,
  LambdaConstruct,
  ApiGatewayConstruct,
  CognitoConstruct,
} from "../app-constructs";
import { Construct } from "constructs";
import { IConfigProps, NamingUtils } from "../utils/naming-utils";
import { APIGateway } from "aws-sdk";
import { sign } from "crypto";

export interface CustomStackProps extends cdk.StackProps {
  retainResource: boolean;
  custName: string;
  appName: string;
  servName: string;
  stackName: string;
  stage: string;
  table: DynamoDbConstruct;
  userPool: CognitoConstruct;
  userPoolClient: cognito.UserPoolClient;
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
  private readonly productsMediaBucket: s3Construct;
  private readonly eCommerceUserPool: CognitoConstruct;
  private readonly eCommerceUserPoolClient: CognitoConstruct;
  constructor(scope: Construct, id: string, props: CustomStackProps) {
    super(scope, id, props);
    const { table, s3Bucket, userPool } = props;
    this.eCommerceTable = table;
    this.productsMediaBucket = s3Bucket;
    this.eCommerceUserPool = userPool;

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

    // Create a CloudWatch Log Group for API Gateway
    const productsLogGroup = new logs.LogGroup(this, "ApiGatewayAccessLogs", {
      logGroupName: "/aws/apigateway/productsApiLogs",
      retention: logs.RetentionDays.ONE_MONTH, // Set retention policy for 1 month
      removalPolicy: cdk.RemovalPolicy.DESTROY, // Change this based on your needs
    });

    const authenticationLogGroup = new logs.LogGroup(
      this,
      "EcommerceAuthentication",
      {
        logGroupName: "/aws/apigateway/authenticationApiLogs",
        retention: logs.RetentionDays.ONE_MONTH, // Set retention policy for 1 month
        removalPolicy: cdk.RemovalPolicy.DESTROY, // Change this based on your needs
      }
    );

    const productsApi = new apigateway.RestApi(this, "ProductsAPI", {
      description: "E-commerce Products API",
      restApiName: namingUtils.createResourceName("productsApi"),
      deployOptions: {
        stageName: "dev",
        loggingLevel: apigateway.MethodLoggingLevel.INFO,
        dataTraceEnabled: true,
        metricsEnabled: true,
        accessLogDestination: new apigateway.LogGroupLogDestination(
          productsLogGroup
        ),
        accessLogFormat: apigateway.AccessLogFormat.jsonWithStandardFields(),
      },
    });

    // Authentication API
    const authenticationApi = new apigateway.RestApi(
      this,
      "AuthenticationAPI",
      {
        description: "E-commerce Authentication API",
        restApiName: namingUtils.createResourceName("authenticationApi"),
        deployOptions: {
          stageName: "dev",
          loggingLevel: apigateway.MethodLoggingLevel.INFO,
          dataTraceEnabled: true,
          metricsEnabled: true,
          accessLogDestination: new apigateway.LogGroupLogDestination(
            authenticationLogGroup
          ),
          accessLogFormat: apigateway.AccessLogFormat.jsonWithStandardFields(),
        },
      }
    );

    // Userpool authorizer
    // Create an authorizer based on the user pool
    const userPoolAuthorizer =
      new cdk.aws_apigateway.CognitoUserPoolsAuthorizer(
        this,
        "ECommerceUserPoolAuthorizer",
        {
          cognitoUserPools: [userPool.userPool],
          identitySource: "method.request.header.Authorization",
        }
      );

    const signUpResource: apigateway.Resource =
      authenticationApi.root.addResource("auth-register");

    const signInResource: apigateway.Resource =
      authenticationApi.root.addResource("auth-login");

    const confirmUserResource: apigateway.Resource =
      authenticationApi.root.addResource("auth-confirm");

    // User signup
    const userRegistration = new LambdaConstruct(this, "register-user", {
      functionName: namingUtils.createResourceName("userRegistration"),
      handler: "handler",
      runtime: lambda.Runtime.NODEJS_20_X,
      codePath: path.join(
        __dirname,
        "../stateless/src/adapters/primary/sign-up/sign-up.adapter.ts"
      ),
      memorySize: 256,
      roleName: namingUtils.createResourceName("signup"),
      logRetention: logs.RetentionDays.ONE_DAY,
      removalPolicy: this.resourceRetained(props.retainResource),
      environment: {
        USER_POOL_CLIENT_ID: props.userPoolClient.userPoolClientId,
        ...lambdaPowerToolsConfig,
      },
    });

    // Give the lambda function the permission to sign up users
    userRegistration.lambdaFunction.addToRolePolicy(
      new iam.PolicyStatement({
        actions: ["cognito-idp:SignUp"],
        resources: ["*"],
      })
    );

    // Confirm signup
    const confirmSignup = new LambdaConstruct(this, "confirmSignup", {
      functionName: namingUtils.createResourceName("signUpConfirmation"),
      handler: "handler",
      runtime: lambda.Runtime.NODEJS_20_X,
      codePath: path.join(
        __dirname,
        "../stateless/src/adapters/primary/confirm-signup/confirm-signup.adapter.ts"
      ),
      memorySize: 256,
      roleName: namingUtils.createResourceName("confirmSignup"),
      logRetention: logs.RetentionDays.ONE_DAY,
      removalPolicy: this.resourceRetained(props.retainResource),
      environment: {
        USER_POOL_CLIENT_ID: props.userPoolClient.userPoolClientId,
        ...lambdaPowerToolsConfig,
      },
    });

    confirmSignup.lambdaFunction.addToRolePolicy(
      new iam.PolicyStatement({
        actions: ["cognito-idp:ConfirmSignUp"],
        resources: ["*"],
      })
    );

    // User Signin
    const userSignIn = new LambdaConstruct(this, "login-user", {
      functionName: namingUtils.createResourceName("userSignIn"),
      handler: "handler",
      runtime: lambda.Runtime.NODEJS_20_X,
      codePath: path.join(
        __dirname,
        "../stateless/src/adapters/primary/sign-in/sign-in.adapter.ts"
      ),
      memorySize: 256,
      roleName: namingUtils.createResourceName("signin"),
      logRetention: logs.RetentionDays.ONE_DAY,
      removalPolicy: this.resourceRetained(props.retainResource),
      environment: {
        USER_POOL_CLIENT_ID: props.userPoolClient.userPoolClientId,
        ...lambdaPowerToolsConfig,
      },
    });

    // Give the lambda function the permission to sign up users
    userSignIn.lambdaFunction.addToRolePolicy(
      new iam.PolicyStatement({
        actions: ["cognito-idp:InitiateAuth"],
        resources: ["*"],
      })
    );

    // Secret

    const secretLambda = new LambdaConstruct(this, "secret", {
      functionName: namingUtils.createResourceName("tokenSecret"),
      handler: "handler",
      runtime: lambda.Runtime.NODEJS_20_X,
      codePath: path.join(
        __dirname,
        "../stateless/src/adapters/primary/secret/secret.adapter.ts"
      ),
      memorySize: 256,
      roleName: namingUtils.createResourceName("secret"),
      logRetention: logs.RetentionDays.ONE_DAY,
      removalPolicy: this.resourceRetained(props.retainResource),
    });

    signInResource.addMethod(
      "POST",
      new apigateway.LambdaIntegration(userSignIn.lambdaFunction)
    );

    confirmUserResource.addMethod(
      "POST",
      new apigateway.LambdaIntegration(confirmSignup.lambdaFunction)
    );

    signUpResource.addMethod(
      "POST",
      new apigateway.LambdaIntegration(userRegistration.lambdaFunction)
    );

    authenticationApi.root.addResource("secret").addMethod(
      "GET",
      new apigateway.LambdaIntegration(secretLambda.lambdaFunction)
      // {
      //   authorizer: userPoolAuthorizer,
      //   authorizationType: apigateway.AuthorizationType.COGNITO,
      // }
    );

    const getProductLambda = new LambdaConstruct(this, "GetProductLambda", {
      functionName: namingUtils.createResourceName("getProducts"),
      handler: "handler",
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
        E_COMMERCE_APP_TABLE: this.eCommerceTable.tableName,
        E_COMMERCE_APP_BUCKET: this.productsMediaBucket.s3Bucket.bucketName,
        ...lambdaPowerToolsConfig,
      },
    });

    const getProductByIdLambda = new LambdaConstruct(
      this,
      "GetProductByIdLambda",
      {
        functionName: namingUtils.createResourceName("getProductsById"),
        handler: "handler",
        runtime: lambda.Runtime.NODEJS_20_X,
        codePath: path.join(
          __dirname,
          "../stateless/src/adapters/primary/get-product-by-id/get-product-by-id.adapter.ts"
        ),
        memorySize: 256,
        roleName: namingUtils.createResourceName("getProductByIdRole"),
        logRetention: logs.RetentionDays.ONE_DAY,
        removalPolicy: this.resourceRetained(props.retainResource),
        environment: {
          E_COMMERCE_APP_TABLE: this.eCommerceTable.tableName,
          ...lambdaPowerToolsConfig,
        },
      }
    );

    const authorizerLambda = new LambdaConstruct(this, "AuthorizerLambda", {
      functionName: namingUtils.createResourceName("authLambda"),
      handler: "handler",
      runtime: lambda.Runtime.NODEJS_20_X,
      codePath: path.join(
        __dirname,
        "../stateless/src/adapters/primary/authorizer/authorizer.adapter.ts"
      ),
      memorySize: 256,
      roleName: namingUtils.createResourceName("getProductByIdRole"),
      logRetention: logs.RetentionDays.ONE_DAY,
      removalPolicy: this.resourceRetained(props.retainResource),
    });

    // Create an API Gateway Authorizer
    // const authorizer = new apigateway.RequestAuthorizer(
    //   this,
    //   "ProductsApiAuthorizer",
    //   {
    //     handler: authorizerLambda.lambdaFunction,
    //     identitySources: [apigateway.IdentitySource.header("Authorization")],
    //     resultsCacheTtl: cdk.Duration.seconds(0), // Set to 0 to disable caching for development
    //   }
    // );

    const createProductLambda = new LambdaConstruct(
      this,
      "CreateProductLambda",
      {
        functionName: namingUtils.createResourceName("createProducts"),
        handler: "handler",
        runtime: lambda.Runtime.NODEJS_20_X,
        codePath: path.join(
          __dirname,
          "../stateless/src/adapters/primary/create-products/create-products.adapter.ts"
        ),
        memorySize: 256,
        roleName: namingUtils.createResourceName("createProductRole"),
        logRetention: logs.RetentionDays.ONE_DAY,
        removalPolicy: this.resourceRetained(props.retainResource),
        environment: {
          E_COMMERCE_APP_TABLE: this.eCommerceTable.tableName,
          E_COMMERCE_APP_BUCKET: this.productsMediaBucket.s3Bucket.bucketName,
          ...lambdaPowerToolsConfig,
        },
      }
    );
    this.eCommerceTable.table.grantReadData(getProductLambda.lambdaFunction);
    this.eCommerceTable.table.grantReadData(
      getProductByIdLambda.lambdaFunction
    );
    this.eCommerceTable.table.grantReadWriteData(
      createProductLambda.lambdaFunction
    );

    const apigwDynamoDBRole = new iam.Role(this, "apigwDynamoDBRole", {
      assumedBy: new iam.ServicePrincipal("apigateway.amazonaws.com"),
    });
    this.eCommerceTable.table.grantReadWriteData(apigwDynamoDBRole);
    this.eCommerceTable.table.grantReadData(apigwDynamoDBRole);
    this.productsMediaBucket.s3Bucket.grantReadWrite(apigwDynamoDBRole);

    const products: apigateway.Resource =
      productsApi.root.addResource("products");

    products.addMethod(
      "POST",
      new apigateway.LambdaIntegration(createProductLambda.lambdaFunction)
    );

    // GET /products
    products.addMethod(
      "GET",
      new apigateway.LambdaIntegration(getProductLambda.lambdaFunction),
      {
        authorizer: userPoolAuthorizer,
        authorizationType: apigateway.AuthorizationType.COGNITO,
      }
    );

    // Create a resource for fetching a product by its ID (e.g., /products/{id})
    const productById: apigateway.Resource = products.addResource("{id}");

    // Add a GET method to the productById resource
    productById.addMethod(
      "GET",
      new apigateway.LambdaIntegration(getProductByIdLambda.lambdaFunction)
    );
  }

  resourceRetained(retainResource: boolean) {
    return retainResource
      ? cdk.RemovalPolicy.RETAIN
      : cdk.RemovalPolicy.DESTROY;
  }
}
