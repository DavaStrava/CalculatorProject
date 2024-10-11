import boto3
from datetime import datetime
import logging
import json
from decimal import Decimal

# Set up logging
logger = logging.getLogger()
logger.setLevel(logging.INFO)

# Initialize DynamoDB resource
dynamodb = boto3.resource('dynamodb')
table = dynamodb.Table('CalculationTracker')

def lambda_handler(event, context):
    # Log the unique identifier and invocation
    logger.info("UPDATE - Count Update function invoked.")
    
    try:
        # For API Gateway, the payload is usually inside 'body'
        if 'body' in event:
            body = event['body']
            if body is None:
                raise ValueError("No body found in the event.")
            body = json.loads(body)
        else:
            body = event  # Use the direct event in case it's coming from a Lambda invocation

        # Check if num1, num2, and operation exist in the payload
        if 'num1' not in body or 'operation' not in body:
            raise ValueError("Required fields (num1, operation) are missing.")
        
        num1 = Decimal(str(body['num1']))  # Convert to Decimal
        num2 = Decimal(str(body['num2'])) if 'num2' in body and body['num2'] is not None else None  # Convert to Decimal if applicable
        operation = body['operation']

        # Create a unique ID for the calculation (e.g., '5add3', 'sqrt9')
        calculation_id = f'{num1}{operation}{num2}' if num2 is not None else f'{operation}{num1}'

        # Try to get the existing calculation from DynamoDB
        response = table.get_item(Key={'calculation_id': calculation_id})
        
        if 'Item' in response:
            # If the calculation exists, increment the count
            logger.info(f"Calculation {calculation_id} found, updating count.")
            table.update_item(
                Key={'calculation_id': calculation_id},
                UpdateExpression="set #count = #count + :val, #timestamp = :time",
                ExpressionAttributeValues={
                    ':val': Decimal(1),  # Use Decimal for the count increment
                    ':time': str(datetime.utcnow())  # Keep timestamp as a string
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
                    'operation': operation,
                    'num1': num1,
                    'num2': num2,
                    'timestamp': str(datetime.utcnow()),
                    'count': Decimal(1)  # Use Decimal for the count
                }
            )

        return {
            'statusCode': 200,
            'body': json.dumps({'message': 'Count updated successfully'})
        }

    except Exception as e:
        logger.error(f"Error recording calculation: {str(e)}")
        return {
            'statusCode': 500,
            'body': json.dumps({'error': str(e)})
        }
def api_response(status_code, body):
    return {
        'statusCode': status_code,
        'body': json.dumps(body),
        'headers': {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': 'http://xaiproject.net',  # Allow requests from your domain
            'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',    # Allowed methods
            'Access-Control-Allow-Headers': '*',                    # Allowed headers
            'Access-Control-Allow-Credentials': 'true'              # Allow credentials if needed
        },
    }
