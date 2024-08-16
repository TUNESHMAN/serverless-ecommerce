import * as cognito from "aws-cdk-lib/aws-cognito";
import { Construct } from "constructs";
import { RemovalPolicy } from "aws-cdk-lib";

export interface CognitoConstructProps {
  userPoolName: "my-user-pool";
  selfSignUpEnabled: true;
  signInAliases: {
    email: true;
    username: true;
  };
  autoVerify: {
    email: true;
  };
  standardAttributes: {
    givenName: {
      required: true;
      mutable: true;
    };
    familyName: {
      required: true;
      mutable: true;
    };
  };

  passwordPolicy: {
    minLength: 8;
    requireLowercase: true;
    requireUppercase: true;
    requireDigits: true;
    requireSymbols: true;
  };
  accountRecovery: cognito.AccountRecovery.EMAIL_ONLY;
  removalPolicy: RemovalPolicy;
}

export class CognitoConstruct extends Construct {
  public readonly userPool: cognito.UserPool;
  public readonly userPoolName: string;

  constructor(scope: Construct, id: string, props: CognitoConstructProps) {
    super(scope, id);

    this.userPool = new cognito.UserPool(this, this.userPoolName, {
      userPoolName: props.userPoolName,
      removalPolicy: props.removalPolicy,
    });
  }
}
