import envConfig from "../../config/envConfig";
import * as express from "./express";
import connectDB from "./typeorm";

const start = async () => {
  const port = envConfig.get("port");

  const appStartMessage = () => {
    console.log(`Server is listening on port: ${port}`);
  };

  // Connecting Postgres Database
  try {
    await connectDB();
  } catch (err) {
    console.error("Error while connecting DB =====>", err);
    console.error("<===== Exiting the process =====>");
    process.exit(1);
  }

  const app = express.init();
  app.listen(port, appStartMessage());
};

export default start;
