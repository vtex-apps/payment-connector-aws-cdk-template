import json

def lambda_handler(event, context):

    manifest={
        "paymentMethods": [],
        "customFields":[]
    }

    response =  {
        "statusCode": 200,
        "body": json.dumps(manifest),
    }

    return response


