import convict from "convict";

const schema = {
  port: {
    doc: "The port exposed for server",
    format: Number,
    default: 5000,
    env: "PORT",
    arg: "port"
  },
  baseUrl: {
    doc: "Contains baseUrl of third party api",
    format: String,
    default: "http://185.208.208.184:5000",
    env: "BASE_URL",
    arg: "base_url"
  }
};

const envConfig = convict(schema);
envConfig.validate({ allowed: "strict" });

export default envConfig;
