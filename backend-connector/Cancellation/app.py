import json

def lambda_handler(event, context):

    cancellationResponse={
        "message": "add here the cancellation response object!"
    }

    response =  {
        "statusCode": 200,
        "body": json.dumps(cancellationResponse),
    }

    return response


