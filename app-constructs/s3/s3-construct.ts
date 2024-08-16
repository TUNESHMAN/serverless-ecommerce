import * as s3 from "aws-cdk-lib/aws-s3";
import { Construct } from "constructs";
import { RemovalPolicy } from "aws-cdk-lib";

export interface S3ConstructProps {
  bucketName: string;
  removalPolicy?: RemovalPolicy;
  autoDeleteObjects: boolean;
}

export class s3Construct extends Construct {
  public readonly s3Bucket: s3.Bucket;
  public readonly bucketName: string;

  constructor(scope: Construct, id: string, props: S3ConstructProps) {
    super(scope, id);

    this.bucketName = props.bucketName;
    this.s3Bucket = new s3.Bucket(this, this.bucketName, {
      bucketName: this.bucketName,
      removalPolicy: RemovalPolicy.DESTROY,
      autoDeleteObjects: props.autoDeleteObjects,
    });
    this.bucketName = props.bucketName;
  }
}
