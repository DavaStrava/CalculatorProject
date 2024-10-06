import boto3
import json
import logging
import math

# Set up logging
logger = logging.getLogger()
logger.setLevel(logging.INFO)

# Initialize the AWS Lambda client
lambda_client = boto3.client('lambda')

# Helper function to trigger the Count Update Lambda asynchronously
def trigger_count_update_lambda(num1, num2, operation):
    # Build the event payload with only num1 and operation if num2 is None
    event = {
        'num1': num1,
        'operation': operation
    }
    if num2 is not None:
        event['num2'] = num2

    try:
        # Invoke the count update Lambda function
        response = lambda_client.invoke(
            FunctionName='arn:aws:lambda:us-west-2:737630435491:function:count_update_calculator',
            InvocationType='Event',  # Asynchronous invocation
            Payload=json.dumps(event)
        )
        logger.info(f"Count update Lambda invoked. Response: {response}")
    except Exception as e:
        logger.error(f"Error invoking count_update Lambda: {str(e)}")

# Main calculate Lambda handler
def lambda_handler(event, context):
    logger.info("CALC - Calculate function invoked.")

    try:
        logger.info(f"Received event: {json.dumps(event)}")

        # Parse the event from API Gateway
        if 'body' in event:
            body = json.loads(event['body'])
        else:
            body = event

        num1 = float(body.get('num1'))
        num2 = float(body.get('num2')) if body.get('num2') is not None else None
        operation = body.get('operation')

        # Perform the calculation
        result = perform_calculation(operation, num1, num2)

        # Trigger count_update Lambda asynchronously
        trigger_count_update_lambda(num1, num2, operation)

        # Return a successful response with CORS headers
        return api_response(200, {'result': result})

    except Exception as e:
        logger.error(f"Unexpected error: {str(e)}")
        return api_response(500, {'error': 'An unexpected error occurred'})

# Helper function for performing calculations
def perform_calculation(operation, num1, num2):
    if operation == 'add':
        return num1 + num2
    elif operation == 'subtract':
        return num1 - num2
    elif operation == 'multiply':
        return num1 * num2
    elif operation == 'divide':
        if num2 == 0:
            raise ValueError('Division by zero is not allowed')
        return num1 / num2
    elif operation == 'sqrt':
        return math.sqrt(num1)
    elif operation == 'power':
        if num2 is None:
            raise ValueError('Power operation requires two operands')
        return math.pow(num1, num2)
    elif operation == 'sin':
        return math.sin(math.radians(num1))
    elif operation == 'cos':
        return math.cos(math.radians(num1))
    elif operation == 'tan':
        return math.tan(math.radians(num1))
    
    # Temperature conversions
    elif operation == 'celsius_to_fahrenheit':
        return (num1 * 9 / 5) + 32
    elif operation == 'fahrenheit_to_celsius':
        return (num1 - 32) * 5 / 9

    else:
        raise ValueError(f"Unknown operation: {operation}")

# Helper function for API response with CORS headers
def api_response(status_code, body):
    return {
        'statusCode': status_code,
        'body': json.dumps(body),
        'headers': {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': 'http://xaiproject.net',  # Add your domain here
            'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',    # Allowed methods
            'Access-Control-Allow-Headers': '*',                    # Allowed headers
            'Access-Control-Allow-Credentials': 'true'              # Credentials support
        },
    }
