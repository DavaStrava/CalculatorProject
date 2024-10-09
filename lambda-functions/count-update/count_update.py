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
            body = json.loads(event['body'])
        else:
            body = event  # Use the direct event in case it's coming from a Lambda invocation

        # Extract data from the event (coming from the calculation function)
        expression = body.get('expression')
        result = body.get('result')

        if expression is None or result is None:
            raise ValueError("Missing 'expression' or 'result' in the request body.")

        # Create a unique ID for the calculation (e.g., '5add3', 'sqrt9')
        calculation_id = f'{expression}-{result}'

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
                    'expression': expression,
                    'result': str(result),
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
