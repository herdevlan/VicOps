// backend/src/utils/logger.js
const config = require('../config/app_config');

// Definir niveles de log
const levels = {
  error: 0,
  warn: 1,
  info: 2,
  debug: 3
};

const colors = {
  error: '\x1b[31m', // Rojo
  warn: '\x1b[33m',  // Amarillo
  info: '\x1b[36m',  // Cian
  debug: '\x1b[35m', // Magenta
  reset: '\x1b[0m'
};

class Logger {
  constructor() {
    this.level = levels[config.logLevel] || levels.info;
  }

  formatMessage(level, message, meta = {}) {
    const timestamp = new Date().toISOString();
    const levelUpper = level.toUpperCase();
    const color = colors[level] || colors.reset;
    
    let formatted = `${color}[${timestamp}] ${levelUpper}: ${message}${colors.reset}`;
    
    if (Object.keys(meta).length > 0) {
      formatted += `\n${colors.debug}${JSON.stringify(meta, null, 2)}${colors.reset}`;
    }
    
    return formatted;
  }

  log(level, message, meta = {}) {
    if (levels[level] <= this.level) {
      console.log(this.formatMessage(level, message, meta));
    }
  }

  error(message, meta = {}) {
    this.log('error', message, meta);
  }

  warn(message, meta = {}) {
    this.log('warn', message, meta);
  }

  info(message, meta = {}) {
    this.log('info', message, meta);
  }

  debug(message, meta = {}) {
    this.log('debug', message, meta);
  }
}

module.exports = new Logger();