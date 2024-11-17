import * as s3 from "aws-cdk-lib/aws-s3";
import { Construct } from "constructs";
import { RemovalPolicy } from "aws-cdk-lib";
import * as iam from "aws-cdk-lib/aws-iam";

export interface S3ConstructProps {
  bucketName: string;
  removalPolicy?: RemovalPolicy;
  autoDeleteObjects: boolean;
  versioned?: boolean;
  blockPublicAccess?: boolean;
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
      versioned: props.versioned || false,
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ACLS,
    });
  
    const s3Policy = new iam.PolicyStatement({
      actions: ["s3:PutObject", "s3:GetObject"],
      resources: [this.s3Bucket.bucketArn + "/*"], 
      principals: [new iam.AnyPrincipal()],
    });

    this.s3Bucket.addToResourcePolicy(s3Policy);
  }
}


