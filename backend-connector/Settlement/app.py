import json

def lambda_handler(event, context):

    settlementResponse={
        "message": "add here the settlement response object!"
    }

    response =  {
        "statusCode": 200,
        "body": json.dumps(settlementResponse),
    }

    return response


