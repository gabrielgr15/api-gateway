require('dotenv').config()
const redis = require('redis')
const logger = require('../config/logger')

const redisClient = redis.createClient({
    url: process.env.REDIS_URL
});

(async () => {
    try{
        redisClient.on('error', error => {logger.error('Redis client error: ', error)})
        await redisClient.connect()
        logger.info('Connected to Redis succesfully')
    }catch(error){
        logger.error('Failed to connect to Redis', error)
    }
})()

module.exports = redisClient