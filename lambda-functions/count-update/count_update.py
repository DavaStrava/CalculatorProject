import json
import boto3
from decimal import Decimal, InvalidOperation
import logging
from datetime import datetime

# Set up logging
logger = logging.getLogger()
logger.setLevel(logging.INFO)

# Initialize DynamoDB resource
dynamodb = boto3.resource('dynamodb')
table = dynamodb.Table('CalculationTracker')

def lambda_handler(event, context):
    logger.info("UPDATE - Count Update function invoked.")

    try:
        # Check if 'body' is present (API Gateway typically sends it here)
        if 'body' in event:
            logger.info("Event from API Gateway")
            body = json.loads(event['body'])
        else:
            logger.info("Direct Lambda invocation or other source")
            body = event  # Direct Lambda invocation might just pass the event as body

        # Extract data from the body
        expression = body.get('expression')
        result = body.get('result')

        if not expression or result is None:
            raise ValueError("Missing expression or result in the request")

        # Validate if result can be converted to Decimal
        try:
            result = Decimal(str(result))
        except (InvalidOperation, ValueError) as e:
            raise ValueError(f"Invalid result value: {result}")

        # Create a unique ID for the calculation (use expression as key)
        calculation_id = expression

        # Try to get the existing calculation from DynamoDB
        response = table.get_item(Key={'calculation_id': calculation_id})
        
        if 'Item' in response:
            # If the calculation exists, increment the count
            logger.info(f"Calculation {calculation_id} found, updating count.")
            table.update_item(
                Key={'calculation_id': calculation_id},
                UpdateExpression="set #count = #count + :val, #timestamp = :time",
                ExpressionAttributeValues={
                    ':val': Decimal(1),  # Increment count by 1
                    ':time': str(datetime.utcnow())  # Timestamp
                },
                ExpressionAttributeNames={
                    '#count': 'count',
                    '#timestamp': 'timestamp'
                }
            )
        else:
            # If calculation does not exist, create a new entry
            logger.info(f"New calculation {calculation_id}, adding to table.")
            table.put_item(
                Item={
                    'calculation_id': calculation_id,
                    'result': result,
                    'timestamp': str(datetime.utcnow()),
                    'count': Decimal(1)  # Start count at 1
                }
            )

        return api_response(200, {'message': 'Count updated successfully'})

    except Exception as e:
        logger.error(f"Error recording calculation: {str(e)}")
        return api_response(500, {'error': str(e)})

# API response function with CORS headers
def api_response(status_code, body):
    return {
        'statusCode': status_code,
        'body': json.dumps(body),
        'headers': {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': 'http://xaiproject.net',  # Adjust to your domain
            'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
            'Access-Control-Allow-Headers': '*',
            'Access-Control-Allow-Credentials': 'true'
        }
    }
