import boto3
import json
import logging
from decimal import Decimal
from datetime import datetime 
import traceback

logger = logging.getLogger()
logger.setLevel(logging.INFO)

dynamodb = boto3.resource('dynamodb')
table = dynamodb.Table('CalculationTracker')

def parse_event_body(event):
    """Parse and validate the event body with detailed logging"""
    logger.info(f"Parsing event: {json.dumps(event, default=str)}")
    logger.info(f"Event type: {type(event)}")
    
    # If event is a string, try to parse it as JSON
    if isinstance(event, str):
        logger.info("Event is string, attempting to parse as JSON")
        try:
            return json.loads(event)
        except json.JSONDecodeError as e:
            logger.error(f"Failed to parse string event as JSON: {e}")
            raise ValueError(f"Invalid JSON in event string: {e}")

    # If event is a dict, look for the body
    if isinstance(event, dict):
        logger.info(f"Event keys: {list(event.keys())}")
        
        # Check for body in event
        if 'body' not in event:
            logger.info("No 'body' in event, treating event as the body")
            return event
            
        body = event['body']
        logger.info(f"Body type: {type(body)}")
        logger.info(f"Raw body: {body}")
        
        # Handle different body types
        if body is None:
            logger.info("Body is None, checking for queryStringParameters")
            # Check if data might be in query parameters
            if 'queryStringParameters' in event and event['queryStringParameters']:
                logger.info(f"Found queryStringParameters: {event['queryStringParameters']}")
                return event['queryStringParameters']
            # Check if data might be in path parameters
            elif 'pathParameters' in event and event['pathParameters']:
                logger.info(f"Found pathParameters: {event['pathParameters']}")
                return event['pathParameters']
            else:
                raise ValueError("No valid data found in event")
                
        # If body is a string, try to parse it as JSON
        if isinstance(body, str):
            try:
                parsed_body = json.loads(body)
                logger.info(f"Parsed body: {parsed_body}")
                return parsed_body
            except json.JSONDecodeError as e:
                logger.error(f"Failed to parse body as JSON: {e}")
                raise ValueError(f"Invalid JSON in body: {e}")
                
        # If body is already a dict, return it
        if isinstance(body, dict):
            return body
            
        raise ValueError(f"Unexpected body type: {type(body)}")
        
    raise ValueError(f"Unexpected event type: {type(event)}")

def lambda_handler(event, context):
    logger.info("UPDATE - Count Update function invoked.")
    logger.info(f"Raw event received: {json.dumps(event, default=str)}")

    try:
        # Parse the event body with enhanced error handling
        try:
            body = parse_event_body(event)
        except Exception as e:
            logger.error(f"Error parsing event body: {str(e)}")
            logger.error(f"Event that caused error: {json.dumps(event, default=str)}")
            raise

        # Validate required fields are present
        if not isinstance(body, dict):
            raise ValueError(f"Body must be a dictionary, got {type(body)}")
            
        required_fields = ['num1', 'operation']
        missing_fields = [field for field in required_fields if field not in body]
        if missing_fields:
            raise ValueError(f"Missing required fields: {missing_fields}")

        # Extract values
        num1 = body['num1']
        num2 = body.get('num2')  # optional
        operation = body['operation']

        # Create calculation ID and expression
        if operation in ['sqrt', 'sin', 'cos', 'tan', 'C to F', 'F to C']:
            expression = f"{operation}({num1})"
        else:
            expression = f"{num1} {operation} {num2 if num2 is not None else ''}"

        calculation_id = expression
        
        # Rest of your existing code...
        
        return {
            'statusCode': 200,
            'body': json.dumps({'message': 'Count updated successfully'}),
            'headers': {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': 'http://xaiproject.net',
                'Access-Control-Allow-Methods': 'OPTIONS,POST',
                'Access-Control-Allow-Headers': 'Content-Type'
            }
        }

    except ValueError as e:
        logger.error(f"Validation error: {str(e)}")
        logger.error(f"Validation error traceback: {traceback.format_exc()}")
        return {
            'statusCode': 400,
            'body': json.dumps({'error': str(e)}),
            'headers': {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': 'http://xaiproject.net',
                'Access-Control-Allow-Methods': 'OPTIONS,POST',
                'Access-Control-Allow-Headers': 'Content-Type'
            }
        }
    except Exception as e:
        logger.error(f"Unexpected error: {str(e)}")
        logger.error(f"Error traceback: {traceback.format_exc()}")
        return {
            'statusCode': 500,
            'body': json.dumps({'error': 'Internal server error'}),
            'headers': {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': 'http://xaiproject.net',
                'Access-Control-Allow-Methods': 'OPTIONS,POST',
                'Access-Control-Allow-Headers': 'Content-Type'
            }
        }
