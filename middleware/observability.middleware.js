const { v4: uuidv4 } = require('uuid');
const pinoHttp = require('pino-http');
const logger = require('../utils/logger.util');

/**
 * Observability Middleware
 * - Correlation ID generation and tracking
 * - Structured request logging
 */
const correlationMiddleware = (req, res, next) => {
    const correlationId = req.header('x-correlation-id') || uuidv4();
    req.correlationId = correlationId;
    res.setHeader('x-correlation-id', correlationId);
    next();
};

const httpLogger = pinoHttp({
    logger,
    genReqId: (req) => req.correlationId || uuidv4(),
    customProps: (req) => ({
        correlation_id: req.correlationId,
        project_id: req.body?.projectId || req.query?.projectId || null,
    }),
    serializers: {
        req: (req) => ({
            method: req.method,
            url: req.url,
            query: req.query,
            // Avoid logging sensitive body data if needed, or selectively log
        }),
        res: (res) => ({
            statusCode: res.statusCode,
        }),
    },
});

module.exports = {
    correlationMiddleware,
    httpLogger,
};
