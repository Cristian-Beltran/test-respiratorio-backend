import { MigrationInterface, QueryRunner } from "typeorm";

export class Migration1761521784014 implements MigrationInterface {
    name = 'Migration1761521784014'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "session_data" ADD "respBaseline" double precision`);
        await queryRunner.query(`ALTER TABLE "session_data" ADD "respDiffAbs" double precision`);
        await queryRunner.query(`ALTER TABLE "session_data" ADD "respRate" integer`);
        await queryRunner.query(`ALTER TABLE "session_data" ADD "spo2" double precision`);
        await queryRunner.query(`ALTER TABLE "session_data" ADD "resp2Adc" double precision`);
        await queryRunner.query(`ALTER TABLE "session_data" ADD "resp2Positive" boolean`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "session_data" DROP COLUMN "resp2Positive"`);
        await queryRunner.query(`ALTER TABLE "session_data" DROP COLUMN "resp2Adc"`);
        await queryRunner.query(`ALTER TABLE "session_data" DROP COLUMN "spo2"`);
        await queryRunner.query(`ALTER TABLE "session_data" DROP COLUMN "respRate"`);
        await queryRunner.query(`ALTER TABLE "session_data" DROP COLUMN "respDiffAbs"`);
        await queryRunner.query(`ALTER TABLE "session_data" DROP COLUMN "respBaseline"`);
    }

}
