require('dotenv').config()
const express = require('express')
const logger = require('./config/logger')
const cors = require('cors')
const errorHandler = require('./middleware/errorHandler')
const authenticateToken = require('./middleware/auth')
const { handleExpressProxyError, decorateProxyReq} = require('./utils/proxyUtils')
const proxy = require('express-http-proxy')


const app = express()

const PORT = process.env.PORT
const USER_SERVICE_URL = process.env.USER_SERVICE_URL;
const TASK_SERVICE_URL = process.env.TASK_SERVICE_URL

if (!USER_SERVICE_URL || !TASK_SERVICE_URL) {
    logger.error('FATAL ERROR: Service urls {USER_SERVICE_URL, TASK_SERVICE_URL} are not defined in .env file')
    process.exit(1)
}

app.use(cors())
app.use(express.json())

app.use(['/api/users/auth/register', '/api/users/auth/login', '/api/users/auth/refresh'], proxy(USER_SERVICE_URL, {               
    timeout: 30000,
    proxyReqPathResolver: (req) => req.originalUrl,
    proxyErrorHandler: handleExpressProxyError,                
    })
)

app.use('/api/users/auth/logout', authenticateToken, proxy(USER_SERVICE_URL,{
    timeout: 30000,
    proxyReqPathResolver: (req) => req.originalUrl,
    proxyErrorHandler: handleExpressProxyError,
    proxyReqOptDecorator: decorateProxyReq
}))

app.use('/api/tasks', authenticateToken, proxy(TASK_SERVICE_URL,{
    timeout: 30000,
    proxyReqPathResolver: (req) => req.originalUrl,
    proxyErrorHandler: handleExpressProxyError,
    proxyReqOptDecorator: decorateProxyReq
}))

process.on('unhandledRejection', (reason, promise) => {
	logger.error('!!! UNHANDLED REJECTION !!!', {
	  reason: reason instanceof Error ? { message: reason.message, stack: reason.stack } : reason,
	})	
})

process.on('uncaughtException', (error) => {
	logger.error('!!! UNCAUGHT EXCEPTION !!!', {
		message: error.message,
		stack: error.stack,
		name: error.name
	})	
	logger.info('Uncaught exception detected. Shutting down gracefully...')	
	process.exit(1) 
})


app.use(errorHandler)

app.listen(PORT, () => {
    logger.info(`API Gateway listening on port ${PORT}`)
})