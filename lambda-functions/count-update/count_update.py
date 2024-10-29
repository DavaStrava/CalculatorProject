import boto3
import json
import logging
from decimal import Decimal
from datetime import datetime 

logger = logging.getLogger()
logger.setLevel(logging.INFO)

dynamodb = boto3.resource('dynamodb')
table = dynamodb.Table('CalculationTracker')

def lambda_handler(event, context):
    logger.info("UPDATE - Count Update function invoked.")

    try:
        # Parse the event body
        if 'body' in event:
            body = json.loads(event['body'])
        else:
            body = event

        # Extract the new format fields
        num1 = body.get('num1')
        num2 = body.get('num2')
        operation = body.get('operation')

        # Create expression and result based on the operation type
        if operation in ['sqrt', 'sin', 'cos', 'tan', 'C to F', 'F to C']:
            expression = f"{operation}({num1})"
            result = num1  # Store the input number as result
        else:
            expression = f"{num1} {operation} {num2 if num2 is not None else ''}"
            result = num1  # Store first number as result if no calculation needed

        # Create a unique ID for the calculation
        calculation_id = f"{expression}"

        # Try to get the existing calculation from DynamoDB
        response = table.get_item(Key={'calculation_id': calculation_id})
        
        if 'Item' in response:
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
            table.put_item(
                Item={
                    'calculation_id': calculation_id,
                    'expression': expression,
                    'result': Decimal(str(result)),
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
                'Access-Control-Allow-Headers': 'Content-Type',
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
                'Access-Control-Allow-Headers': 'Content-Type',
                'Access-Control-Allow-Credentials': 'true'
            }
        }
