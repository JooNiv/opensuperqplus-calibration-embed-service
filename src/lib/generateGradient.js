// Generate a gradient based on metric values (worst, best, average)
export const generateMetricGradient = (worstValue, bestValue, averageValue, steps = 1000) => {
    const gradient = [];
    const range = bestValue - worstValue;
    
    // Prevent division by zero
    if (range === 0) {
        // If all values are the same, return a neutral gray color
        const neutralColor = 'rgb(128, 128, 128)';
        return new Array(steps).fill(neutralColor);
    }
    
    // Calculate where the average falls in the range (0 to 1)
    const averagePosition = (averageValue - worstValue) / range;
    
    for (let i = 0; i < steps; i++) {
        const linearRatio = i / (steps - 1); // 0 to 1
        
        // Apply different curves based on whether we're below or above average
        let ratio;
        if (linearRatio <= averagePosition) {
            // Below average: exponential
            const localRatio = linearRatio / averagePosition;
            ratio = Math.pow(localRatio, 2) * averagePosition;
        } else {
            // Above average: logarithmic
            const localRatio = (linearRatio - averagePosition) / (1 - averagePosition);
            ratio = averagePosition + (1 - averagePosition) * Math.sqrt(localRatio);
        }
        
        // Color interpolation: orange (worst) to light blue (average) to dark blue (best)
        let red, green, blue;
        
        if (ratio <= 0.5) {
            // Orange to light blue transition
            const localRatio = ratio * 2; // 0 to 1
            red = Math.round(255 - 125 * localRatio); // 255 to 130 (orange to light blue)
            green = Math.round(165 + 35 * localRatio); // 165 to 200 (orange to light blue)
            blue = Math.round(0 + 255 * localRatio); // 0 to 255 (orange to light blue)
        } else {
            // Light blue to dark blue transition
            const localRatio = (ratio - 0.5) * 2; // 0 to 1
            red = Math.round(130 - 100 * localRatio); // 130 to 30 (light blue to dark blue)
            green = Math.round(200 - 120 * localRatio); // 200 to 80 (light blue to dark blue)
            blue = Math.round(255 - 75 * localRatio); // 255 to 180 (light blue to dark blue)
        }
        
        gradient.push(`rgb(${red}, ${green}, ${blue})`);
    }
    
    return gradient;
};

// Helper function to get color for a specific metric value
export const getColorForMetricValue = (value, worstValue, bestValue, averageValue) => {
    const gradient = generateMetricGradient(worstValue, bestValue, averageValue);
    const range = bestValue - worstValue;
    
    if (range === 0) {
        return gradient[0]; // Return neutral color
    }
    
    // Calculate the position of the value in the range
    const position = Math.max(0, Math.min(1, (value - worstValue) / range));
    const index = Math.floor(position * (gradient.length - 1));
    
    return gradient[index];
};

