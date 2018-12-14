export default class createAccount1544709912237 {
  async up(queryRunner) {
    await queryRunner.query(`CREATE TABLE "test01" ("email" character varying NOT NULL)`)
  }

  async down(queryRunner) {}
}
