// script.js

// Constants for configuration and error messages
const DEBUG = true;
const MAX_DISPLAY_LENGTH = 25;
const ERROR_MESSAGES = {
    SYNTAX: 'Syntax Error',
    MATH: 'Math Error',
    DIVIDE_ZERO: 'Cannot divide by zero',
    INVALID_INPUT: 'Invalid Input',
    OVERFLOW: 'Number too large',
    INVALID_FUNCTION: 'Invalid Function'
};

// Mathematical constants
const MATH_CONSTANTS = {
    PI: Math.PI,
    E: Math.E
};

// Logger utility
const Logger = {
    error: function(message, error) {
        if (DEBUG) {
            console.error(`[Calculator Error]: ${message}`, error);
        }
    },
    info: function(message) {
        if (DEBUG) {
            console.info(`[Calculator Info]: ${message}`);
        }
    },
    warn: function(message) {
        if (DEBUG) {
            console.warn(`[Calculator Warning]: ${message}`);
        }
    }
};

// Add this new constant for function templates
const FUNCTION_TEMPLATES = {
    'sin': 'sin(',
    'cos': 'cos(',
    'tan': 'tan(',
    'log': 'log(',
    'x²': '^2',
    '√x': '√(',
    'xⁿ': '^'
};

// Calculator State Management
class CalculatorState {
    constructor() {
        this.currentInput = '';
        this.previousInput = '';
        this.currentOperator = null;
        this.shouldResetDisplay = false;
        this.isRadianMode = true;
        this.memory = 0;
        this.eventListeners = new Map();
        this.lastResult = null;
        // Add new properties for function handling
        this.waitingForOperand = false;    // Indicates waiting for function input
        this.pendingFunction = null;       // Stores current function being processed
        this.openParentheses = 0;         // Tracks open parentheses
    }

    reset() {
        this.currentInput = '';
        this.previousInput = '';
        this.currentOperator = null;
        this.shouldResetDisplay = false;
          // Reset new properties
        this.waitingForOperand = false;
        this.pendingFunction = null;
        this.openParentheses = 0;
        Logger.info('Calculator state reset');
    }

    cleanup() {
        this.eventListeners.forEach((handler, element) => {
            element.removeEventListener('click', handler);
        });
        this.eventListeners.clear();
    }
}

// Initialize calculator state and elements
const calculatorState = new CalculatorState();
let display;
let previousCalculations;

// Event listener attachment utility
function attachEventListener(element, eventType, handler) {
    element.addEventListener(eventType, handler);
    calculatorState.eventListeners.set(element, handler);
}

// Initialize calculator
function initializeCalculator() {
    try {
        // Get DOM elements
        display = document.querySelector('.calculator-display .current-input');
        previousCalculations = document.querySelector('.calculator-display .previous-calculations');

        // Attach number button listeners
        document.querySelectorAll('.number-button').forEach(button => {
            attachEventListener(button, 'click', () => handleNumberInput(button.textContent));
        });

        // Attach operator button listeners
        document.querySelectorAll('.operator-button').forEach(button => {
            attachEventListener(button, 'click', () => handleOperator(button.textContent));
        });

        // Attach function button listeners
        document.querySelectorAll('.function-button').forEach(button => {
            attachEventListener(button, 'click', () => handleFunction(button.textContent));
        });

        // Attach equals button listener
        const equalsButton = document.querySelector('.equals-button');
        attachEventListener(equalsButton, 'click', () => {
            if (calculatorState.pendingFunction) {
                if (calculatorState.openParentheses > 0) {
                    calculatorState.currentInput += ')'.repeat(calculatorState.openParentheses);
                    calculatorState.openParentheses = 0;
                    calculateFunction();
                }
            } else {
                calculateResult();
            }
        });

        // Attach angle mode listener
        const angleModeSelect = document.getElementById('angleMode');
        attachEventListener(angleModeSelect, 'change', (e) => {
            calculatorState.isRadianMode = e.target.value === 'rad';
            Logger.info(`Angle mode changed to: ${e.target.value.toUpperCase()}`);
        });

        // Attach keyboard listener
        attachEventListener(document, 'keydown', handleKeyboardInput);

            // Add Clear button handler
        const clearButton = document.querySelector('button:contains("C"), button[data-function="clear"]');
        if (clearButton) {
            attachEventListener(clearButton, 'click', () => {
                calculatorState.reset();
                updateDisplay();
                Logger.info('Calculator cleared');
            });
        }

        Logger.info('Calculator initialized successfully');
    } catch (error) {
        Logger.error('Failed to initialize calculator', error);
        showError('Failed to initialize calculator');
    }
}

