import {
  Inject,
  Injectable,
  InternalServerErrorException,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Status } from 'src/context/shared/models/active.model';
import { Not, Repository } from 'typeorm';
import { UpdateMyProfileDto } from '../dtos/update-user.dto';
import { User } from '../entities/user.entity';
import { UserType } from '../enums/user-type';
@Injectable()
export class UserService {
  constructor(
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
    @Inject(Logger) private readonly logger: Logger,
  ) {}

  // Crear un usuario base
  async existsEmailInClinic(
    email: string,
    excludeId?: string,
  ): Promise<boolean> {
    const existing = await this.userRepo.findOne({
      where: {
        email,
        type: UserType.DOCTOR,
        status: Not(Status.DELETED),
        ...(excludeId ? { id: Not(excludeId) } : {}),
      },
    });
    return !!existing;
  }

  async createBaseUser(data: Partial<User>, type: UserType): Promise<User> {
    try {
      const newUser = this.userRepo.create({
        ...data,
        type,
        status: Status.ACTIVE,
      });
      return await this.userRepo.save(newUser);
    } catch (error) {
      this.logger.error(error);
      throw new InternalServerErrorException('Error al crear el usuario');
    }
  }

  // Buscar uno por ID y tipo
  async findById(id: string): Promise<User> {
    try {
      const user = await this.userRepo.findOne({
        where: { id, status: Not(Status.DELETED) },
      });

      if (!user) {
        throw new NotFoundException(`Usuario con ID ${id} no encontrado`);
      }

      return user;
    } catch (error) {
      throw error;
    }
  }

  async findAll(type: UserType, onlyActive = true): Promise<User[]> {
    try {
      return await this.userRepo.find({
        where: {
          type,
          status: onlyActive ? Status.ACTIVE : Not(Status.DELETED),
        },
      });
    } catch (error) {
      this.logger.error(error);
      throw new InternalServerErrorException('Error al obtener los usuarios');
    }
  }

  // Actualizar datos generales
  async updateUser(id: string, updates: Partial<User>): Promise<User> {
    try {
      const user = await this.findById(id);
      Object.assign(user, updates);
      return await this.userRepo.save(user);
    } catch (error) {
      throw error;
    }
  }

  // Cambiar estado
  async changeStatus(id: string, status: Status): Promise<User> {
    try {
      const user = await this.findById(id);
      user.status = status;
      return await this.userRepo.save(user);
    } catch (error) {
      throw error;
    }
  }

  async softDelete(id: string): Promise<User> {
    return this.changeStatus(id, Status.DELETED);
  }

  async updateMyProfile(id: string, dto: UpdateMyProfileDto): Promise<User> {
    const user = await this.userRepo.findOne({ where: { id } });
    if (!user) throw new NotFoundException('Profile not found');
    Object.assign(user, dto);
    return this.userRepo.save(user);
  }
}
