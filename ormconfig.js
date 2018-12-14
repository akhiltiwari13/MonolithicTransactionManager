require("babel-register");
require("babel-polyfill");

module.exports = {
  type: "postgres",
  host: "localhost",
  port: 5432,
  username: "postgres",
  password: "qwertyuiop",
  database: "testing",
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
