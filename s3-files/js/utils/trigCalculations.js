export const trigCalculations = {
    sin: (value, isRadians) => {
        const radians = isRadians ? value : (value * Math.PI / 180);
        return Math.sin(radians);
    },
    cos: (value, isRadians) => {
        const radians = isRadians ? value : (value * Math.PI / 180);
        return Math.cos(radians);
    },
    // ... other trig functions
};

// Error handling and validation
export const trigValidation = {
    validateDomain: (func, value) => {
        // Domain validation for different trig functions
        switch(func) {
            case 'sin⁻¹':
            case 'cos⁻¹':
                return value >= -1 && value <= 1;
            // ... other validations
        }
    }
};