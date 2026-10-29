import { plainToInstance } from 'class-transformer';
import { validateSync } from 'class-validator';
import {
  CreateUserDto,
  RoleDto,
  SetPasswordDto,
  UpdateUserDto,
} from './admin-user.dto';

const getErrorProps = (dto: object) =>
  validateSync(dto as never).map((error) => error.property);

describe('CreateUserDto', () => {
  it('requires email and min-length password', () => {
    const dto = plainToInstance(CreateUserDto, {});

    const errors = getErrorProps(dto);

    expect(errors).toContain('email');
    expect(errors).toContain('password');
  });

  it('defaults role to user', () => {
    const dto = plainToInstance(CreateUserDto, {
      email: 'new@worksearch.local',
      password: 'secret12',
    });

    const errors = getErrorProps(dto);

    expect(errors).toHaveLength(0);
    expect(dto.role).toBe(RoleDto.user);
  });

  it('rejects unknown role', () => {
    const dto = plainToInstance(CreateUserDto, {
      email: 'new@worksearch.local',
      password: 'secret12',
      role: 'owner',
    });

    const errors = getErrorProps(dto);

    expect(errors).toContain('role');
  });
});

describe('UpdateUserDto', () => {
  it('allows empty payload for partial update semantics', () => {
    const dto = plainToInstance(UpdateUserDto, {});

    const errors = getErrorProps(dto);

    expect(errors).toHaveLength(0);
  });
});

describe('SetPasswordDto', () => {
  it('enforces minimum password length', () => {
    const dto = plainToInstance(SetPasswordDto, {
      password: '123',
    });

    const errors = getErrorProps(dto);

    expect(errors).toContain('password');
  });
});