// Handle number input
function handleNumberInput(number) {
    try {
        if (calculatorState.shouldResetDisplay) {
            calculatorState.currentInput = '';
            calculatorState.shouldResetDisplay = false;
        }

        if (calculatorState.currentInput.length >= MAX_DISPLAY_LENGTH) {
            Logger.warn('Maximum input length reached');
            return;
        }

        if (number === '.' && calculatorState.currentInput.includes('.')) {
            Logger.warn('Decimal point already exists');
            return;
        }

        calculatorState.currentInput += number;
        updateDisplay();
        
        // Add auto-closing parentheses for functions
        if (calculatorState.waitingForOperand && 
            calculatorState.openParentheses === 1 && 
            !isNaN(number)) {
            calculatorState.currentInput += ')';
            calculatorState.openParentheses--;
            calculateFunction();
        }

        Logger.info(`Number input: ${number}`);
    } catch (error) {
        Logger.error('Error handling number input', error);
        showError(ERROR_MESSAGES.INVALID_INPUT);
    }
}

// Handle operator input
function handleOperator(operator) {
    try {
        if (calculatorState.currentInput === '' && calculatorState.previousInput === '') {
            Logger.warn('Operator pressed without any input');
            return;
        }

        if (calculatorState.currentInput !== '') {
            if (calculatorState.previousInput !== '') {
                calculateResult();
            }
            calculatorState.previousInput = calculatorState.currentInput;
            calculatorState.currentInput = '';
        }

        calculatorState.currentOperator = operator;
        Logger.info(`Operator selected: ${operator}`);
    } catch (error) {
        Logger.error('Error handling operator', error);
        showError(ERROR_MESSAGES.SYNTAX);
    }
}

// Handle scientific functions
function handleFunction(func) {
    try {
        switch (func) {
            case 'π':
                calculatorState.currentInput += Math.PI.toString();
                break;
            case 'e':
                calculatorState.currentInput += Math.E.toString();
                break;
            default:
                if (FUNCTION_TEMPLATES[func]) {
                    if (calculatorState.currentInput && 
                        !calculatorState.currentInput.endsWith(' ') && 
                        !calculatorState.currentInput.endsWith('(')) {
                        calculatorState.currentInput += ' ';
                    }
                    
                    if (func === 'x²') {
                        if (calculatorState.currentInput) {
                            calculatorState.currentInput += FUNCTION_TEMPLATES[func];
                            calculateFunction();
                        }
                    } else {
                        calculatorState.pendingFunction = func;
                        calculatorState.currentInput += FUNCTION_TEMPLATES[func];
                        calculatorState.openParentheses++;
                        calculatorState.waitingForOperand = true;
                    }
                }
        }
        updateDisplay();
        Logger.info(`Function ${func} template applied`);
    } catch (error) {
        Logger.error(`Error in function ${func}`, error);
        showError(ERROR_MESSAGES.MATH);
    }
}

// Add new calculateFunction method
function calculateFunction() {
    try {
        if (!calculatorState.pendingFunction) return;

        let expression = calculatorState.currentInput;
        let result;

        // Extract the value from inside the parentheses
        const matches = expression.match(/[a-z]+\((.*)\)/);
        if (matches && matches[1]) {
            const input = parseFloat(matches[1]);
            
            switch (calculatorState.pendingFunction) {
                case 'sin':
                    result = calculatorState.isRadianMode ? 
                        Math.sin(input) : 
                        Math.sin(input * Math.PI / 180);
                    break;
                case 'cos':
                    result = calculatorState.isRadianMode ? 
                        Math.cos(input) : 
                        Math.cos(input * Math.PI / 180);
                    break;
                case 'tan':
                    result = calculatorState.isRadianMode ? 
                        Math.tan(input) : 
                        Math.tan(input * Math.PI / 180);
                    break;
                case 'log':
                    if (input <= 0) throw new Error('Cannot calculate log of non-positive number');
                    result = Math.log10(input);
                    break;
                case '√x':
                    if (input < 0) throw new Error('Cannot calculate square root of negative number');
                    result = Math.sqrt(input);
                    break;
            }
        } else if (expression.includes('^')) {
            const [base, exponent] = expression.split('^').map(parseFloat);
            result = Math.pow(base, exponent);
        }

        if (!isFinite(result)) {
            throw new Error('Result is infinite or undefined');
        }

        addToHistory(`${calculatorState.currentInput} = ${result}`);
        calculatorState.currentInput = result.toString();
        calculatorState.lastResult = result;
        calculatorState.pendingFunction = null;
        calculatorState.waitingForOperand = false;
        updateDisplay();

    } catch (error) {
        Logger.error('Error calculating function', error);
        showError(ERROR_MESSAGES.MATH);
    }
}

