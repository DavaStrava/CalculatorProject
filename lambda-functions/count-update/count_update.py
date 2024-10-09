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
    logger.info("UPDATE - Count Update function invoked.")
    
    try:
        # Extract expression and result from the event (sent from JavaScript)
        body = json.loads(event['body'])
        expression = body.get('expression')
        result = Decimal(str(body.get('result')))  # Convert to Decimal for DynamoDB

        # Create a unique ID for the calculation (e.g., 'expression')
        calculation_id = f'{expression}'

        # Try to get the existing calculation from DynamoDB
        response = table.get_item(Key={'calculation_id': calculation_id})
        
        if 'Item' in response:
            # If the calculation exists, increment the count
            logger.info(f"Calculation {calculation_id} found, updating count.")
            table.update_item(
                Key={'calculation_id': calculation_id},
                UpdateExpression="set #count = #count + :val, #timestamp = :time",
                ExpressionAttributeValues={
                    ':val': Decimal(1),
                    ':time': str(datetime.utcnow())
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
            'body': json.dumps({'message': 'Calculation recorded successfully'})
        }

    except Exception as e:
        logger.error(f"Error recording calculation: {str(e)}")
        return {
            'statusCode': 500,
            'body': json.dumps({'error': str(e)})
        }
