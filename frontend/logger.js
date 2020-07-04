class Logger {
  logInfo(message) {
    console.log(`[INFO] ${message}`);
  }

  logWarning(message) {
    console.log(`[WARNING] ${message}`);
  }

  logError(message) {
    console.log(`[ERROR] ${message}`);
  }
}

module.exports = new Logger();
