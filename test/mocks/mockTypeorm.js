import { createConnection } from "typeorm";
import logger from '../../src/lib/logger';
import envConfig from "../../config/envConfig";

const connectDB = () => {
  logger.info("Connecting to test database...")
  return new Promise(async (resolve, reject) => {
    try {
      const connection = await createConnection({
        type: "postgres",
        host: envConfig.get("test_db.host"),
        port: envConfig.get("test_db.port"),
        username: envConfig.get("test_db.username"),
        password: envConfig.get("test_db.password"),
        database: envConfig.get("test_db.database"),
        logging: false,
        synchronize: false,
        migrationsRun: true,
        entities: ["./src/entity/*.js"],
        migrations: ["./src/migration/*.js"],
        subscribers: ["./src/subscriber/*.js"],
        cli: {
          entitiesDir: "./src/entity",
          migrationsDir: "./src/migration",
          subscribersDir: "./src/subscriber"
        }
      });
      resolve(connection);
    } catch (err) {
      logger.error('Could not connect to TypeORM!');
      logger.error(err);
      reject(err);
    }
  });
};

export default connectDB;
