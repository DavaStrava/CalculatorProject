function advancedOperation(operation) {
    const num1 = parseFloat(display.value);
    
    // Power operation requires two operands, num1 and num2
    if (operation === 'power') {
        const base = parseFloat(prompt("Enter the base number:"));
        const exponent = parseFloat(prompt("Enter the exponent:"));
        if (isNaN(base) || isNaN(exponent)) {
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
                "num1": base,
                "num2": exponent
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
    } else {
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
                "num2": null  // No second operand for advanced operations like sqrt
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
}
