import json

# USER
# Lambda called by API Gateway.
# Responsible for registering new users in VTEX and acquirers

def lambda_handler(event, context):
    # TO DO
    return {
        'statusCode': 200,
        # THIS HEADER PART is mandatory for CORS to work
        'headers': {
            'Access-Control-Allow-Headers': 'Content-Type',
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'OPTIONS,POST,GET'
        },
        'body': json.dumps('Hello from Lambda!')
    }


