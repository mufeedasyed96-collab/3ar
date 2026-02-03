const pino = require('pino');

/**
 * Shared Logger Utility
 * Standardized JSON format for API and Worker
 */
const logger = pino({
    level: process.env.LOG_LEVEL || 'info',
    timestamp: () => `,"ts":"${new Date().toISOString()}"`,
    formatters: {
        level: (label) => {
            return { level: label };
        },
    },
    // Ensure the fields are in the expected order or present
    mixin(_context, level) {
        return {
            service: process.env.SERVICE_NAME || 'api',
        };
    },
});

module.exports = logger;
