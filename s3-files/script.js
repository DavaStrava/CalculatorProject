// script.js
// Constants for error logging and configuration
const DEBUG = true;
const MAX_DISPLAY_LENGTH = 25;
const ERROR_MESSAGES = {
    SYNTAX: 'Syntax Error',
    MATH: 'Math Error',
    DIVIDE_ZERO: 'Cannot divide by zero',
    INVALID_INPUT: 'Invalid Input',
    OVERFLOW: 'Number too large'
};

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
    }
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
    }

    reset() {
        this.currentInput = '';
        this.previousInput = '';
        this.currentOperator = null;
        this.shouldResetDisplay = false;
        Logger.info('Calculator state reset');
    }
}

// Initialize calculator state and elements
const calculatorState = new CalculatorState();
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

// Rest of your JavaScript remains largely the same, 
// but remove the expression input handling code
// ... (previous JS for button handling, calculations, etc.)

// Add angle mode handling
document.getElementById('angleMode').addEventListener('change', function(e) {
    calculatorState.isRadianMode = e.target.value === 'rad';
    Logger.info(`Angle mode changed to: ${e.target.value.toUpperCase()}`);
});

// Rest of your existing JavaScript functionality
// ... (previous JS for calculations, error handling, etc.)
