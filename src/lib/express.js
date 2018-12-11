import express from "express";
import initRoutes from "../routes/index";

// Initialize express app
const app = express();

export function init() {
  // Initialize server routes
  initRoutes(app);

  return app;
}
