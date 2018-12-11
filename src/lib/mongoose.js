import mongoose from "mongoose";
import bluebird from "bluebird";

export function connect(cb) {
  const uri = "mongodb://localhost:27017/howdoo_blockchain_services_test";
  const options = {
    useNewUrlParser: true
  };
  mongoose.Promise = bluebird;
  mongoose.connect(
    uri,
    options,
    err => {
      if (err) {
        console.log("Could not connect to MongoDB!");
        console.log(err);
      } else {
        if (cb) cb();
      }
    }
  );
}

export const disconnect = cb => {
  mongoose.disconnect(err => {
    console.log("Disconnected from MongoDB.");
    cb(err);
  });
};
