export class createTransfer1544796164485 {
  async up(queryRunner) {
    await queryRunner.query(
      `CREATE TABLE "transactions" ("txn_id" character varying NOT NULL, "from" character varying NOT NULL, "to" character varying NOT NULL,  "amount" character varying NOT NULL, "coin_id" character varying NOT NULL, "txn_status" character varying NOT NULL, PRIMARY KEY ("txn_id"))`
    );
  }

  async down(queryRunner) {
    await queryRunner.query(`DROP TABLE "transfers"`);
  }
}
