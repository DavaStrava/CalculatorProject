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

// Function templates for improved UX
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
        this.waitingForOperand = false;
        this.pendingFunction = null;
        this.openParentheses = 0;
    }

    reset() {
        this.currentInput = '';
        this.previousInput = '';
        this.currentOperator = null;
        this.shouldResetDisplay = false;
        this.waitingForOperand = false;
        this.pendingFunction = null;
        this.openParentheses = 0;
        this.lastResult = null;
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

        // Attach function button listeners including Clear
        document.querySelectorAll('.function-button').forEach(button => {
            if (button.textContent === 'C') {
                attachEventListener(button, 'click', handleClear);
            } else {
                attachEventListener(button, 'click', () => handleFunction(button.textContent));
            }
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
        if (angleModeSelect) {
            attachEventListener(angleModeSelect, 'change', (e) => {
                calculatorState.isRadianMode = e.target.value === 'rad';
                Logger.info(`Angle mode changed to: ${e.target.value.toUpperCase()}`);
            });
        }

        // Attach keyboard listener
        attachEventListener(document, 'keydown', handleKeyboardInput);

        Logger.info('Calculator initialized successfully');
    } catch (error) {
        Logger.error('Failed to initialize calculator', error);
        showError('Failed to initialize calculator');
    }
}

// Handle clear button
function handleClear() {
    try {
        calculatorState.reset();
        updateDisplay();
        Logger.info('Calculator cleared');
    } catch (error) {
        Logger.error('Error clearing calculator', error);
        // Fallback reset
        calculatorState.currentInput = '';
        updateDisplay();
    }
}

[... rest of your existing code remains exactly the same ...]

// Update handleFunction to include clear button logic
function handleFunction(func) {
    try {
        if (func === 'C') {
            handleClear();
            return;
        }

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

// Update keyboard input to handle clear
function handleKeyboardInput(event) {
    try {
        const key = event.key;

        if (/[0-9\.]/.test(key)) {
            event.preventDefault();
            handleNumberInput(key);
        } else if (['+', '-', '*', '/', 'Enter', '=', 'Escape', 'c', 'C'].includes(key)) {
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
                case 'c':
                case 'C':
                    handleClear();
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

[... rest of your existing code remains exactly the same ...]

// Clean up when page is unloaded
window.addEventListener('beforeunload', () => {
    calculatorState.cleanup();
});

// Initialize calculator when DOM is loaded
document.addEventListener('DOMContentLoaded', initializeCalculator);
