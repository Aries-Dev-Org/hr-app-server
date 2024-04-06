const { createLogger, format, transports } = require('winston');

const loggerInfo = createLogger({
  transports: [
    new transports.File({
      filename: 'logs/info.log',
      level: 'info',
      format: format.combine(
        format.timestamp({ format: 'DD-MM-YYYY HH:mm:ss' }),
        format.align(),
        format.printf(
          (log) => `${[log.timestamp]} - ${log.level}: ${log.message}`
        )
      ),
    }),
  ],
});

module.exports = loggerInfo;
