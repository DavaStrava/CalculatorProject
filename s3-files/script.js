let display = document.getElementById('display');

// Function to append numbers or operators to the display
function appendDisplay(value) {
    display.value += value;
}

// Function to clear the display
function clearDisplay() {
    display.value = '';
}

// Function to delete the last character
function backspace() {
    display.value = display.value.slice(0, -1);
}

// Function to handle basic operations (+, -, *, /)
function calculate() {
    const expression = display.value;

    // Regular expression to capture num1, operator, and num2
    const match = expression.match(/(\d+\.?\d*)([\+\-\*\/])(\d+\.?\d*)?/);

    if (!match) {
        display.value = "Error";
        return;
    }

    const num1 = parseFloat(match[1]);
    const operator = match[2];
    const num2 = match[3] ? parseFloat(match[3]) : null;

    // Map operator to a named operation for the API
    let operation = "";
    switch (operator) {
        case '+':
            operation = "add";
            break;
        case '-':
            operation = "subtract";
            break;
        case '*':
            operation = "multiply";
            break;
        case '/':
            operation = "divide";
            break;
        default:
            display.value = "Error";
            return;
    }

    fetch('https://927lg8a0al.execute-api.us-west-2.amazonaws.com/default/CalculatorTest', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            "operation": operation,
            "num1": num1,
            "num2": num2
        })
    })
    .then(response => {
        if (!response.ok) {
            throw new Error('Network response was not OK');
        }
        return response.json();
    })
    .then(data => {
        display.value = data.result;
    })
    .catch(error => {
        display.value = "Error";
        console.error('Error:', error);
    });
}

// Function to handle advanced operations (sqrt, sin, cos, tan, power)
function advancedOperation(operation) {
    const num1 = parseFloat(display.value);
    if (isNaN(num1)) {
        display.value = "Error";
        return;
    }

    let num2 = null;

    // Handle the power operation that requires two inputs
    if (operation === 'power') {
        num2 = parseFloat(prompt("Enter the exponent:"));
        if (isNaN(num2)) {
            display.value = "Error";
            return;
        }
    }

    fetch('https://927lg8a0al.execute-api.us-west-2.amazonaws.com/default/CalculatorTest', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            "operation": operation,
            "num1": num1,
            "num2": num2  // num2 is null for sqrt, sin, cos, tan, unless it's a power operation
        })
    })
    .then(response => {
        if (!response.ok) {
            throw new Error('Network response was not OK');
        }
        return response.json();
    })
    .then(data => {
        display.value = data.result;
    })
    .catch(error => {
        display.value = "Error";
        console.error('Error:', error);
    });
}

// Celsius to Fahrenheit conversion
function celsiusToFahrenheit() {
    advancedOperation('celsius_to_fahrenheit');
}

// Fahrenheit to Celsius conversion
function fahrenheitToCelsius() {
    advancedOperation('fahrenheit_to_celsius');
}

// Square root operation
function squareRoot() {
    advancedOperation('sqrt');
}

// Sine operation
function sine() {
    advancedOperation('sin');
}

// Cosine operation
function cosine() {
    advancedOperation('cos');
}

// Tangent operation
function tangent() {
    advancedOperation('tan');
}

// Power operation
function power() {
    advancedOperation('power');
}
