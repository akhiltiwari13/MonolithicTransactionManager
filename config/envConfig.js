import convict from "convict";

const schema = {
  db: {
    host: {
      doc: "Host for Database",
      format: String,
      default: "localhost",
      env: "DB_HOST",
      arg: "db_host"
    },
    port: {
      doc: "Port for Database",
      format: Number,
      default: 5432,
      env: "DB_PORT",
      arg: "db_port"
    },
    username: {
      doc: "Username for Database",
      format: String,
      default: 'postgres',
      env: "DB_USERNAME",
      arg: "db_username"
    },
    password: {
      doc: "Password for Database",
      format: String,
      default: 'qwertyuiop',
      env: "DB_PASSWORD",
      arg: "db_password"
    },
    database: {
      doc: "Name of Database",
      format: String,
      default: 'testing',
      env: "DB_DATABASE",
      arg: "db_database"
    }
  },
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
