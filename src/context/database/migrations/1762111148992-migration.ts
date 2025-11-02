import { MigrationInterface, QueryRunner } from "typeorm";

export class Migration1762111148992 implements MigrationInterface {
    name = 'Migration1762111148992'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "session_data" ALTER COLUMN "recordedAt" SET DEFAULT now()`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "session_data" ALTER COLUMN "recordedAt" DROP DEFAULT`);
    }

}
