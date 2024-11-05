// Constants for error logging and configuration
const DEBUG = true; // Set to false in production
const MAX_DISPLAY_LENGTH = 25;
const ERROR_MESSAGES = {
    SYNTAX: 'Syntax Error',
    MATH: 'Math Error',
    DIVIDE_ZERO: 'Cannot divide by zero',
    INVALID_INPUT: 'Invalid Input',
    OVERFLOW: 'Number too large'
};

// Logger utility for development and debugging
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

// State management for calculator
class CalculatorState {
    constructor() {
        this.currentInput = '';
        this.previousInput = '';
        this.currentOperator = null;
        this.shouldResetDisplay = false;
        this.memory = 0;
        this.isRadianMode = true;
    }

    reset() {
        this.currentInput = '';
        this.previousInput = '';
        this.currentOperator = null;
        this.shouldResetDisplay = false;
        Logger.info('Calculator state reset');
    }
}

// Initialize calculator state
const calculatorState = new CalculatorState();

// DOM Elements
let display;
let previousCalculations;

// Initialize calculator when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    try {
        initializeCalculator();
        Logger.info('Calculator initialized successfully');
    } catch (error) {
        Logger.error('Failed to initialize calculator', error);
        showError('Failed to initialize calculator');
    }
});

// Initialize calculator and attach event listeners
function initializeCalculator() {
    // Get DOM elements
    display = document.querySelector('.calculator-display .current-input');
    previousCalculations = document.querySelector('.calculator-display .previous-calculations');

    // Attach number button listeners
    document.querySelectorAll('.number-button').forEach(button => {
        button.addEventListener('click', () => handleNumberInput(button.textContent));
    });

    // Attach operator button listeners
    document.querySelectorAll('.operator-button').forEach(button => {
        button.addEventListener('click', () => handleOperator(button.textContent));
    });

    // Attach function button listeners
    document.querySelectorAll('.function-button').forEach(button => {
        button.addEventListener('click', () => handleFunction(button.textContent));
    });

    // Attach equals button listener
    document.querySelector('.equals-button').addEventListener('click', calculateResult);

    // Attach keyboard input listener
    document.addEventListener('keydown', handleKeyboardInput);
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

        calculatorState.currentInput += number;
        updateDisplay();
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
        const input = parseFloat(calculatorState.currentInput);
        let result;

        switch (func) {
            case 'x²':
                result = Math.pow(input, 2);
                break;
            case '√x':
                if (input < 0) {
                    throw new Error('Cannot calculate square root of negative number');
                }
                result = Math.sqrt(input);
                break;
            case 'xⁿ':
                calculatorState.currentOperator = 'pow';
                calculatorState.previousInput = calculatorState.currentInput;
                calculatorState.currentInput = '';
                return;
            case 'log':
                if (input <= 0) {
                    throw new Error('Cannot calculate log of non-positive number');
                }
                result = Math.log10(input);
                break;
            default:
                Logger.warn(`Unknown function: ${func}`);
                return;
        }

        addToHistory(`${func}(${input}) = ${result}`);
        calculatorState.currentInput = result.toString();
        updateDisplay();
        Logger.info(`Function ${func} calculated: ${result}`);
    } catch (error) {
        Logger.error(`Error in function ${func}`, error);
        showError(ERROR_MESSAGES.MATH);
    }
}

// Calculate result based on current state
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
                if (current === 0) {
                    throw new Error('Division by zero');
                }
                result = prev / current;
                break;
            case 'pow':
                result = Math.pow(prev, current);
                break;
            default:
                Logger.warn(`Unknown operator: ${calculatorState.currentOperator}`);
                return;
        }

        // Check for overflow
        if (!isFinite(result)) {
            throw new Error('Number overflow');
        }

        const expression = `${prev} ${calculatorState.currentOperator} ${current} = ${result}`;
        addToHistory(expression);
        calculatorState.currentInput = result.toString();
        calculatorState.previousInput = '';
        calculatorState.currentOperator = null;
        calculatorState.shouldResetDisplay = true;
        updateDisplay();

        // Record calculation in DynamoDB
        recordCalculation(prev, current, calculatorState.currentOperator, result);
        Logger.info(`Calculation completed: ${expression}`);
    } catch (error) {
        Logger.error('Error calculating result', error);
        showError(error.message === 'Division by zero' ? ERROR_MESSAGES.DIVIDE_ZERO : ERROR_MESSAGES.MATH);
    }
}

// Update display with current input
function updateDisplay() {
    try {
        display.textContent = calculatorState.currentInput || '0';
    } catch (error) {
        Logger.error('Error updating display', error);
    }
}

// Add calculation to history
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
    try {
        calculatorState.currentInput = message;
        updateDisplay();
        calculatorState.shouldResetDisplay = true;
    } catch (error) {
        Logger.error('Error displaying error message', error);
    }
}

// Handle keyboard input
function handleKeyboardInput(event) {
    try {
        const key = event.key;

        // Prevent default actions for calculator keys
        if (/[\d\+\-\*\/\.\=]/.test(key)) {
            event.preventDefault();
        }

        // Number keys
        if (/\d/.test(key)) {
            handleNumberInput(key);
        }
        // Operator keys
        else if (key === '+' || key === '-' || key === '*' || key === '/') {
            const operatorMap = {
                '*': '×',
                '/': '÷'
            };
            handleOperator(operatorMap[key] || key);
        }
        // Enter or equals key
        else if (key === 'Enter' || key === '=') {
            calculateResult();
        }
        // Decimal point
        else if (key === '.') {
            handleNumberInput(key);
        }
        // Backspace
        else if (key === 'Backspace') {
            handleBackspace();
        }
        // Escape key (clear)
        else if (key === 'Escape') {
            calculatorState.reset();
            updateDisplay();
        }

        Logger.info(`Keyboard input processed: ${key}`);
    } catch (error) {
        Logger.error('Error handling keyboard input', error);
        showError(ERROR_MESSAGES.INVALID_INPUT);
    }
}

// Handle backspace functionality
function handleBackspace() {
    try {
        if (calculatorState.currentInput.length > 0) {
            calculatorState.currentInput = calculatorState.currentInput.slice(0, -1);
            updateDisplay();
        }
    } catch (error) {
        Logger.error('Error handling backspace', error);
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
        // Don't show error to user as this is non-critical functionality
    }
}
