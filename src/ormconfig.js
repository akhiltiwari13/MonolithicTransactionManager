module.exports = {
  type: "postgres",
  host: "localhost",
  port: 5432,
  username: "postgres",
  password: "qwertyuiop",
  database: "ankit01",
  logging: false,
  synchronize: false,
  migrationsRun: true,
  entities: ["./entity/*.js"],
  migrations: ["./migration/*.js"],
  subscribers: ["./subscriber/*.js"],
  cli: {
    entitiesDir: "./src/entity",
    migrationsDir: "./src/migration",
    subscribersDir: "./src/subscriber"
  }
};
