import {
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import * as bcrypt from 'bcrypt';
import { User } from 'src/app/users/entities/user.entity';
import { UserType } from 'src/app/users/enums/user-type';
import { Repository } from 'typeorm';
import { PayloadToken } from '../shared/models/token.model';
import { LoginDto } from './dtos/login.dto';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User) private userRepository: Repository<User>,
    private jwtService: JwtService,
  ) {}

  async login(loginDto: LoginDto) {
    const user = await this.userRepository.findOne({
      where: { email: loginDto.email },
    });
    if (!user) throw new UnauthorizedException('Invalid access');
    const isMatch = await bcrypt.compare(loginDto.password, user.password);
    if (!isMatch) throw new UnauthorizedException('Invalid access');
    return {
      user,
    };
  }

  async generateJWT(user: User) {
    const payload = this.buildPayload(user);
    return {
      user,
      access_token: this.jwtService.sign(payload, {
        expiresIn: '3d', // ajusta si es necesario
      }),
    };
  }

  async validateUserJwt(id: string) {
    const user = await this.userRepository.findOne({
      where: { id },
    });
    if (!user) throw new UnauthorizedException('Invalid access');
    return {
      ...user,
    };
  }

  verifyMagicLinkToken(token: string): PayloadToken {
    return this.jwtService.verify(token);
  }

  private buildPayload(user: User): PayloadToken {
    return {
      sub: user.id,
      email: user.email,
      type: user.type,
    };
  }
}
