let display = document.getElementById('display');

// Append number or operator to the display
function appendDisplay(value) {
    display.value += value;
}

// Clear the display
function clearDisplay() {
    display.value = '';
}

// Backspace one character
function backspace() {
    display.value = display.value.slice(0, -1);
}

// Perform basic calculations
function calculate() {
    try {
        const expression = display.value;
        const result = eval(expression); // Use eval for basic arithmetic
        const num1 = parseFloat(expression.split(/[\+\-\*\/]/)[0]);
        const num2 = parseFloat(expression.split(/[\+\-\*\/]/)[1]);
        const operator = expression.match(/[\+\-\*\/]/)[0]; // Get the operator
        
        display.value = result;
        // Log the calculation in DynamoDB
        recordCalculationInDynamo(num1, num2, operator);
    } catch (error) {
        display.value = "Error";
        console.error('Calculation error:', error);
    }
}

// Perform square root operation
function sqrtOperation() {
    const number = parseFloat(display.value);
    if (isNaN(number)) {
        display.value = "Error";
        return;
    }
    display.value = Math.sqrt(number);
    // Log the calculation in DynamoDB
    recordCalculationInDynamo(number, null, 'sqrt');
}

// Perform power operation
function powerOperation() {
    const base = parseFloat(display.value);
    display.value = ''; // Clear the display for the exponent input
    display.value = `${base}^`;
}

// Perform sine operation (convert degrees to radians)
function sinOperation() {
    const angleInDegrees = parseFloat(display.value);
    if (isNaN(angleInDegrees)) {
        display.value = "Error";
        return;
    }
    const radians = toRadians(angleInDegrees);
    display.value = Math.sin(radians).toFixed(4); // Calculate sine in radians
    // Log the calculation in DynamoDB
    recordCalculationInDynamo(angleInDegrees, null, 'sin');
}

// Perform cosine operation (convert degrees to radians)
function cosOperation() {
    const angleInDegrees = parseFloat(display.value);
    if (isNaN(angleInDegrees)) {
        display.value = "Error";
        return;
    }
    const radians = toRadians(angleInDegrees);
    display.value = Math.cos(radians).toFixed(4); // Calculate cosine in radians
    // Log the calculation in DynamoDB
    recordCalculationInDynamo(angleInDegrees, null, 'cos');
}

// Perform tangent operation (convert degrees to radians)
function tanOperation() {
    const angleInDegrees = parseFloat(display.value);
    if (isNaN(angleInDegrees)) {
        display.value = "Error";
        return;
    }
    const radians = toRadians(angleInDegrees);
    display.value = Math.tan(radians).toFixed(4); // Calculate tangent in radians
    // Log the calculation in DynamoDB
    recordCalculationInDynamo(angleInDegrees, null, 'tan');
}

// Convert degrees to radians
function toRadians(degrees) {
    return degrees * (Math.PI / 180); // Convert degrees to radians
}

// Celsius to Fahrenheit conversion
function celsiusToFahrenheit() {
    const celsius = parseFloat(display.value);
    if (isNaN(celsius)) {
        display.value = "Error";
        return;
    }
    const fahrenheit = (celsius * 9 / 5) + 32;
    display.value = fahrenheit;
    // Log the conversion in DynamoDB
    recordCalculationInDynamo(celsius, null, 'C to F');
}

// Fahrenheit to Celsius conversion
function fahrenheitToCelsius() {
    const fahrenheit = parseFloat(display.value);
    if (isNaN(fahrenheit)) {
        display.value = "Error";
        return;
    }
    const celsius = (fahrenheit - 32) * 5 / 9;
    display.value = celsius;
    // Log the conversion in DynamoDB
    recordCalculationInDynamo(fahrenheit, null, 'F to C');
}


// Send a request to record the calculation in DynamoDB
function recordCalculationInDynamo(num1, num2, operation) {
    fetch('https://927lg8a0al.execute-api.us-west-2.amazonaws.com/default/count_update_calculator', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            "num1": num1,     // Send num1
            "num2": num2,     // Send num2 (can be null for single-input calculations like sqrt)
            "operation": operation  // Send the operation (e.g., 'add', 'sqrt', 'sin', 'cos', 'C to F', 'F to C')
        })
    })
    .then(response => response.json())
    .then(data => {
        console.log('Calculation recorded successfully:', data);
    })
    .catch(error => {
        console.error('Error recording calculation:', error);
    });
}
