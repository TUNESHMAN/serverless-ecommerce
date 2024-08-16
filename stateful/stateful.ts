import * as cdk from "aws-cdk-lib";
import { s3Construct, DynamoDbConstruct } from "../app-constructs";
import { Construct } from "constructs";
import * as dynamodb from "aws-cdk-lib/aws-dynamodb";

export interface CustomStackProps extends cdk.StackProps {
  retainResource: boolean;
}

export class EcommerceAppStatefulStack extends cdk.Stack {
  public readonly eCommerceTable: DynamoDbConstruct;
  public readonly s3Bucket: s3Construct;
  constructor(scope: Construct, id: string, props: CustomStackProps) {
    super(scope, id, props);

    // Create an S3 bucket
    this.s3Bucket = new s3Construct(this, "S3Construct", {
      bucketName: "ecommerce-app-stateful",
      autoDeleteObjects: true,
      removalPolicy: this.resourceRetained(props.retainResource),
    });

    // Create a DynamoDB table
    this.eCommerceTable = new DynamoDbConstruct(this, "ECommerceTable", {
      tableName: "eCommerceTable",
      partitionKey: { name: "id", type: dynamodb.AttributeType.STRING },
      removalPolicy: this.resourceRetained(props.retainResource),
    });
  }

  resourceRetained(retainResource: boolean) {
    return retainResource
      ? cdk.RemovalPolicy.RETAIN
      : cdk.RemovalPolicy.DESTROY;
  }
}
