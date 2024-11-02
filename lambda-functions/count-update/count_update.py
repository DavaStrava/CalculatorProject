import boto3
import json
import logging
from decimal import Decimal
from datetime import datetime 
import traceback

logger = logging.getLogger()
logger.setLevel(logging.INFO)

# Initialize DynamoDB
dynamodb = boto3.resource('dynamodb')
table = dynamodb.Table('CalculationTracker')

def validate_dynamodb_connection():
    """Validate DynamoDB connection and table exists"""
    try:
        table.table_status
        logger.info(f"Successfully connected to DynamoDB table: {table.table_name}")
        return True
    except Exception as e:
        logger.error(f"Error connecting to DynamoDB: {str(e)}")
        return False

def update_calculation_count(calculation_id, expression, result):
    """Update calculation count in DynamoDB with detailed logging"""
    try:
        # Log the attempt
        logger.info(f"Attempting to update calculation: {calculation_id}")
        
        # Check if calculation exists
        get_response = table.get_item(Key={'calculation_id': calculation_id})
        logger.info(f"Get item response: {json.dumps(get_response, default=str)}")
        
        if 'Item' in get_response:
            # Update existing calculation
            logger.info(f"Updating existing calculation: {calculation_id}")
            update_response = table.update_item(
                Key={'calculation_id': calculation_id},
                UpdateExpression="set #count = #count + :val, #timestamp = :time",
                ExpressionAttributeNames={
                    '#count': 'count',
                    '#timestamp': 'timestamp'
                },
                ExpressionAttributeValues={
                    ':val': Decimal('1'),
                    ':time': str(datetime.utcnow())
                },
                ReturnValues="ALL_NEW"
            )
            logger.info(f"Update response: {json.dumps(update_response, default=str)}")
        else:
            # Create new calculation entry
            logger.info(f"Creating new calculation entry: {calculation_id}")
            put_response = table.put_item(
                Item={
                    'calculation_id': calculation_id,
                    'expression': expression,
                    'result': Decimal(str(result)),
                    'timestamp': str(datetime.utcnow()),
                    'count': Decimal('1')
                }
            )
            logger.info(f"Put response: {json.dumps(put_response, default=str)}")
        
        return True
    except Exception as e:
        logger.error(f"Error updating DynamoDB: {str(e)}")
        logger.error(traceback.format_exc())
        raise

def lambda_handler(event, context):
    logger.info("Lambda function invoked")
    logger.info(f"Received event: {json.dumps(event, default=str)}")

    try:
        # Validate DynamoDB connection first
        if not validate_dynamodb_connection():
            raise Exception("Failed to connect to DynamoDB")

        # Parse the event body
        if isinstance(event.get('body'), str):
            body = json.loads(event['body'])
        else:
            body = event.get('body', {})
        
        logger.info(f"Parsed body: {json.dumps(body, default=str)}")

        # Validate required fields
        required_fields = ['num1', 'operation']
        if not all(field in body for field in required_fields):
            raise ValueError(f"Missing required fields. Required: {required_fields}, Received: {list(body.keys())}")

        # Extract values
        num1 = body['num1']
        num2 = body.get('num2')
        operation = body['operation']

        # Create expression
        if operation in ['sqrt', 'sin', 'cos', 'tan', 'C to F', 'F to C']:
            expression = f"{operation}({num1})"
        else:
            expression = f"{num1} {operation} {num2 if num2 is not None else ''}"

        calculation_id = expression
        
        # Update DynamoDB
        success = update_calculation_count(calculation_id, expression, num1)
        
        if not success:
            raise Exception("Failed to update DynamoDB")

        return {
            'statusCode': 200,
            'headers': {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': 'http://xaiproject.net',
                'Access-Control-Allow-Methods': 'OPTIONS,POST',
                'Access-Control-Allow-Headers': 'Content-Type'
            },
            'body': json.dumps({
                'message': 'Calculation recorded successfully',
                'calculationId': calculation_id
            })
        }

    except ValueError as e:
        logger.error(f"Validation error: {str(e)}")
        return {
            'statusCode': 400,
            'headers': {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': 'http://xaiproject.net',
                'Access-Control-Allow-Methods': 'OPTIONS,POST',
                'Access-Control-Allow-Headers': 'Content-Type'
            },
            'body': json.dumps({'error': str(e)})
        }
    except Exception as e:
        logger.error(f"Error: {str(e)}")
        logger.error(traceback.format_exc())
        return {
            'statusCode': 500,
            'headers': {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': 'http://xaiproject.net',
                'Access-Control-Allow-Methods': 'OPTIONS,POST',
                'Access-Control-Allow-Headers': 'Content-Type'
            },
            'body': json.dumps({'error': 'Internal server error'})
        }
