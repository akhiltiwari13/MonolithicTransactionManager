import { createConnection } from "typeorm";

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
