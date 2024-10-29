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
    logger.info(f"Received event: {json.dumps(event)}")

    try:
        # Log the incoming event type and structure
        logger.info(f"Event type: {type(event)}")
        logger.info(f"Event keys: {event.keys() if isinstance(event, dict) else 'Not a dict'}")

        # Parse the event body
        if 'body' in event:
            logger.info(f"Raw body: {event['body']}")
            logger.info(f"Body type: {type(event['body'])}")
            try:
                body = json.loads(event['body'])
                logger.info(f"Parsed body: {body}")
            except json.JSONDecodeError as e:
                logger.error(f"JSON parsing error: {str(e)}")
                raise
        else:
            body = event
            logger.info("No body found in event, using event as body")

        # Extract and log the fields
        num1 = body.get('num1')
        num2 = body.get('num2')
        operation = body.get('operation')
        logger.info(f"Extracted values - num1: {num1}, num2: {num2}, operation: {operation}")

        # Create expression and result
        if operation in ['sqrt', 'sin', 'cos', 'tan', 'C to F', 'F to C']:
            expression = f"{operation}({num1})"
            result = num1
        else:
            expression = f"{num1} {operation} {num2 if num2 is not None else ''}"
            result = num1

        logger.info(f"Created expression: {expression}")
        logger.info(f"Result: {result}")

        # Create calculation ID
        calculation_id = f"{expression}"
        logger.info(f"Calculation ID: {calculation_id}")

        # Check for existing calculation
        response = table.get_item(Key={'calculation_id': calculation_id})
        logger.info(f"DynamoDB get_item response: {response}")

        if 'Item' in response:
            logger.info("Updating existing calculation")
            update_response = table.update_item(
                Key={'calculation_id': calculation_id},
                UpdateExpression="set #count = #count + :val, #timestamp = :time",
                ExpressionAttributeValues={
                    ':val': Decimal(1),
                    ':time': str(datetime.utcnow())
                },
                ExpressionAttributeNames={
                    '#count': 'count',
                    '#timestamp': 'timestamp'
                },
                ReturnValues="ALL_NEW"
            )
            logger.info(f"Update response: {update_response}")
        else:
            logger.info("Creating new calculation entry")
            put_response = table.put_item(
                Item={
                    'calculation_id': calculation_id,
                    'expression': expression,
                    'result': Decimal(str(result)),
                    'timestamp': str(datetime.utcnow()),
                    'count': Decimal(1)
                }
            )
            logger.info(f"Put response: {put_response}")

        return {
            'statusCode': 200,
            'body': json.dumps({'message': 'Count updated successfully'}),
            'headers': {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': 'http://xaiproject.net',
                'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token',
                'Access-Control-Allow-Credentials': 'true'
            }
        }

    except Exception as e:
        logger.error(f"Error recording calculation: {str(e)}")
        logger.error(f"Error type: {type(e)}")
        import traceback
        logger.error(f"Traceback: {traceback.format_exc()}")
        
        return {
            'statusCode': 500,
            'body': json.dumps({'error': str(e)}),
            'headers': {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': 'http://xaiproject.net',
                'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token',
                'Access-Control-Allow-Credentials': 'true'
            }
        }
