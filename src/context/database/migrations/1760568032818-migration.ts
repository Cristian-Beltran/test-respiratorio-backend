import { MigrationInterface, QueryRunner } from "typeorm";

export class Migration1760568032818 implements MigrationInterface {
    name = 'Migration1760568032818'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "session_data" DROP CONSTRAINT "FK_3f0a377247128b3d22355f0bc0c"`);
        await queryRunner.query(`ALTER TABLE "session_data" DROP COLUMN "lungCapacity"`);
        await queryRunner.query(`ALTER TABLE "session_data" DROP COLUMN "pulse"`);
        await queryRunner.query(`ALTER TABLE "session_data" DROP COLUMN "oxygenSaturation"`);
        await queryRunner.query(`ALTER TABLE "session_data" ADD "airflowValue" double precision`);
        await queryRunner.query(`ALTER TABLE "session_data" ADD "bpm" double precision`);
        await queryRunner.query(`ALTER TABLE "session_data" ADD "micAirValue" double precision`);
        await queryRunner.query(`ALTER TABLE "session_data" ALTER COLUMN "recordedAt" DROP DEFAULT`);
        await queryRunner.query(`CREATE INDEX "idx_session_data_recorded_at" ON "session_data" ("recordedAt") `);
        await queryRunner.query(`ALTER TABLE "session_data" ADD CONSTRAINT "FK_3f0a377247128b3d22355f0bc0c" FOREIGN KEY ("sessionId") REFERENCES "sessions"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "session_data" DROP CONSTRAINT "FK_3f0a377247128b3d22355f0bc0c"`);
        await queryRunner.query(`DROP INDEX "public"."idx_session_data_recorded_at"`);
        await queryRunner.query(`ALTER TABLE "session_data" ALTER COLUMN "recordedAt" SET DEFAULT now()`);
        await queryRunner.query(`ALTER TABLE "session_data" DROP COLUMN "micAirValue"`);
        await queryRunner.query(`ALTER TABLE "session_data" DROP COLUMN "bpm"`);
        await queryRunner.query(`ALTER TABLE "session_data" DROP COLUMN "airflowValue"`);
        await queryRunner.query(`ALTER TABLE "session_data" ADD "oxygenSaturation" integer NOT NULL`);
        await queryRunner.query(`ALTER TABLE "session_data" ADD "pulse" integer NOT NULL`);
        await queryRunner.query(`ALTER TABLE "session_data" ADD "lungCapacity" double precision NOT NULL`);
        await queryRunner.query(`ALTER TABLE "session_data" ADD CONSTRAINT "FK_3f0a377247128b3d22355f0bc0c" FOREIGN KEY ("sessionId") REFERENCES "sessions"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

}
