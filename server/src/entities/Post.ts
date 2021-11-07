import {BaseEntity, Column, CreateDateColumn, Entity, PrimaryGeneratedColumn, UpdateDateColumn} from "typeorm"


@Entity() // db table
export class Post extends BaseEntity {
    @PrimaryGeneratedColumn()
    id!: number

    @Column()
    title!: string
    
    @Column()
    text!: string

    @CreateDateColumn()
    createdAt: Date 

    @UpdateDateColumn()
    updatedAt: Date

}