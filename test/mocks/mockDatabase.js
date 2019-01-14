import { getConnection } from "typeorm";
import { Transfer } from "../../src/entity/transfer";
import { User } from "../../src/entity/user";

const users = [
  {
    name: "random01",
    vault_uuid: "bgrjat5gouhsbrsopbs0"
  },
  {
    name: "random02",
    vault_uuid: "bgrjbjdgouhsbrsopbsg"
  }
];

const transactions = [
  {
    txn_id: 'test_bts_confirmed',
    from: 'random01',
    to: 'random02',
    amount: 5000000,
    coin_id: 'BTS',
    txn_status: 'CONFIRMED'
  },
  {
    txn_id: 'test_btc_confirmed',
    from: 'random01',
    to: 'random02',
    amount: 5000000,
    coin_id: 'BTC',
    txn_status: 'CONFIRMED'
  },
  {
    txn_id: 'test_btc_pending',
    from: 'random01',
    to: 'random02',
    amount: 5000000,
    coin_id: 'BTC',
    txn_status: 'PENDING'
  },
  {
    txn_id: 'test_eth_confirmed',
    from: 'random01',
    to: 'random02',
    amount: 5000000,
    coin_id: 'ETH',
    txn_status: 'CONFIRMED'
  },
  {
    txn_id: 'test_eth_pending',
    from: 'random01',
    to: 'random02',
    amount: 5000000,
    coin_id: 'ETH',
    txn_status: 'PENDING'
  },
  {
    txn_id: 'test_eth_failed',
    from: 'random01',
    to: 'random02',
    amount: 5000000,
    coin_id: 'ETH',
    txn_status: 'FAILED'
  },
]

const insertUsers = async () => {
  await getConnection()
    .createQueryBuilder()
    .insert()
    .into(User)
    .values(users)
    .execute();
}

const insertTxns = async () => {
  await getConnection()
    .createQueryBuilder()
    .insert()
    .into(Transfer)
    .values(transactions)
    .execute();
}

const dropUsers = async () => {
  await getConnection()
    .createQueryBuilder()
    .delete()
    .from(User)
    .execute();
}

const dropTxns = async () => {
  await getConnection()
    .createQueryBuilder()
    .delete()
    .from(Transfer)
    .execute();
}

export const seedDatabase = async () => {
  await insertUsers();
  await insertTxns();
}

export const dropDatabase = async () => {
  await dropUsers();
  await dropTxns();
}
