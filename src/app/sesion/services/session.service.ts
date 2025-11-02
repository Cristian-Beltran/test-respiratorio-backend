// src/app/session/services/session.service.ts
import {
  Injectable,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Session } from '../entities/session.entity';
import { SessionData } from '../entities/session-data.entity';
import { Device } from '../../device/entities/device.entity';
import { Patient } from 'src/app/users/entities/patient.entity';
import { IngestSessionDto } from '../dtos/session-data.dto';

@Injectable()
export class SessionService {
  constructor(
    @InjectRepository(Session)
    private readonly sessionRepo: Repository<Session>,

    @InjectRepository(SessionData)
    private readonly dataRepo: Repository<SessionData>,

    @InjectRepository(Device) // 🔧 FIX: antes estaba SessionData por error
    private readonly deviceRepo: Repository<Device>,
  ) {}

  private readonly TZ = 'America/La_Paz'; // ajusta si aplica

  private async getOrCreateTodaySession(patient: Patient, device: Device) {
    // Busca la sesión del "día local" en TZ elegida, pero comparando en UTC
    let session = await this.sessionRepo
      .createQueryBuilder('s')
      .leftJoinAndSelect('s.patient', 'patient')
      .leftJoinAndSelect('s.device', 'device')
      .where('s.patientId = :patientId', { patientId: patient.id })
      .andWhere('s.deviceId = :deviceId', { deviceId: device.id })
      // ventana del día (TZ) convertida a UTC:
      .andWhere(
        `s.startedAt >= timezone('UTC', date_trunc('day', now() at time zone :tz))`,
        { tz: this.TZ },
      )
      .andWhere(
        `s.startedAt <  timezone('UTC', date_trunc('day', (now() at time zone :tz) + interval '1 day'))`,
        { tz: this.TZ },
      )
      .getOne();

    if (!session) {
      session = this.sessionRepo.create({
        patient,
        device,
        startedAt: new Date(), // imprescindible
      });
      session = await this.sessionRepo.save(session);
      session = await this.sessionRepo.findOneOrFail({
        where: { id: session.id },
        relations: ['patient', 'device'],
      });
    }
    return session;
  }

  /**
   * Ingesta UNIFICADA:
   * - Busca device por serial.
   * - Reusa/crea sesión del día.
   * - Inserta 1 registro con TODAS las métricas del payload.
   */
  async ingest(dto: IngestSessionDto) {
    if (!dto?.serialNumber) {
      throw new BadRequestException('serialNumber requerido');
    }

    const hasAny =
      dto.airflowValue !== undefined ||
      dto.respBaseline !== undefined ||
      dto.respDiffAbs !== undefined ||
      dto.respRate !== undefined ||
      dto.bpm !== undefined ||
      dto.spo2 !== undefined ||
      dto.resp2Adc !== undefined ||
      dto.resp2Positive !== undefined ||
      dto.micAirValue !== undefined;

    if (!hasAny) {
      throw new BadRequestException(
        'Debe incluir al menos una métrica (airflowValue, respBaseline, respDiffAbs, respRate, bpm, spo2, resp2Adc, resp2Positive o micAirValue)',
      );
    }

    const device = await this.deviceRepo.findOne({
      where: { serialNumber: dto.serialNumber },
      relations: ['patient'],
    });
    if (!device) throw new NotFoundException('Device no encontrado');
    if (!device.patient)
      throw new BadRequestException('Device sin paciente asignado');

    const session = await this.getOrCreateTodaySession(device.patient, device);

    const record = this.dataRepo.create({
      session,
      // Resp primaria
      airflowValue: dto.airflowValue ?? null,
      respBaseline: dto.respBaseline ?? null,
      respDiffAbs: dto.respDiffAbs ?? null,
      respRate: dto.respRate ?? null,
      // HR/SpO2
      bpm: dto.bpm ?? null,
      spo2: dto.spo2 ?? null,
      // Resp secundaria
      resp2Adc: dto.resp2Adc ?? null,
      resp2Positive: dto.resp2Positive ?? null,
      // Legado
      micAirValue: dto.micAirValue ?? null,
      // Timestamp
    });

    const saved = await this.dataRepo.save(record);

    return {
      session: {
        id: session.id,
        patient: { id: session.patient.id },
        device: { id: session.device.id, serialNumber: device.serialNumber },
        startedAt: session.startedAt,
        endedAt: session.endedAt ?? null,
      },
      record: saved,
    };
  }

  async listAllByPatient(patientId: string) {
    const sessions = await this.sessionRepo.find({
      where: { patient: { id: patientId } },
      order: { startedAt: 'DESC' },
      relations: ['patient', 'device', 'records'],
    });
    return sessions;
  }

  async listAll(): Promise<Session[]> {
    return this.sessionRepo.find({
      relations: ['patient', 'patient.user', 'device', 'records'],
      order: { startedAt: 'DESC' },
    });
  }
}
