import * as cognito from "aws-cdk-lib/aws-cognito";
import { Construct } from "constructs";
import { RemovalPolicy } from "aws-cdk-lib";

export interface CognitoConstructProps {
  userPoolName: string;
  selfSignUpEnabled: true;
  autoVerify: {
    email: true;
  };
}

export class CognitoConstruct extends Construct {
  public readonly userPool: cognito.UserPool;
  public readonly userPoolName: string;
  public readonly userPoolClientName: string;
  public readonly userPoolClient: cognito.UserPoolClient;

  constructor(scope: Construct, id: string, props: CognitoConstructProps) {
    super(scope, id);

    this.userPool = new cognito.UserPool(this, "UserPool", {
      selfSignUpEnabled: props.selfSignUpEnabled,
      autoVerify: {
        email: props.autoVerify.email,
      },
    });

    this.userPoolClient = new cognito.UserPoolClient(this, "UserPoolClient", {
      userPool: this.userPool,
      authFlows: {
        userPassword: true,
      },
    });
  }
}
