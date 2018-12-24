import { Column, Entity, PrimaryGeneratedColumn } from "typeorm";

@Entity({ name: "transactions" })
export class Transfer {
  @PrimaryGeneratedColumn("varchar", { unique: true })
  txn_id = "testTxId";

  @Column("varchar")
  from = "testFromName";

  @Column("varchar")
  to = "testToName";

  @Column("varchar")
  amount = "testAmount";

  @Column("varchar")
  coin_id = "testAmount";

  @Column("varchar")
  txn_status = "testAmount";
}
