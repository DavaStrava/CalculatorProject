import { TRIG_MODE_CONFIG } from './modes/trigMode.js';
import { trigCalculations, trigValidation } from './utils/trigCalculations.js';

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

// Logger utility
const Logger = {
    error: function(message, error) {
        if (DEBUG) {
            console.error(message, error);
        }
    },
    info: function(message) {
        if (DEBUG) {
            console.info(message);
        }
    },
    warn: function(message) {
        if (DEBUG) {
            console.warn(`[Calculator Warning]: ${message}`);
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

// Attach events to text nodes
function attachEventListener(element, eventType, handler) {
    if (typeof element === 'string') {
        // Find the text node containing this content
        const xpath = `//text()[normalize-space(.)='${element}']`;
        const textNodes = document.evaluate(xpath, document, null, XPathResult.ORDERED_NODE_SNAPSHOT_TYPE, null);
        
        for (let i = 0; i < textNodes.snapshotLength; i++) {
            const textNode = textNodes.snapshotItem(i);
            const parent = textNode.parentElement;
            
            if (parent) {
                console.log('Attaching listener to:', element); // Debug log
                
                // Create a button wrapper if it doesn't exist
                let buttonWrapper = parent;
                if (parent.nodeName !== 'BUTTON') {
                    buttonWrapper = document.createElement('button');
                    buttonWrapper.className = 'calculator-button';
                    buttonWrapper.textContent = element;
                    parent.replaceChild(buttonWrapper, textNode);
                }
                
                const clickHandler = (e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    handler();
                };
                
                buttonWrapper.addEventListener(eventType, clickHandler);
                calculatorState.eventListeners.set(buttonWrapper, clickHandler);
            }
        }
    } else {
        element.addEventListener(eventType, handler);
        calculatorState.eventListeners.set(element, handler);
    }
}

// Initialize calculator
function initializeCalculator() {
    try {
        // Get display elements
        display = document.querySelector('.calculator-display .current-input');
        previousCalculations = document.querySelector('.calculator-display .previous-calculations');

        // Process calculator buttons
        buildBasicLayout();

        // Process scientific functions
        const scientificFunctions = document.querySelector('.scientific-functions');
        if (scientificFunctions) {
            const functions = scientificFunctions.innerText
                .split(/[\n\r]+/)
                .map(func => func.trim())
                .filter(func => func !== '');

            console.log('Found scientific functions:', functions); // Debug log

            functions.forEach(funcText => {
                if (funcText) {
                    console.log('Processing function:', funcText); // Debug log
                    attachEventListener(funcText, 'click', () => handleFunction(funcText));
                }
            });
        }

        // Keyboard listener
        attachEventListener(document, 'keydown', handleKeyboardInput);

        // Angle mode initialization
        const angleMode = document.querySelector('.angle-mode');
        if (angleMode) {
            const radDeg = angleMode.textContent.includes('RAD') ? 'rad' : 'deg';
            calculatorState.isRadianMode = radDeg === 'rad';
        }

        // Add visual feedback styles
        const style = document.createElement('style');
        style.textContent = `
            .calculator-buttons > *, .scientific-functions > * {
                cursor: pointer;
                padding: 8px;
                margin: 4px;
                border-radius: 4px;
                transition: background-color 0.2s;
            }
            .calculator-buttons > *:hover, .scientific-functions > *:hover {
                background-color: #e5e7eb;
            }
            .calculator-buttons > *:active, .scientific-functions > *:active {
                background-color: #d1d5db;
            }
        `;
        document.head.appendChild(style);

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

// Handle clear button
function handleClear() {
    try {
        calculatorState.reset();
        updateDisplay();
        Logger.info('Calculator cleared');
    } catch (error) {
        Logger.error('Error clearing calculator', error);
        calculatorState.currentInput = '';
        updateDisplay();
    }
}

// Handle functions
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
            case 'x²':
                if (calculatorState.currentInput) {
                    calculatorState.currentInput = Math.pow(parseFloat(calculatorState.currentInput), 2).toString();
                }
                break;
            case '√x':
                if (calculatorState.currentInput) {
                    const value = parseFloat(calculatorState.currentInput);
                    if (value < 0) {
                        throw new Error('Cannot calculate square root of negative number');
                    }
                    calculatorState.currentInput = Math.sqrt(value).toString();
                }
                break;
            case '%':
                if (calculatorState.currentInput) {
                    calculatorState.currentInput = (parseFloat(calculatorState.currentInput) / 100).toString();
                }
                break;
            case '(':
            case ')':
                calculatorState.currentInput += func;
                break;
            default:
                if (FUNCTION_TEMPLATES[func]) {
                    if (calculatorState.currentInput && 
                        !calculatorState.currentInput.endsWith(' ') && 
                        !calculatorState.currentInput.endsWith('(')) {
                        calculatorState.currentInput += ' ';
                    }
                    
                    calculatorState.pendingFunction = func;
                    calculatorState.currentInput += FUNCTION_TEMPLATES[func];
                    calculatorState.openParentheses++;
                    calculatorState.waitingForOperand = true;
                }
        }
        updateDisplay();
        Logger.info(`Function ${func} template applied`);
    } catch (error) {
        Logger.error(`Error in function ${func}`, error);
        showError(ERROR_MESSAGES.MATH);
    }
}

// Calculate function result
function calculateFunction() {
    try {
        if (!calculatorState.pendingFunction) return;

        let expression = calculatorState.currentInput;
        let result;

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
        Logger.error(`Error in function ${func}`, error);
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

// Record calculation in DynamoDB
function recordCalculation(num1, num2, operation, result) {
    fetch('https://927lg8a0al.execute-api.us-west-2.amazonaws.com/default/count_update_calculator', {
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
    })
    .then(response => {
        if (!response.ok) {
            throw new Error('Failed to record calculation');
        }
        Logger.info('Calculation recorded successfully');
    })
    .catch(error => {
        Logger.error('Error recording calculation', error);
    });
}

// Add CSS for clickable elements
document.addEventListener('DOMContentLoaded', () => {
    const style = document.createElement('style');
    style.textContent = `
        .calculator-buttons, .scientific-functions {
            user-select: none;
        }
        .calculator-buttons > *, .scientific-functions > * {
            cursor: pointer;
        }
    `;
    document.head.appendChild(style);
    
    // Initialize calculator
    initializeCalculator();
    buildScientificFunctions();
    initializeFunctionTabs();
});

// Clean up when page is unloaded
window.addEventListener('pagehide', () => {
    calculatorState.cleanup();
});

function handleTrigFunction(func, value) {
    try {
        // Validate input
        if (!trigValidation.validateDomain(func, value)) {
            throw new Error('Input out of domain');
        }

        // Perform calculation
        const result = trigCalculations[func](
            parseFloat(value), 
            calculatorState.isRadianMode
        );

        // Update display and history
        addToHistory(`${func}(${value}) = ${result}`);
        updateDisplay(result);

    } catch (error) {
        handleError(error);
    }
}

function switchToTrigMode() {
    // Clear current layout
    clearCalculatorLayout();
    
    // Apply trig mode styles
    document.querySelector('.calculator-card').classList.add('trig-mode');
    
    // Build trig mode layout
    buildTrigLayout(TRIG_MODE_CONFIG.layout);
    
    // Update help text
    updateHelpText(TRIG_MODE_CONFIG.helpText);
    
    // Show angle mode selector
    showAngleModeSelector();
}

function initializeTrigMode() {
    // Attach event listeners for trig functions
    document.querySelectorAll('.trig-function').forEach(button => {
        button.addEventListener('click', (e) => {
            const func = e.target.dataset.function;
            handleTrigFunction(func, calculatorState.currentInput);
        });
    });

    // Angle mode toggle handler
    document.getElementById('angleModeSelect').addEventListener('change', (e) => {
        calculatorState.isRadianMode = e.target.value === 'rad';
        updateAngleModeIndicator();
    });
}

// Function to clear the current calculator layout
function clearCalculatorLayout() {
    const calculatorButtons = document.querySelector('.calculator-buttons');
    const scientificFunctions = document.querySelector('.scientific-functions');
    calculatorButtons.innerHTML = '';
    scientificFunctions.innerHTML = '';
}

// Function to build the trigonometry layout
function buildTrigLayout(layout) {
    const calculatorButtons = document.querySelector('.calculator-buttons');
    layout.forEach(row => {
        row.forEach(buttonText => {
            const button = document.createElement('button');
            button.className = 'function-button trig-function';
            button.textContent = buttonText;
            button.dataset.function = buttonText;
            calculatorButtons.appendChild(button);
        });
    });
    initializeTrigMode(); // Ensure event listeners are attached after building the layout
}

// Function to update the help text
function updateHelpText(helpText) {
    const helpPanel = document.querySelector('.trig-help-panel');
    helpPanel.innerHTML = '';
    for (const [func, text] of Object.entries(helpText)) {
        const helpItem = document.createElement('div');
        helpItem.className = 'help-item';
        helpItem.innerHTML = `<strong>${func}:</strong> ${text}`;
        helpPanel.appendChild(helpItem);
    }
}

// Function to show the angle mode selector
function showAngleModeSelector() {
    const angleModeSelector = document.querySelector('.angle-mode-selector');
    angleModeSelector.style.display = 'block';
}

// Function to hide the angle mode selector
function hideAngleModeSelector() {
    const angleModeSelector = document.querySelector('.angle-mode-selector');
    angleModeSelector.style.display = 'none';
}

// Function to build the basic layout
function buildBasicLayout() {
    const calculatorButtons = document.querySelector('.calculator-buttons');
    const basicLayout = [
        ['(', ')', '%', 'C'],
        ['7', '8', '9', '÷'],
        ['4', '5', '6', '×'],
        ['1', '2', '3', '-'],
        ['0', '.', '=', '+']
    ];
    basicLayout.forEach(row => {
        row.forEach(buttonText => {
            const button = document.createElement('button');
            button.className = 'function-button';
            button.textContent = buttonText;
            calculatorButtons.appendChild(button);
            if ('0123456789.'.includes(buttonText)) {
                attachEventListener(button, 'click', () => handleNumberInput(buttonText));
            } else if ('+-×÷'.includes(buttonText)) {
                attachEventListener(button, 'click', () => handleOperator(buttonText));
            } else if (buttonText === 'C') {
                attachEventListener(button, 'click', handleClear);
            } else if (buttonText === '=') {
                attachEventListener(button, 'click', calculateResult);
            } else {
                attachEventListener(button, 'click', () => handleFunction(buttonText));
            }
        });
    });
}

// Function to switch to basic mode
function switchToBasicMode() {
    // Clear current layout
    clearCalculatorLayout();
    
    // Remove trig mode styles
    document.querySelector('.calculator-card').classList.remove('trig-mode');
    
    // Build basic layout
    buildBasicLayout();
    
    // Rebuild scientific functions
    buildScientificFunctions();
    
    // Hide angle mode selector
    hideAngleModeSelector();
}

// Initialize function tabs
function initializeFunctionTabs() {
    const tabs = document.querySelectorAll('.function-tabs .tab-button');
    tabs.forEach(tab => {
        tab.addEventListener('click', (e) => {
            tabs.forEach(t => t.classList.remove('active'));
            e.target.classList.add('active');
            if (e.target.textContent === 'Trigonometry') {
                switchToTrigMode();
            } else if (e.target.textContent === 'Basic') {
                switchToBasicMode();
            } else {
                // Handle other modes if necessary
            }
        });
    });
}

// First, let's define buildScientificFunctions BEFORE it's used
// Add this near the top of your file, after your initial constants and before other function definitions

function buildScientificFunctions() {
    const scientificFunctions = document.querySelector('.scientific-functions');
    
    // Clear existing content first
    scientificFunctions.innerHTML = '';
    
    const functions = [
        'π', 'e', 'x²', '√x',
        'sin', 'cos', 'tan', 'log'
    ];
    
    functions.forEach(funcText => {
        const button = document.createElement('button');
        button.className = 'function-button';
        button.textContent = funcText;
        scientificFunctions.appendChild(button);
        attachEventListener(button, 'click', () => handleFunction(funcText));
    });
}

function handleCalculusFunction(func) {
    try {
        switch(func) {
            case '∫':
                // Handle indefinite integration
                break;
            case '∂/∂x':
                // Handle partial derivative
                break;
            // Add cases for other calculus functions
            default:
                throw new Error('Function not implemented');
        }
    } catch (error) {
        handleError(error);
    }
}

function handleStatisticsFunction(func) {
    try {
        switch(func) {
            case 'x̄':
                // Handle mean calculation
                break;
            case 'σ':
                // Handle standard deviation
                break;
            // Add cases for other statistics functions
            default:
                throw new Error('Function not implemented');
        }
    } catch (error) {
        handleError(error);
    }
}

function handleMatricesFunction(func) {
    try {
        switch(func) {
            case '[A]':
                // Handle matrix input
                break;
            case 'det':
                // Handle determinant calculation
                break;
            // Add cases for other matrix functions
            default:
                throw new Error('Function not implemented');
        }
    } catch (error) {
        handleError(error);
    }
}

function switchToCalculusMode() {
    console.log('Switching to Calculus mode');
    clearCalculatorLayout();
    const calculatorCard = document.querySelector('.calculator-card');
    calculatorCard.classList.add('calculus-mode');
    buildCalculusLayout(CALCULUS_MODE_CONFIG.layout);
    updateHelpText(CALCULUS_MODE_CONFIG.helpText);
}

function switchToStatisticsMode() {
    console.log('Switching to Statistics mode');
    clearCalculatorLayout();
    const calculatorCard = document.querySelector('.calculator-card');
    calculatorCard.classList.add('statistics-mode');
    buildStatisticsLayout(STATISTICS_MODE_CONFIG.layout);
    updateHelpText(STATISTICS_MODE_CONFIG.helpText);
}

function switchToMatricesMode() {
    console.log('Switching to Matrices mode');
    clearCalculatorLayout();
    const calculatorCard = document.querySelector('.calculator-card');
    calculatorCard.classList.add('matrices-mode');
    buildMatricesLayout(MATRICES_MODE_CONFIG.layout);
    updateHelpText(MATRICES_MODE_CONFIG.helpText);
}
