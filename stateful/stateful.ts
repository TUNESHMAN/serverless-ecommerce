import * as cdk from "aws-cdk-lib";
import {
  s3Construct,
  DynamoDbConstruct,
  CognitoConstruct,
} from "../app-constructs";
import { Construct } from "constructs";
import * as dynamodb from "aws-cdk-lib/aws-dynamodb";
import * as cognito from "aws-cdk-lib/aws-cognito";

export interface CustomStackProps extends cdk.StackProps {
  stage: string;
  custName: string;
  appName: string;
  servName: string;
  retainResource: boolean;
  stackName: string;
  domain: {
    hostedZoneName: string;
    hostedZoneId: string;
    domainName: string;
    certId: string;
  };
}

export class EcommerceAppStatefulStack extends cdk.Stack {
  public readonly eCommerceTable: DynamoDbConstruct;
  public readonly eCommerceUserPool: CognitoConstruct;
  public readonly eCommerceUserPoolClient: cognito.UserPoolClient;
  public readonly productsMediaBucket: s3Construct;
  constructor(scope: Construct, id: string, props: CustomStackProps) {
    super(scope, id, props);

    // Create an S3 bucket
    this.productsMediaBucket = new s3Construct(this, "S3Construct", {
      bucketName: "ecommerce-products-media-bucket",
      autoDeleteObjects: true,
      removalPolicy: this.resourceRetained(props.retainResource),
    });

    // Create a DynamoDB table
    this.eCommerceTable = new DynamoDbConstruct(this, "ECommerceTable", {
      tableName: "eCommerceTable",
      partitionKey: { name: "id", type: dynamodb.AttributeType.STRING },
      removalPolicy: this.resourceRetained(props.retainResource),
    });
    // Create a cognito user pool
    this.eCommerceUserPool = new CognitoConstruct(this, "ECommerceUserPool", {
      userPoolName: "eCommerceUserPool",
      selfSignUpEnabled: true,
      autoVerify: {
        email: true,
      },
    });

    // Create a cognito user pool client
   this.eCommerceUserPoolClient =  new cognito.UserPoolClient(this, "ECommerceUserPoolClient", {
      userPool: this.eCommerceUserPool.userPool,
      authFlows: {
        userPassword: true,
      },
    });
  }

  resourceRetained(retainResource: boolean) {
    return retainResource
      ? cdk.RemovalPolicy.RETAIN
      : cdk.RemovalPolicy.DESTROY;
  }
}