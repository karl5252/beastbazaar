// Logger.js - Centralized logging system with file rotation
export class Logger {
    constructor() {
        this.logLevel = 'INFO'; // DEBUG, INFO, WARN, ERROR
        this.mode = 'LOUD'; // SILENT (file only) or LOUD (console + file)
        this.logs = [];
        this.maxLogsInMemory = 1000;
        this.currentLogFile = null;
        this.logRotationInterval = 60 * 60 * 1000; // 1 hour in ms

        this.initializeLogger();
    }

    initializeLogger() {
        // Create initial log file
        this.rotateLogFile();

        // Set up automatic log rotation
        setInterval(() => {
            this.rotateLogFile();
        }, this.logRotationInterval);

        // Performance monitoring
        this.startPerformanceMonitoring();

        this.info('Logger initialized', {mode: this.mode, level: this.logLevel});
    }

    rotateLogFile() {
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        this.currentLogFile = `game-log-${timestamp}.txt`;
        this.info(`Log rotated to: ${this.currentLogFile}`);
    }

    formatMessage(level, message, data = null) {
        const timestamp = new Date().toISOString();
        const dataStr = data ? ` | ${JSON.stringify(data)}` : '';
        return `[${timestamp}] [${level}] ${message}${dataStr}`;
    }

    shouldLog(level) {
        const levels = {DEBUG: 0, INFO: 1, WARN: 2, ERROR: 3};
        return levels[level] >= levels[this.logLevel];
    }

    writeToFile(formattedMessage) {
        // In browser environment, we'll store in memory and provide download
        this.logs.push(formattedMessage);

        // Keep memory usage reasonable
        if (this.logs.length > this.maxLogsInMemory) {
            this.logs = this.logs.slice(-this.maxLogsInMemory);
        }
    }

    log(level, message, data = null) {
        if (!this.shouldLog(level)) return;

        const formattedMessage = this.formatMessage(level, message, data);

        // Always write to "file" (memory in browser)
        this.writeToFile(formattedMessage);

        // Console output based on mode
        if (this.mode === 'LOUD') {
            switch (level) {
                case 'DEBUG':
                    console.log(formattedMessage);
                    break;
                case 'INFO':
                    console.info(formattedMessage);
                    break;
                case 'WARN':
                    console.warn(formattedMessage);
                    break;
                case 'ERROR':
                    console.error(formattedMessage);
                    break;
            }
        }
    }

    // Convenience methods
    debug(message, data = null) {
        this.log('DEBUG', message, data);
    }

    info(message, data = null) {
        this.log('INFO', message, data);
    }

    warn(message, data = null) {
        this.log('WARN', message, data);
    }

    error(message, data = null) {
        this.log('ERROR', message, data);
    }

    // Performance monitoring
    startPerformanceMonitoring() {
        setInterval(() => {
            if (window.performance && window.performance.memory) {
                const memory = window.performance.memory;
                this.debug('Performance stats', {
                    fps: this.estimateFPS(),
                    memoryUsed: Math.round(memory.usedJSHeapSize / 1024 / 1024) + 'MB',
                    memoryTotal: Math.round(memory.totalJSHeapSize / 1024 / 1024) + 'MB'
                });
            }
        }, 30000); // Every 30 seconds
    }

    estimateFPS() {
        // Simple FPS estimation - you might want to integrate with Phaser's FPS counter
        return Math.round(1000 / (performance.now() - (this.lastFrameTime || performance.now())));
    }

    // Game-specific logging methods
    logSpawnerEvent(message, spawnData = null) {
        this.info(`[SPAWNER] ${message}`, spawnData);
    }

    logPhysicsEvent(message, physicsData = null) {
        this.info(`[PHYSICS] ${message}`, physicsData);
    }

    logInputEvent(message, inputData = null) {
        this.debug(`[INPUT] ${message}`, inputData);
    }

    logGameplayEvent(message, gameData = null) {
        this.info(`[GAMEPLAY] ${message}`, gameData);
    }

    // Error handling with stack traces
    logError(error, context = 'Unknown') {
        this.error(`[${context}] ${error.message}`, {
            stack: error.stack,
            context: context
        });
    }

    // Export logs for user to send
    exportLogs() {
        const logContent = this.logs.join('\n');
        const blob = new Blob([logContent], {type: 'text/plain'});
        const url = URL.createObjectURL(blob);

        const a = document.createElement('a');
        a.href = url;
        a.download = `game-logs-${new Date().toISOString().split('T')[0]}.txt`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);

        this.info('Logs exported for user');
    }

    // Configuration methods
    setMode(mode) {
        this.mode = mode;
        this.info(`Logger mode changed to: ${mode}`);
    }

    setLevel(level) {
        this.logLevel = level;
        this.info(`Logger level changed to: ${level}`);
    }

    // Get recent logs for crash reporting
    getRecentLogs(count = 50) {
        return this.logs.slice(-count);
    }

    // Clear logs (for privacy)
    clearLogs() {
        this.logs = [];
        this.info('Logs cleared by user');
    }
}

// Create global logger instance
export const logger = new Logger();

// Global error handler
window.addEventListener('error', (event) => {
    logger.logError(event.error, 'Global Error Handler');
});

window.addEventListener('unhandledrejection', (event) => {
    logger.error('Unhandled Promise Rejection', {
        reason: event.reason,
        promise: event.promise
    });
});