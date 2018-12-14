import { createConnection } from "typeorm";

const connectDB = () => {
  return new Promise(async (resolve, reject) => {
    try {
      const connection = await createConnection();
      resolve(connection);
    } catch (err) {
      reject(err);
    }
  });
};

export default connectDB;
