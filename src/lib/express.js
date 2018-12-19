import express from "express";
import initRoutes from "../routes/index";
import bodyParser from 'body-parser';
import morgan from 'morgan';
import methodOverride from 'method-override';
import logger from './logger';
import compression from 'compression';
import helmet from 'helmet';
import expressBoom from 'express-boom'

// Initialize express app
const app = express();

const initMiddleware = () => {

  // Helmet is a collection of 12 middleware to help set some security headers.
  app.use(helmet())

  // Showing stack errors
  app.set('showStackError', true)

  app.use(expressBoom())

  app.set('trust proxy', 'loopback')

  // Enable jsonp
  app.enable('jsonp callback')

  app.use(function (req, res, next) {
    req.logger = logger
    next()
  })

  // Enable logger (morgan)
  app.use(morgan('combined', { stream: logger.stream }))

  // Environment dependent middleware
  if (process.env.NODE_ENV === 'development') {
    // Disable views cache
    app.set('view cache', false)
  } else if (process.env.NODE_ENV === 'production') {
    app.locals.cache = 'memory'
  }

  // Request body parsing middleware should be above methodOverride
  app.use(bodyParser.urlencoded({
    extended: true
  }))

  app.use(bodyParser.json({ limit: '1000mb' }))

  app.use(methodOverride())

  app.use(compression())
}

export const init = () => {

  // Initialize Express middleware
  initMiddleware();

  // Initialize server routes
  initRoutes(app);

  return app;
}
