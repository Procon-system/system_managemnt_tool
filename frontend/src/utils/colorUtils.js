
export const RESERVED_STATUS_COLORS = [
    '#3B82F6', // 'done' (Blue)
    '#22C55E', // 'in_progress' (Green)
    '#F59E0B', // 'pending' (Amber/Yellow)
    '#EF4444', // 'overdue' (Red)
    '#6B7280', // 'impossible' (Gray)
  ];
  
  /**
   * Parses a hex color string (#RRGGBB) into an {r, g, b} object.
   * @param {string} hex - The hex color string.
   * @returns {{r: number, g: number, b: number}}
   */
  function hexToRgb(hex) {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? {
      r: parseInt(result[1], 16),
      g: parseInt(result[2], 16),
      b: parseInt(result[3], 16)
    } : null;
  }
  
  /**
   * Calculates the visual distance between two colors in RGB space.
   * A lower number means the colors are more similar.
   * @param {string} color1 - Hex string for the first color.
   * @param {string} color2 - Hex string for the second color.
   * @returns {number} The distance between the colors.
   */
  function getColorDistance(color1, color2) {
    const rgb1 = hexToRgb(color1);
    const rgb2 = hexToRgb(color2);
  
    if (!rgb1 || !rgb2) return Infinity; // Handle invalid colors gracefully
  
    const r_diff = rgb1.r - rgb2.r;
    const g_diff = rgb1.g - rgb2.g;
    const b_diff = rgb1.b - rgb2.b;
  
    return Math.sqrt(r_diff * r_diff + g_diff * g_diff + b_diff * b_diff);
  }
  
  /**
   * Checks if a color is too close to any color in a reserved list.
   * @param {string} newColor - The hex color to check.
   * @param {string[]} reservedColors - An array of reserved hex colors.
   * @param {number} threshold - The minimum allowed distance. Lower is stricter.
   * @returns {boolean} - True if the color is too close, false otherwise.
   */
  export function isColorReserved(newColor, reservedColors, threshold = 80) {
    for (const reserved of reservedColors) {
      const distance = getColorDistance(newColor, reserved);
      if (distance < threshold) {
        return true; // This color is too similar to a reserved color
      }
    }
    return false;
  }