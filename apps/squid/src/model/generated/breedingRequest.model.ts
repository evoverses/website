import {Entity as Entity_, Column as Column_, PrimaryColumn as PrimaryColumn_, BigIntColumn as BigIntColumn_, Index as Index_, ManyToOne as ManyToOne_} from "@subsquid/typeorm-store"
import {Transaction} from "./transaction.model"
import {Wallet} from "./wallet.model"
import {NFT} from "./nft.model"
import {BreedingStatus} from "./_breedingStatus"

@Entity_()
export class BreedingRequest {
    constructor(props?: Partial<BreedingRequest>) {
        Object.assign(this, props)
    }

    @PrimaryColumn_()
    id!: string

    @Index_()
    @BigIntColumn_({nullable: false})
    requestId!: bigint

    @Index_()
    @ManyToOne_(() => Transaction, {nullable: true})
    tx!: Transaction

    @Index_()
    @ManyToOne_(() => Wallet, {nullable: true})
    breeder!: Wallet

    @Index_()
    @BigIntColumn_({nullable: false})
    amountPaid!: bigint

    @Index_()
    @ManyToOne_(() => NFT, {nullable: true})
    parent1!: NFT

    @Index_()
    @ManyToOne_(() => NFT, {nullable: true})
    parent2!: NFT

    @Index_()
    @Column_("varchar", {length: 8, nullable: false})
    status!: BreedingStatus
}
