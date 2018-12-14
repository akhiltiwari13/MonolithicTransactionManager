import { createConnection } from "typeorm";

export function connect(cb) {
  console.log("==========================================");
  return createConnection({
    type: "postgres",
    host: "localhost",
    port: 5432,
    username: "postgres",
    password: "qwertyuiop",
    database: "ankit01",
    logging: false,
    synchronize: false,
    migrationsRun: true,
    entities: ["./dist/src/entity/**/*.js"],
    migrations: ["./dist/src/migration/**/*.js"],
    subscribers: ["./dist/src/subscriber/**/*.js"],
    cli: {
      entitiesDir: "./src/entity",
      migrationsDir: "./src/migration",
      subscribersDir: "./src/subscriber"
    }
  })
    .then(res => {
      console.log(res);
      return cb();
    })
    .catch(err => cb(err));
}

// export const disconnect = cb => {
//   mongoose.disconnect(err => {
//     console.log("Disconnected from Postgres.");
//     cb(err);
//   });
// };
