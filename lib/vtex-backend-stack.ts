import * as cdk from "aws-cdk-lib";
import * as sqs from "aws-cdk-lib/aws-sqs";
import * as DynamoDB from "aws-cdk-lib/aws-dynamodb";
import * as Lambda from "aws-cdk-lib/aws-lambda";
import * as APIGateway from "aws-cdk-lib/aws-apigateway";
import * as path from "path";
import { DynamoEventSource } from "aws-cdk-lib/aws-lambda-event-sources";
import { SqsEventSource } from "aws-cdk-lib/aws-lambda-event-sources";

export const configureBackend = (scope: any) => {
  const AdquirencyAPI = "testing-12345/v2"

  /////// DynamoDB

  //Create a DynamoDB table called PaymentTrackTable
  const PaymentTrackTable = new DynamoDB.Table(scope, "PaymentTrackTable", {
    partitionKey: {
      name: "paymentId",
      type: DynamoDB.AttributeType.STRING,
    },
    tableName: "PaymentTrackTable",
    billingMode: DynamoDB.BillingMode.PAY_PER_REQUEST,
    stream: DynamoDB.StreamViewType.NEW_IMAGE,
    removalPolicy: cdk.RemovalPolicy.DESTROY,
  });

  /////// QUEUE

  //create an SQS queue called PendingPaymentQueue
  const PendingPaymentQueue = new sqs.Queue(scope, "PendingPaymentQueue", {
    queueName: "PendingPaymentQueue",
    visibilityTimeout: cdk.Duration.seconds(30),
    receiveMessageWaitTime: cdk.Duration.seconds(10),
    retentionPeriod: cdk.Duration.days(1),
    encryption: sqs.QueueEncryption.SQS_MANAGED,
  });

  ///////  API GATEWAY

  //Create an API Gateway using Lambda Proxy
  const PaymentApi = new APIGateway.RestApi(scope, "PaymentApi", {
    restApiName: "PaymentApi",
    description: "PaymentApi",
    deployOptions: {
      stageName: "Prod",
    },
    defaultCorsPreflightOptions: {
      allowOrigins: APIGateway.Cors.ALL_ORIGINS,
      allowMethods: APIGateway.Cors.ALL_METHODS
    }
  });

  //// LAMBDAS

  //Create Payment Lambda function
  const Payment = new Lambda.Function(scope, "Payment", {
    runtime: Lambda.Runtime.PYTHON_3_9,
    code: Lambda.Code.fromAsset(
      path.join(__dirname, "../backend-connector/Payment"),
      {
        bundling: {
          image: Lambda.Runtime.PYTHON_3_9.bundlingImage,
          command: [
            "bash",
            "-c",
            "pip install -r requirements.txt -t /asset-output && cp -au . /asset-output",
          ],
        },
      }
    ),
    memorySize: 128,
    handler: "app.lambda_handler",
    environment: {
      TABLE_NAME: PaymentTrackTable.tableName,
      API_URL: `https://${AdquirencyAPI}/payment`,
    },
  });

  //Create UserPost Lambda function
  const UserApi = new Lambda.Function(scope, "User", {
    runtime: Lambda.Runtime.PYTHON_3_9,
    code: Lambda.Code.fromAsset(
      path.join(__dirname, "../backend-front/User"),
      {
        bundling: {
          image: Lambda.Runtime.PYTHON_3_9.bundlingImage,
          command: [
            "bash",
            "-c",
            "pip install -r requirements.txt -t /asset-output && cp -au . /asset-output",
          ],
        },
      }
    ),
    memorySize: 128,
    handler: "app.lambda_handler",
    environment: {
      TABLE_NAME: PaymentTrackTable.tableName
    },
  });

  //Create Manifest Lambda function
  const Manifest = new Lambda.Function(scope, "Manifest", {
    runtime: Lambda.Runtime.PYTHON_3_9,
    code: Lambda.Code.fromAsset(
      path.join(__dirname, "../backend-connector/Manifest"),
      {
        bundling: {
          image: Lambda.Runtime.PYTHON_3_9.bundlingImage,
          command: [
            "bash",
            "-c",
            "pip install -r requirements.txt -t /asset-output && cp -au . /asset-output",
          ],
        },
      }
    ),
    memorySize: 128,
    handler: "app.lambda_handler"
  });

  //Create Settlement Lambda function
  const Settlement = new Lambda.Function(scope, "Settlement", {
    runtime: Lambda.Runtime.PYTHON_3_9,
    code: Lambda.Code.fromAsset(
      path.join(__dirname, "../backend-connector/Settlement"),
      {
        bundling: {
          image: Lambda.Runtime.PYTHON_3_9.bundlingImage,
          command: [
            "bash",
            "-c",
            "pip install -r requirements.txt -t /asset-output && cp -au . /asset-output",
          ],
        },
      }
    ),
    memorySize: 128,
    handler: "app.lambda_handler"
  });

  //Create Refund Lambda function
  const Refund = new Lambda.Function(scope, "Refund", {
    runtime: Lambda.Runtime.PYTHON_3_9,
    code: Lambda.Code.fromAsset(
      path.join(__dirname, "../backend-connector/Refund"),
      {
        bundling: {
          image: Lambda.Runtime.PYTHON_3_9.bundlingImage,
          command: [
            "bash",
            "-c",
            "pip install -r requirements.txt -t /asset-output && cp -au . /asset-output",
          ],
        },
      }
    ),
    memorySize: 128,
    handler: "app.lambda_handler"
  });

  //Create Cancellation Lambda function
  const Cancellation = new Lambda.Function(scope, "Cancellation", {
    runtime: Lambda.Runtime.PYTHON_3_9,
    code: Lambda.Code.fromAsset(
      path.join(__dirname, "../backend-connector/Cancellation"),
      {
        bundling: {
          image: Lambda.Runtime.PYTHON_3_9.bundlingImage,
          command: [
            "bash",
            "-c",
            "pip install -r requirements.txt -t /asset-output && cp -au . /asset-output",
          ],
        },
      }
    ),
    memorySize: 128,
    handler: "app.lambda_handler"
  });

  //create api resource for Lambda Proxy
  const PaymentResource = PaymentApi.root.addResource("payments");
  const UserApiResource = PaymentApi.root.addResource("user");
  const ManifestResource = PaymentApi.root.addResource("manifest");
  const SettlementResource = PaymentApi.root.addResource("settlements");
  const CancellationResource = PaymentApi.root.addResource("cancellations");
  const RefundResource = PaymentApi.root.addResource("refunds");

  //create Lambda Proxy Integration
  const PaymentLambdaIntegration = new APIGateway.LambdaIntegration(
    Payment,
    {
      proxy: true,
    }
  );
  const ManifestLambdaIntegration = new APIGateway.LambdaIntegration(
    Manifest,
    {
      proxy: true,
    }
  );
  const UserApiLambdaIntegration = new APIGateway.LambdaIntegration(
    UserApi,
    {
      proxy: true,
    }
  );
  const SettlementLambdaIntegration = new APIGateway.LambdaIntegration(
    Settlement,
    {
      proxy: true,
    }
  );
  const CancellationLambdaIntegration = new APIGateway.LambdaIntegration(
    Cancellation,
    {
      proxy: true,
    }
  );
  const RefundLambdaIntegration = new APIGateway.LambdaIntegration(
    Refund,
    {
      proxy: true,
    }
  );

  //add Lambda Proxy Integration to apiResource
  PaymentResource.addMethod("POST", PaymentLambdaIntegration);
  ManifestResource.addMethod("GET", ManifestLambdaIntegration);
  UserApiResource.addMethod("POST", UserApiLambdaIntegration);
  SettlementResource.addMethod("POST", SettlementLambdaIntegration);
  CancellationResource.addMethod("POST", CancellationLambdaIntegration);
  RefundResource.addMethod("POST", RefundLambdaIntegration);

  //Create PendingPaymentStream Lambda function
  const PendingPaymentStream = new Lambda.Function(
    scope,
    "PendingPaymentStream",
    {
      runtime: Lambda.Runtime.PYTHON_3_9,
      code: Lambda.Code.fromAsset(
        path.join(__dirname, "../backend-connector/PendingPaymentStream"),
        {
          bundling: {
            image: Lambda.Runtime.PYTHON_3_9.bundlingImage,
            command: [
              "bash",
              "-c",
              "pip install -r requirements.txt -t /asset-output && cp -au . /asset-output",
            ],
          },
        }
      ),
      memorySize: 128,
      handler: "app.lambda_handler",
      environment: {
        TABLE_NAME: PaymentTrackTable.tableName,
        PENDING_PAYMENT_QUEUE: PendingPaymentQueue.queueName,
      },
    }
  );

  //Add DynamoDB Event Source for Stream with filter
  PendingPaymentStream.addEventSource(
    new DynamoEventSource(PaymentTrackTable, {
      startingPosition: Lambda.StartingPosition.TRIM_HORIZON,
      batchSize: 1,
      // onFailure: new SqsDlq(deadLetterQueue),
      retryAttempts: 10,
      filters: [
        Lambda.FilterCriteria.filter({
          eventName: Lambda.FilterRule.isEqual("INSERT"),
          dynamodb: {
            NewImage: {
              status: { S: Lambda.FilterRule.isEqual("undefined") },
            },
          },
        }),
        Lambda.FilterCriteria.filter({
          eventName: Lambda.FilterRule.isEqual("MODIFY"),
          dynamodb: {
            NewImage: {
              status: { S: Lambda.FilterRule.isEqual("undefined") },
            },
          },
        }),
      ],
    })
  );

  //Create ProcessPendingPayment Lambda function
  const ProcessPendingPayment = new Lambda.Function(
    scope,
    "ProcessPendingPayment",
    {
      runtime: Lambda.Runtime.PYTHON_3_9,
      code: Lambda.Code.fromAsset(
        path.join(__dirname, "../backend-connector/ProcessPendingPayment"),
        {
          bundling: {
            image: Lambda.Runtime.PYTHON_3_9.bundlingImage,
            command: [
              "bash",
              "-c",
              "pip install -r requirements.txt -t /asset-output && cp -au . /asset-output",
            ],
          },
        }
      ),
      memorySize: 128,
      handler: "app.lambda_handler",
      environment: {
        PENDING_PAYMENT_QUEUE: PendingPaymentQueue.queueName,
        API_URL: `https://${AdquirencyAPI}`,
      },
    }
  );

  ProcessPendingPayment.addEventSource(
    new SqsEventSource(PendingPaymentQueue, {
      batchSize: 1,
      enabled: true,
      reportBatchItemFailures: true,
      // retryAttempts: 10,
      // maxConcurrency: 2,
    })
  );

  /////// PERMISSIONS

  //Provide access to Lambdas on PaymentTrackTable
  PaymentTrackTable.grantReadWriteData(Payment);
  PaymentTrackTable.grantReadWriteData(PendingPaymentStream);
  PaymentTrackTable.grantReadWriteData(ProcessPendingPayment);
  PaymentTrackTable.grantStreamRead(PendingPaymentStream);

  //Provide access to PendingPaymentStream on
  PendingPaymentQueue.grantSendMessages(PendingPaymentStream);
  PendingPaymentQueue.grantConsumeMessages(ProcessPendingPayment);
};
