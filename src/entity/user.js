import { Column, Entity, PrimaryGeneratedColumn } from "typeorm";

@Entity({ name: "users" })
export class User {
  @PrimaryGeneratedColumn("varchar", { unique: true })
  name = "";

  @Column("varchar")
  vault_uuid = "";

  @Column("varchar")
  bts_publickey = "";
}
