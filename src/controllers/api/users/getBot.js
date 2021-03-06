const userServices = require('../../../services/user.js')
const createError = require('../../../util/createError.js')

/**
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 * @param {import('express').NextFunction} next
 */
async function getBot (req, res, next) {
  const config = req.app.get('config')
  const redisClient = req.app.get('redisClient')
  try {
    const userCached = await userServices.getUser(config.bot.clientID, redisClient)
    if (userCached) {
      return res.json(userCached)
    }
    const error = createError(404, 'Bot not found')
    res.status(404).json(error)
  } catch (err) {
    next(err)
  }
}

module.exports = getBot
