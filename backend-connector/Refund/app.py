import json

def lambda_handler(event, context):

    refundResponse={
        "message": "add here the refund response object!"
    }

    response =  {
        "statusCode": 200,
        "body": json.dumps(refundResponse),
    }

    return response


