import { Column, Entity, PrimaryGeneratedColumn } from "typeorm";

@Entity({ name: "users" })
export class User {
  @PrimaryGeneratedColumn("varchar", { unique: true })
  name = "testName";

  @Column("varchar")
  vault_uuid = "testUuid";

  @Column("varchar")
  bts_publickey = "testBTSPublickey";
}
