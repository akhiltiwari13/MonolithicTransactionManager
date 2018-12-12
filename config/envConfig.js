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
    default: "http://192.168.10.81:11011",
    env: "BASE_URL",
    arg: "base_url"
  }
};

const envConfig = convict(schema);
envConfig.validate({ allowed: "strict" });

export default envConfig;
