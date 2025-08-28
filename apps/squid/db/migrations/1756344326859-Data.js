module.exports = class Data1756344326859 {
    name = 'Data1756344326859'

    async up(db) {
        await db.query(`CREATE TABLE "breeding_request" ("id" character varying NOT NULL, "request_id" numeric NOT NULL, "amount_paid" numeric NOT NULL, "status" character varying(8) NOT NULL, "tx_id" character varying, "breeder_id" character varying, "parent1_id" character varying, "parent2_id" character varying, CONSTRAINT "PK_b5a7a5263f705262a4fa91240cd" PRIMARY KEY ("id"))`)
        await db.query(`CREATE INDEX "IDX_11e44e97d403c576d9c1c4fa85" ON "breeding_request" ("request_id") `)
        await db.query(`CREATE INDEX "IDX_8935e6e1e528e15bb6e3afe319" ON "breeding_request" ("tx_id") `)
        await db.query(`CREATE INDEX "IDX_374593d69686005bac36b568dd" ON "breeding_request" ("breeder_id") `)
        await db.query(`CREATE INDEX "IDX_4d88cae3162cd458f803722e7a" ON "breeding_request" ("amount_paid") `)
        await db.query(`CREATE INDEX "IDX_7d870b0479e48a89ee74f31ffe" ON "breeding_request" ("parent1_id") `)
        await db.query(`CREATE INDEX "IDX_6add79f5b746b7f2ee9cebc908" ON "breeding_request" ("parent2_id") `)
        await db.query(`CREATE INDEX "IDX_eebd008877cbb5da1d990d0a5a" ON "breeding_request" ("status") `)
        await db.query(`ALTER TABLE "breeding_request" ADD CONSTRAINT "FK_8935e6e1e528e15bb6e3afe3199" FOREIGN KEY ("tx_id") REFERENCES "transaction"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`)
        await db.query(`ALTER TABLE "breeding_request" ADD CONSTRAINT "FK_374593d69686005bac36b568dd5" FOREIGN KEY ("breeder_id") REFERENCES "wallet"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`)
        await db.query(`ALTER TABLE "breeding_request" ADD CONSTRAINT "FK_7d870b0479e48a89ee74f31ffec" FOREIGN KEY ("parent1_id") REFERENCES "nft"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`)
        await db.query(`ALTER TABLE "breeding_request" ADD CONSTRAINT "FK_6add79f5b746b7f2ee9cebc9083" FOREIGN KEY ("parent2_id") REFERENCES "nft"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`)
    }

    async down(db) {
        await db.query(`DROP TABLE "breeding_request"`)
        await db.query(`DROP INDEX "squid"."IDX_11e44e97d403c576d9c1c4fa85"`)
        await db.query(`DROP INDEX "squid"."IDX_8935e6e1e528e15bb6e3afe319"`)
        await db.query(`DROP INDEX "squid"."IDX_374593d69686005bac36b568dd"`)
        await db.query(`DROP INDEX "squid"."IDX_4d88cae3162cd458f803722e7a"`)
        await db.query(`DROP INDEX "squid"."IDX_7d870b0479e48a89ee74f31ffe"`)
        await db.query(`DROP INDEX "squid"."IDX_6add79f5b746b7f2ee9cebc908"`)
        await db.query(`DROP INDEX "squid"."IDX_eebd008877cbb5da1d990d0a5a"`)
        await db.query(`ALTER TABLE "breeding_request" DROP CONSTRAINT "FK_8935e6e1e528e15bb6e3afe3199"`)
        await db.query(`ALTER TABLE "breeding_request" DROP CONSTRAINT "FK_374593d69686005bac36b568dd5"`)
        await db.query(`ALTER TABLE "breeding_request" DROP CONSTRAINT "FK_7d870b0479e48a89ee74f31ffec"`)
        await db.query(`ALTER TABLE "breeding_request" DROP CONSTRAINT "FK_6add79f5b746b7f2ee9cebc9083"`)
    }
}
