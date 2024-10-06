let display = document.getElementById('display');

function appendDisplay(value) {
    display.value += value;
}

function clearDisplay() {
    display.value = '';
}

function backspace() {
    display.value = display.value.slice(0, -1);
}

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

// Advanced Operations
function advancedOperation(operation) {
    const num1 = parseFloat(display.value);
    if (isNaN(num1)) {
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
            "num2": null
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

// Celsius to Fahrenheit conversion (backend)
function celsiusToFahrenheit() {
    const celsius = parseFloat(display.value);
    if (isNaN(celsius)) {
        display.value = "Error";
        return;
    }

    // Send the conversion request to the backend
    fetch('https://927lg8a0al.execute-api.us-west-2.amazonaws.com/default/CalculatorTest', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            "operation": "celsius_to_fahrenheit",
            "num1": celsius,
            "num2": null
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

// Fahrenheit to Celsius conversion (backend)
function fahrenheitToCelsius() {
    const fahrenheit = parseFloat(display.value);
    if (isNaN(fahrenheit)) {
        display.value = "Error";
        return;
    }

    // Send the conversion request to the backend
    fetch('https://927lg8a0al.execute-api.us-west-2.amazonaws.com/default/CalculatorTest', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            "operation": "fahrenheit_to_celsius",
            "num1": fahrenheit,
            "num2": null
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
