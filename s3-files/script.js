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
        const result = eval(display.value); // Use eval for basic arithmetic
        display.value = result;
        // Log the calculation in DynamoDB
        recordCalculationInDynamo(display.value, result);
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
    recordCalculationInDynamo(`sqrt(${number})`, display.value);
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
    recordCalculationInDynamo(`sin(${angleInDegrees}°)`, display.value);
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
    recordCalculationInDynamo(`cos(${angleInDegrees}°)`, display.value);
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
    recordCalculationInDynamo(`tan(${angleInDegrees}°)`, display.value);
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
    recordCalculationInDynamo(`${celsius}C to F`, fahrenheit);
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
    recordCalculationInDynamo(`${fahrenheit}F to C`, celsius);
}

// Send a request to record the calculation in DynamoDB
function recordCalculationInDynamo(expression, result) {
    fetch('https://927lg8a0al.execute-api.us-west-2.amazonaws.com/default/count_update_calculator', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            "expression": expression,
            "result": result
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
