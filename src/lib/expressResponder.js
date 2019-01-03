import logger from './logger'
import _ from 'lodash'

const Responder = () => { }

/*
 * This method sends the response to the client.
 */
const sendResponse = (res, status, body) => {
  if (!res.headersSent) {
    if (body) { return res.status(status).json(body) }
    return res.status(status).send()
  } else {
    logger.error('Response already sent.')
  }
}

/*
 * These methods are called to respond to the API user with the information on
 * what is the result of the incomming request
 */
Responder.success = (res, message) => {
  message = _.isString(message) ? { message } : message
  return sendResponse(res, 200, { result: message })
}

Responder.created = (res, object) => {
  return sendResponse(res, 201, object)
}

Responder.deleted = (res) => {
  return sendResponse(res, 204)
}

Responder.operationFailed = (res, reason) => {
  const status = reason.status || 400
  reason = reason.message || 'Reason Unknown'
  return sendResponse(res, status, { reason })
}

export default Responder
