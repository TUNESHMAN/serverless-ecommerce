import * as sns from 'aws-cdk-lib/aws-sns';
import { Construct } from 'constructs';
import { RemovalPolicy } from 'aws-cdk-lib';


export interface SnsConstructProps {
  topicName: string;
  removalPolicy: RemovalPolicy;
}

export class SnsConstruct extends Construct {
  public readonly snsTopic: sns.Topic;
  public readonly topicName: string;

  constructor(scope: Construct, id: string, props: SnsConstructProps) {
    super(scope, id);

    this.topicName = props.topicName;
    this.snsTopic = new sns.Topic(this, this.topicName, {
      topicName: this.topicName,
    });
  }
}
