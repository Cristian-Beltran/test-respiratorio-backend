// src/app/session/services/session.service.ts
import {
  Injectable,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Between, Repository } from 'typeorm';
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

  private dayBounds(base = new Date()) {
    const start = new Date(base);
    start.setHours(0, 0, 0, 0);
    const end = new Date(base);
    end.setHours(23, 59, 59, 999);
    return { start, end };
  }

  private async getOrCreateTodaySession(patient: Patient, device: Device) {
    const { start, end } = this.dayBounds();

    let session = await this.sessionRepo.findOne({
      where: { patient, device, startedAt: Between(start, end) },
      relations: ['patient', 'device'],
    });

    if (!session) {
      session = this.sessionRepo.create({ patient, device });
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

    // Fecha de registro: recordedAt ISO > ts ms > now
    const recordedAt = dto.recordedAt
      ? new Date(dto.recordedAt)
      : dto.ts
        ? new Date(dto.ts)
        : new Date();

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
      recordedAt,
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
