import { Column, Entity, PrimaryGeneratedColumn } from "typeorm";

@Entity({ name: 'accounts' })
export class Account {
  @PrimaryGeneratedColumn("uuid")
  id = undefined;

  @Column("varchar", { unique: true })
  name = "";

  @Column("varchar")
  surname = "";
}
