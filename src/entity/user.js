import { Column, Entity, PrimaryGeneratedColumn } from "typeorm";

@Entity({ name: "users" })
export class User {
  @PrimaryGeneratedColumn("varchar", { unique: true })
  name = "";

  @Column("varchar")
  vault_uuid = "testUuid";

  @Column("varchar")
  bts_address = "testBtsAddress";

  @Column("varchar")
  btc_address = "testBtcAddress";

  @Column("varchar")
  eth_address = "testEthAddress";
}
