import boto3
import logging
import json
from decimal import Decimal
# testing deployment
# Set up logging 111
logger = logging.getLogger()
logger.setLevel(logging.INFO)

# Initialize DynamoDB resource
dynamodb = boto3.resource('dynamodb')
table = dynamodb.Table('arn:aws:dynamodb:us-west-2:737630435491:table/CalculationTracker')

def lambda_handler(event, context):
    logger.info("Fetching total calculation count.")

    try:
        # Scan the table to retrieve all items
        response = table.scan()

        total_calculations = Decimal(0)  # Initialize total calculations counter

        # Sum the count of each item
        for item in response['Items']:
            total_calculations += item.get('count', Decimal(0))  # Sum up the 'count' field

        # Return the total calculations as part of the API response
        return {
            'statusCode': 200,
            'body': json.dumps({
                'total_calculations': int(total_calculations)
            }),
            'headers': {
                'Content-Type': 'application/json',
            }
        }

    except Exception as e:
        logger.error(f"Error fetching calculation count: {str(e)}")
        return {
            'statusCode': 500,
            'body': json.dumps({'error': str(e)}),
            'headers': {
                'Content-Type': 'application/json',
            }
        }
