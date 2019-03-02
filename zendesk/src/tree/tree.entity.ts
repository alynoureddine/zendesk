import { Entity, Column, PrimaryGeneratedColumn } from 'typeorm';

@Entity('Branches')
export class TreeEntity {
    @PrimaryGeneratedColumn() branch_id: number;

    @Column({ nullable: true }) parent_id: number;

    @Column({ nullable: true }) text: string;

    @Column({ nullable: true }) button: string;

}
