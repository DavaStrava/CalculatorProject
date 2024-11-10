export const TRIG_MODE_CONFIG = {
    name: 'trigonometry',
    layout: [
        ['sin', 'cos', 'tan', 'C'],
        ['sin⁻¹', 'cos⁻¹', 'tan⁻¹', '÷'],
        ['sinh', 'cosh', 'tanh', '×'],
        ['π', 'rad', '=', '+'],
        ['(', ')', '.', '-']
    ],
    functions: ['sin', 'cos', 'tan', 'sin⁻¹', 'cos⁻¹', 'tan⁻¹', 'sinh', 'cosh', 'tanh'],
    helpText: {
        'sin': 'Calculate sine (input in current angle mode)',
        'cos': 'Calculate cosine (input in current angle mode)',
        'tan': 'Calculate tangent (input in current angle mode)',
        // ... more help text
    }
};