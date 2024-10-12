import boto3
import json
import logging
from decimal import Decimal

# Set up logging
logger = logging.getLogger()
logger.setLevel(logging.INFO)

# Initialize DynamoDB resource
dynamodb = boto3.resource('dynamodb')
table = dynamodb.Table('CalculationTracker')

def lambda_handler(event, context):
    logger.info("UPDATE - Count Update function invoked.")

    try:
        # Parse the event (from API Gateway or direct invocation)
        if 'body' in event:
            logger.info("Event from API Gateway")
            body = json.loads(event['body'])
        else:
            logger.info("Direct Lambda invocation")
            body = event

        # Validate that the required keys are present
        if 'expression' not in body or 'result' not in body:
            raise ValueError("Missing expression or result in the request")

        expression = body['expression']
        result = Decimal(str(body['result']))

        # Create a unique ID for the calculation (e.g., '10+5')
        calculation_id = f"{expression}"

        # Try to get the existing calculation from DynamoDB
        response = table.get_item(Key={'calculation_id': calculation_id})
        
        if 'Item' in response:
            # If the calculation exists, increment the count
            logger.info(f"Calculation {calculation_id} found, updating count.")
            table.update_item(
                Key={'calculation_id': calculation_id},
                UpdateExpression="set #count = #count + :val, #timestamp = :time",
                ExpressionAttributeValues={
                    ':val': Decimal(1),  # Increment count
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
                    'result': result,
                    'timestamp': str(datetime.utcnow()),
                    'count': Decimal(1)
                }
            )

        return {
            'statusCode': 200,
            'body': json.dumps({'message': 'Count updated successfully'}),
            'headers': {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': 'http://xaiproject.net',
                'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
                'Access-Control-Allow-Headers': '*',
                'Access-Control-Allow-Credentials': 'true'
            }
        }

    except Exception as e:
        logger.error(f"Error recording calculation: {str(e)}")
        return {
            'statusCode': 500,
            'body': json.dumps({'error': str(e)}),
            'headers': {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': 'http://xaiproject.net',
                'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
                'Access-Control-Allow-Headers': '*',
                'Access-Control-Allow-Credentials': 'true'
            }
        }
