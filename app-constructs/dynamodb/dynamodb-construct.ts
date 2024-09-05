import * as dynamodb from "aws-cdk-lib/aws-dynamodb";
import { Construct } from "constructs";
import { RemovalPolicy } from "aws-cdk-lib";

export interface DynamoDbConstructProps {
  tableName: string;
  removalPolicy?: RemovalPolicy;
  partitionKey: { name: string; type: string };
}

export class DynamoDbConstruct extends Construct { 
  public readonly table: dynamodb.Table;
  public readonly tableName: string;

  constructor(scope: Construct, id: string, props: DynamoDbConstructProps) {
    super(scope, id);

    this.table = new dynamodb.Table(this, props.tableName, {
      tableName: props.tableName,
      partitionKey: {
        name: props.partitionKey.name,
        type: dynamodb.AttributeType.STRING,
      },
      removalPolicy: props.removalPolicy,
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
    });
    this.tableName = this.table.tableName;
  }
}
