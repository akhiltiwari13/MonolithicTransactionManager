import { createConnection } from "typeorm";
import logger from './logger';

const connectDB = () => {
  return new Promise(async (resolve, reject) => {
    try {
      const connection = await createConnection();
      resolve(connection);
    } catch (err) {
      logger.error('Could not connect to TypeORM!');
      logger.error(err);
      reject(err);
    }
  });
};

export default connectDB;
