import envConfig from "../../config/envConfig";
import * as express from "./express";

const start = () => {
  const port = envConfig.get("port");

  const appStartMessage = () => {
    console.log(`Server is listening on port: ${port}`);
  };

  const app = express.init();
  app.listen(port, appStartMessage());
};

export default start;
