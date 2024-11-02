// Get the display element from the DOM
let display = document.getElementById('display');

// Append number or operator to the display with improved validation
function appendDisplay(value) {
    // If the display shows "Error", clear it first
    if (display.value === "Error") {
        display.value = '';
    }
    
    // Handle operator inputs with validation
    if (['+', '-', '*', '/', '^'].includes(value)) {
        if (display.value === '') {
            // Only allow minus sign for negative numbers at start
            if (value === '-') {
                display.value = value;
            }
            return;
        }
        // Prevent multiple consecutive operators by replacing the last one
        const lastChar = display.value.slice(-1);
        if (['+', '-', '*', '/', '^'].includes(lastChar)) {
            display.value = display.value.slice(0, -1) + value;
            return;
        }
    }
    
    // Append the value to display
    display.value += value;
}

// Clear the calculator display
function clearDisplay() {
    display.value = '';
}

// Remove the last character from display (backspace)
function backspace() {
    display.value = display.value.slice(0, -1);
}

// Perform basic calculations with improved error handling and operator support
function calculate() {
    try {
        const expression = display.value;
        console.log('Expression to calculate:', expression);
        
        // Enhanced regular expression to handle negative numbers and all operators
        const matches = expression.match(/(-?\d*\.?\d+)|[\+\-\*\/\^]/g);
        console.log('Parsed matches:', matches);
        
        // Validate that we have enough parts for a valid expression
        if (!matches || matches.length < 3) {
            throw new Error('Invalid expression');
        }

        // Parse the numbers and operator
        const num1 = parseFloat(matches[0]);
        const operator = matches[1];
        const num2 = parseFloat(matches[2]);
        
        console.log('Parsed values:', { num1, operator, num2 });
        
        // Validate the numbers
        if (isNaN(num1) || isNaN(num2)) {
            throw new Error('Invalid numbers');
        }

        // Calculate result based on operator type
        let result;
        switch (operator) {
            case '+':
                result = num1 + num2;
                break;
            case '-':
                result = num1 - num2;
                break;
            case '*':
                result = num1 * num2;
                break;
            case '/':
                if (num2 === 0) {
                    throw new Error('Division by zero');
                }
                result = num1 / num2;
                break;
            case '^':
                result = Math.pow(num1, num2);
                break;
            default:
                throw new Error('Invalid operator');
        }

        console.log('Calculation result:', result);
        display.value = result;
        
        // Record the calculation in DynamoDB
        recordCalculationInDynamo(num1, num2, operator);
    } catch (error) {
        console.error('Calculation error:', error);
        display.value = "Error";
    }
}

// Perform square root operation
function sqrtOperation() {
    try {
        const number = parseFloat(display.value);
        if (isNaN(number)) {
            throw new Error('Invalid number');
        }
        const result = Math.sqrt(number);
        display.value = result;
        recordCalculationInDynamo(number, null, 'sqrt');
    } catch (error) {
        console.error('Square root error:', error);
        display.value = "Error";
    }
}

// Handle power operation with improved validation
function powerOperation() {
    try {
        const base = parseFloat(display.value);
        if (isNaN(base)) {
            throw new Error('Invalid number');
        }
        display.value = base + '^';
    } catch (error) {
        console.error('Power operation error:', error);
        display.value = "Error";
    }
}

// Convert degrees to radians helper function
function toRadians(degrees) {
    return degrees * (Math.PI / 180);
}

// Perform sine operation
function sinOperation() {
    try {
        const angleInDegrees = parseFloat(display.value);
        if (isNaN(angleInDegrees)) {
            throw new Error('Invalid angle');
        }
        const radians = toRadians(angleInDegrees);
        display.value = Math.sin(radians).toFixed(4);
        recordCalculationInDynamo(angleInDegrees, null, 'sin');
    } catch (error) {
        console.error('Sine error:', error);
        display.value = "Error";
    }
}

// Perform cosine operation
function cosOperation() {
    try {
        const angleInDegrees = parseFloat(display.value);
        if (isNaN(angleInDegrees)) {
            throw new Error('Invalid angle');
        }
        const radians = toRadians(angleInDegrees);
        display.value = Math.cos(radians).toFixed(4);
        recordCalculationInDynamo(angleInDegrees, null, 'cos');
    } catch (error) {
        console.error('Cosine error:', error);
        display.value = "Error";
    }
}

// Perform tangent operation
function tanOperation() {
    try {
        const angleInDegrees = parseFloat(display.value);
        if (isNaN(angleInDegrees)) {
            throw new Error('Invalid angle');
        }
        const radians = toRadians(angleInDegrees);
        display.value = Math.tan(radians).toFixed(4);
        recordCalculationInDynamo(angleInDegrees, null, 'tan');
    } catch (error) {
        console.error('Tangent error:', error);
        display.value = "Error";
    }
}

// Convert Celsius to Fahrenheit
function celsiusToFahrenheit() {
    try {
        const celsius = parseFloat(display.value);
        if (isNaN(celsius)) {
            throw new Error('Invalid temperature');
        }
        const fahrenheit = (celsius * 9 / 5) + 32;
        display.value = fahrenheit;
        recordCalculationInDynamo(celsius, null, 'C to F');
    } catch (error) {
        console.error('Temperature conversion error:', error);
        display.value = "Error";
    }
}

// Convert Fahrenheit to Celsius
function fahrenheitToCelsius() {
    try {
        const fahrenheit = parseFloat(display.value);
        if (isNaN(fahrenheit)) {
            throw new Error('Invalid temperature');
        }
        const celsius = (fahrenheit - 32) * 5 / 9;
        display.value = celsius;
        recordCalculationInDynamo(fahrenheit, null, 'F to C');
    } catch (error) {
        console.error('Temperature conversion error:', error);
        display.value = "Error";
    }
}

// Record calculation in DynamoDB with enhanced error handling and logging
function recordCalculationInDynamo(num1, num2, operation) {
    // Create the request payload with validated data
    const payload = {
        num1: num1,
        num2: num2,
        operation: operation
    };

    console.log('Attempting to record calculation:', payload);

    // Make the API request to Lambda function
    fetch('https://927lg8a0al.execute-api.us-west-2.amazonaws.com/default/count_update_calculator', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
    })
    .then(async response => {
        // Log detailed response information for debugging
        console.log('Response status:', response.status);
        console.log('Response headers:', Object.fromEntries([...response.headers]));
        
        // Get raw response text for logging
        const responseText = await response.text();
        console.log('Raw response text:', responseText);
        
        // Check if response is ok (status in 200-299 range)
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}, response: ${responseText}`);
        }
        
        // Try to parse the response as JSON
        try {
            const data = JSON.parse(responseText);
            console.log('Successfully recorded calculation:', data);
            return data;
        } catch (e) {
            console.error('Error parsing response JSON:', e);
            throw new Error('Invalid JSON response');
        }
    })
    .catch(error => {
        console.error('Error recording calculation:', error);
    });
}
