require("babel-register");
require("babel-polyfill");

const EnvConfig = require("./config/envConfig");
const envConfig = EnvConfig.default;

module.exports = {
  type: "postgres",
  host: envConfig.get("db.host"),
  port: envConfig.get("db.port"),
  username: envConfig.get("db.username"),
  password: envConfig.get("db.password"),
  database: envConfig.get("db.database"),
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
};
