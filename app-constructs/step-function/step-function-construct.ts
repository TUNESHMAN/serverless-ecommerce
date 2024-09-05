import * as stepfunction from "aws-cdk-lib/aws-stepfunctions";
import { Construct } from "constructs";

export interface StepFunctionConstructProps {
  stateMachineName: string;
}

export class StepFunctionConstruct extends Construct {
  public readonly stateMachine: stepfunction.StateMachine;
  public readonly stateMachineName: string;

  constructor(scope: Construct, id: string, props: StepFunctionConstructProps) {
    super(scope, id);

    this.stateMachineName = props.stateMachineName;
    this.stateMachine = new stepfunction.StateMachine(
      this,
      this.stateMachineName,
      {
        stateMachineName: this.stateMachineName,
      }
    );
  }
}
