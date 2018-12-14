import envConfig from "../../config/envConfig";
import * as express from "./express";
import * as typeorm from "./typeorm";

const start = () => {
  const port = envConfig.get("port");

  const appStartMessage = () => {
    console.log(`Server is listening on port: ${port}`);
  };

  typeorm.connect(() => {
    console.log('*************************************')
    const app = express.init();
    app.listen(port, appStartMessage());
  });
};

export default start;
