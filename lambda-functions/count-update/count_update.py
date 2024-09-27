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
        # Extract data from the event (coming from the calculation function)
        num1 = Decimal(str(event['num1']))  # Convert to Decimal
        num2 = Decimal(str(event['num2'])) if event['num2'] is not None else None  # Convert to Decimal if applicable
        operation = event['operation']

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
        logger.error(f"Error updating count: {str(e)}")
        return {
            'statusCode': 500,
            'body': json.dumps({'error': str(e)})
        }
