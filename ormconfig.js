require("babel-register");
require("babel-polyfill");

// import envConfig from "./config/envConfig";

module.exports = {
  type: "postgres",
  host: "localhost", //envConfig.get("db.host"),
  port: 5432, //envConfig.get("db.port"),
  username: "postgres", //envConfig.get("db.username"),
  password: "qwertyuiop", //envConfig.get("db.password"),
  database: "testing", //envConfig.get("db.database"),
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
