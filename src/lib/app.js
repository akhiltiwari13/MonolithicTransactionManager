import envConfig from "../../config/envConfig";
import * as express from "./express";
import logger from './logger'
import initServices from '../services';
import connectDB from "./typeorm";

const start = async () => {
  const port = envConfig.get("port");

  const appStartMessage = () => {
    const env = process.env.NODE_ENV
    logger.debug(`Initializing API`)
    logger.info(`Server Name : ${envConfig.get('app.name')}`)
    logger.info(`Environment : ${envConfig.get('env')}`)
    logger.info(`App Port : ${port}`)
    logger.info(`Process Id : ${process.pid}`)
  }

  // Connecting Postgres Database
  try {
    await connectDB();
  } catch (err) {
    logger.error("<===== Error while connecting DB =====>");
    logger.error(err);
    logger.error("<===== Exiting the process =====>");
    process.exit(1);
  }

  const app = express.init();
  app.listen(port, appStartMessage());


  // Initialize Services
  initServices();
};

export default start;
