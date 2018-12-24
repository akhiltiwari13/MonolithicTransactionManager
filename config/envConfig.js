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
  app: {
    name: {
      doc: 'Howdoo Blockchain Service',
      format: String,
      default: 'Howdoo Blockchain Service'
    }
  },
  env: {
    doc: 'The application environment.',
    format: ['production', 'development', 'staging', 'test'],
    default: 'development',
    env: 'NODE_ENV',
    arg: "node_env"
  },
  log_level: {
    doc: 'level of logs to show',
    format: String,
    default: 'debug',
    env: 'LOG_LEVEL'
  },
  port: {
    doc: "The port exposed for server",
    format: Number,
    default: 5000,
    env: "PORT",
    arg: "port"
  },
  btsBaseUrl: {
    doc: "Contains baseUrl for BTS third party api",
    format: String,
    default: "http://192.168.10.81:11011",
    env: "BTS_BASE_URL",
    arg: "bts_base_url"
  },
  btcMainBaseUrl: {
    doc: "Contains baseUrl for BTC third party api",
    format: String,
    default: "https://insight.bitpay.com/api",
    env: "BTC_MAIN_BASE_URL",
    arg: "btc_main_base_url"
  },
  btcTestBaseUrl: {
    doc: "Contains baseUrl for BTC third party api",
    format: String,
    default: "https://test-insight.bitpay.com/api",
    env: "BTC_TEST_BASE_URL",
    arg: "btc_test_base_url"
  },
  priceBaseUrl: {
    doc: "Contains baseUrl to get price from third party api",
    format: String,
    default: "https://min-api.cryptocompare.com",
    env: "PRICE_BASE_URL",
    arg: "price_base_url"
  },
  vaultBaseUrl: {
    doc: "Contains baseUrl of vault",
    format: String,
    default: "http://192.168.10.81:8200/v1",
    env: "VAULT_BASE_URL",
    arg: "vault_base_url"
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