// Calculate result
function calculateResult() {
    try {
        if (calculatorState.previousInput === '' || calculatorState.currentInput === '') {
            Logger.warn('Incomplete expression for calculation');
            return;
        }

        const prev = parseFloat(calculatorState.previousInput);
        const current = parseFloat(calculatorState.currentInput);
        let result;

        switch (calculatorState.currentOperator) {
            case '+':
                result = prev + current;
                break;
            case '-':
                result = prev - current;
                break;
            case '×':
                result = prev * current;
                break;
            case '÷':
                if (current === 0) throw new Error(ERROR_MESSAGES.DIVIDE_ZERO);
                result = prev / current;
                break;
            default:
                throw new Error('Invalid operator');
        }

        if (!isFinite(result)) {
            throw new Error(ERROR_MESSAGES.OVERFLOW);
        }

        const expression = `${prev} ${calculatorState.currentOperator} ${current} = ${result}`;
        addToHistory(expression);
        calculatorState.currentInput = result.toString();
        calculatorState.previousInput = '';
        calculatorState.currentOperator = null;
        calculatorState.lastResult = result;
        calculatorState.shouldResetDisplay = true;
        
        updateDisplay();
        recordCalculation(prev, current, calculatorState.currentOperator, result);
        Logger.info(`Calculation completed: ${expression}`);
    } catch (error) {
        Logger.error('Error calculating result', error);
        showError(error.message || ERROR_MESSAGES.MATH);
    }
}

// Update display
function updateDisplay() {
    try {
        display.textContent = calculatorState.currentInput || '0';
    } catch (error) {
        Logger.error('Error updating display', error);
    }
}

// Add to calculation history
function addToHistory(expression) {
    try {
        const historyEntry = document.createElement('div');
        historyEntry.textContent = expression;
        previousCalculations.appendChild(historyEntry);
        previousCalculations.scrollTop = previousCalculations.scrollHeight;
    } catch (error) {
        Logger.error('Error adding to history', error);
    }
}

// Show error message
function showError(message) {
    calculatorState.currentInput = message;
    updateDisplay();
    calculatorState.shouldResetDisplay = true;
}

// Handle keyboard input
function handleKeyboardInput(event) {
    try {
        const key = event.key;

        if (/[0-9\.]/.test(key)) {
            event.preventDefault();
            handleNumberInput(key);
        } else if (['+', '-', '*', '/', 'Enter', '=', 'Escape'].includes(key)) {
            event.preventDefault();
            
            switch(key) {
                case '*':
                    handleOperator('×');
                    break;
                case '/':
                    handleOperator('÷');
                    break;
                case 'Enter':
                case '=':
                    calculateResult();
                    break;
                case 'Escape':
                    calculatorState.reset();
                    updateDisplay();
                    break;
                default:
                    handleOperator(key);
            }
        }
        
        Logger.info(`Keyboard input processed: ${key}`);
    } catch (error) {
        Logger.error('Error handling keyboard input', error);
        showError(ERROR_MESSAGES.INVALID_INPUT);
    }
}

// Record calculation in DynamoDB
async function recordCalculation(num1, num2, operation, result) {
    try {
        const response = await fetch('https://927lg8a0al.execute-api.us-west-2.amazonaws.com/default/count_update_calculator', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                num1: num1,
                num2: num2,
                operation: operation,
                result: result
            })
        });

        if (!response.ok) {
            throw new Error('Failed to record calculation');
        }

        Logger.info('Calculation recorded successfully');
    } catch (error) {
        Logger.error('Error recording calculation', error);
    }
}

// Clean up when page is unloaded
window.addEventListener('beforeunload', () => {
    calculatorState.cleanup();
});

// Initialize calculator when DOM is loaded
document.addEventListener('DOMContentLoaded', initializeCalculator);
