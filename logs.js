var winston = require('winston')
winston.add(winston.transports.File, { filename: 'log.txt' })
winston.remove(winston.transports.Console)
var log = winston.info.bind(winston)
module.exports = log
