import express from "express";
import initRoutes from "../routes/index";
import bodyParser from 'body-parser';

// Initialize express app
const app = express();

const initMiddleware = () => {
  app.use(bodyParser.urlencoded({
    extended: true,
  }));

  app.use(bodyParser.json({ type: 'application/json'}));
}

export function init() {

  // Initialize Express middleware
  initMiddleware();

  // Initialize server routes
  initRoutes(app);

  return app;
}
