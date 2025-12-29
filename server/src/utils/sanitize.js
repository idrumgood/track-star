/**
 * Sanitizes a string by removing potential HTML tags and trimming whitespace.
 * @param {string} input 
 * @returns {string}
 */
const sanitizeString = (input) => {
    if (typeof input !== 'string') return '';
    // Basic protection: Remove <script> tags and their contents
    let sanitized = input.replace(/<script\b[^>]*>([\s\S]*?)<\/script>/gim, "");
    // Strip other HTML tags
    sanitized = sanitized.replace(/<[^>]*>?/gm, '').trim();
    return sanitized;
};

/**
 * Sanitizes an array of strings.
 * @param {Array} arr 
 * @returns {Array}
 */
const sanitizeArray = (arr) => {
    if (!Array.isArray(arr)) return [];
    return arr.map(item => sanitizeString(item)).filter(item => item !== '');
};

module.exports = {
    sanitizeString,
    sanitizeArray
};
