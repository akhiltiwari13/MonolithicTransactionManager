export class createUsers1544792105691 {
  async up(queryRunner) {
    await queryRunner.query(
      `CREATE TABLE "users" ("name" character varying NOT NULL, "vault_uuid" character varying NOT NULL, PRIMARY KEY ("name"))`
    );
  }

  async down(queryRunner) {
    await queryRunner.query(`DROP TABLE "users"`);
  }
}
