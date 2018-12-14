export class createTransfer1544796164485 {
  async up(queryRunner) {
    await queryRunner.query(
      `CREATE TABLE "transfers" ("tx_id" character varying NOT NULL, "from" character varying NOT NULL, "to" character varying NOT NULL,  "amount" character varying NOT NULL, PRIMARY KEY ("tx_id"))`
    );
  }

  async down(queryRunner) {
    await queryRunner.query(`DROP TABLE "transfers"`);
  }
}
