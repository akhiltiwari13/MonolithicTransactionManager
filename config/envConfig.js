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
  },
  vaultBaseUrl: {
    doc: "Contains baseUrl of vault",
    format: String,
    default: "http://192.168.10.81:8200/v1",
    env: "VAULT_BASE_URL",
    arg: "vault_base_url"
  }
};

const envConfig = convict(schema);
envConfig.validate({ allowed: "strict" });

export default envConfig;
