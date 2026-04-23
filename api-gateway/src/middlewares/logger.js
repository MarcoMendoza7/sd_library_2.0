const fs = require('fs');
const path = require('path');

const REQUEST_LOG_INTERVAL = 5;
let requestCount = 0;
const logPath = path.join('/app/logs', 'gateway.log');

const loggerMiddleware = (req, res, next) => {
    requestCount++;
    const currentCount = requestCount;
    
    if (currentCount % REQUEST_LOG_INTERVAL === 0) {
        res.on('finish', () => {
            const dateStr = new Date().toISOString();
            const logEntry = `\n[${dateStr}] --- LOG DEV (Petición #${currentCount}) ---\n` +
                             `Petición enviada: ${req.method} ${req.originalUrl}\n` +
                             `Resultado dado: HTTP ${res.statusCode}\n` +
                             `----------------------------------\n`;
                             
            console.log(logEntry);
            
            try {
                fs.appendFileSync(logPath, logEntry);
            } catch(e) {
                console.error("No se pudo escribir el log:", e.message);
            }
        });
    }
    next();
};

module.exports = loggerMiddleware;
