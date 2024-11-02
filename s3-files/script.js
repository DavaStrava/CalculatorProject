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
        console.log('Expression to calculate:', expression);
        
        // Parse the expression
        const [num1, operator, num2] = expression.match(/(-?\d*\.?\d+)|[\+\-\*\/]/g) || [];
        console.log('Parsed values:', { num1, operator, num2 });
        
        if (!num1 || !operator || !num2) {
            throw new Error('Invalid expression');
        }
        
        const result = eval(expression);
        console.log('Calculation result:', result);
        
        display.value = result;
        recordCalculationInDynamo(parseFloat(num1), parseFloat(num2), operator);
    } catch (error) {
        console.error('Calculation error:', error);
        display.value = "Error";
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
    recordCalculationInDynamo(number, null, 'sqrt');
}

// Perform power operation
function powerOperation() {
    const base = parseFloat(display.value);
    display.value = ''; // Clear the display for the exponent input
    display.value = `${base}^`;
}

// Convert degrees to radians
function toRadians(degrees) {
    return degrees * (Math.PI / 180);
}

// Perform sine operation
function sinOperation() {
    const angleInDegrees = parseFloat(display.value);
    if (isNaN(angleInDegrees)) {
        display.value = "Error";
        return;
    }
    const radians = toRadians(angleInDegrees);
    display.value = Math.sin(radians).toFixed(4);
    recordCalculationInDynamo(angleInDegrees, null, 'sin');
}

// Perform cosine operation
function cosOperation() {
    const angleInDegrees = parseFloat(display.value);
    if (isNaN(angleInDegrees)) {
        display.value = "Error";
        return;
    }
    const radians = toRadians(angleInDegrees);
    display.value = Math.cos(radians).toFixed(4);
    recordCalculationInDynamo(angleInDegrees, null, 'cos');
}

// Perform tangent operation
function tanOperation() {
    const angleInDegrees = parseFloat(display.value);
    if (isNaN(angleInDegrees)) {
        display.value = "Error";
        return;
    }
    const radians = toRadians(angleInDegrees);
    display.value = Math.tan(radians).toFixed(4);
    recordCalculationInDynamo(angleInDegrees, null, 'tan');
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
    recordCalculationInDynamo(fahrenheit, null, 'F to C');
}

// Enhanced recordCalculationInDynamo function with better error handling
function recordCalculationInDynamo(num1, num2, operation) {
    // Create the request payload
    const payload = {
        num1: num1,
        num2: num2,
        operation: operation
    };

    console.log('Attempting to record calculation:', payload);

    fetch('https://927lg8a0al.execute-api.us-west-2.amazonaws.com/default/count_update_calculator', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
    })
    .then(async response => {
        // Log full response details
        console.log('Response status:', response.status);
        console.log('Response headers:', Object.fromEntries([...response.headers]));
        
        const responseText = await response.text();
        console.log('Raw response text:', responseText);
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}, response: ${responseText}`);
        }
        
        // Try to parse JSON response
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
