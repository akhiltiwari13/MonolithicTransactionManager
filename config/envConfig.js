import convict from 'convict';

const schema = {
  port: {
    doc: "The port exposed for server",
    format: Number,
    default: 5000,
    env: "PORT",
    arg: "port"
  }
};

const envConfig = convict(schema);
envConfig.validate({ allowed: "strict" });

export default envConfig;
