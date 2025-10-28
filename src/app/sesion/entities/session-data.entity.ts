import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  Index,
} from 'typeorm';
import { Session } from './session.entity';

@Entity('session_data')
@Index('idx_session_data_recorded_at', ['recordedAt'])
export class SessionData {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => Session, (s) => s.records, { onDelete: 'CASCADE' })
  session: Session;

  // === Respiración primaria ===
  @Column('float', { nullable: true })
  airflowValue: number; // señal filtrada (antes ya existía)

  @Column('float', { nullable: true })
  respBaseline: number;

  @Column('float', { nullable: true })
  respDiffAbs: number;

  @Column('int', { nullable: true })
  respRate: number; // respiraciones/min

  // === Cardiaco / SpO2 ===
  @Column('float', { nullable: true })
  bpm: number;

  @Column('float', { nullable: true })
  spo2: number;

  // === Respiración secundaria ===
  @Column('float', { nullable: true })
  resp2Adc: number;

  @Column({ type: 'boolean', nullable: true })
  resp2Positive: boolean;

  // === Campo legado (por compat si ya lo usabas) ===
  @Column('float', { nullable: true })
  micAirValue: number;

  @Column({ type: 'timestamp' })
  recordedAt: Date;
}
