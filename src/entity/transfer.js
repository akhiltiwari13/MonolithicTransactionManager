import { Column, Entity, PrimaryGeneratedColumn } from "typeorm";

@Entity({ name: "transfers" })
export class Transfer {
  @PrimaryGeneratedColumn("varchar", { unique: true })
  tx_id = "testTxId";

  @Column("varchar")
  from = "testFromName";

  @Column("varchar")
  to = "testToName";

  @Column("varchar")
  amount = "testAmount";
}
