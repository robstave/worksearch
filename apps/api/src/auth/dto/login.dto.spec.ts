import { plainToInstance } from 'class-transformer';
import { validateSync } from 'class-validator';
import { LoginDto } from './login.dto';

const getErrorProps = (dto: object) =>
  validateSync(dto as never).map((error) => error.property);

describe('LoginDto', () => {
  it('requires email and password', () => {
    const dto = plainToInstance(LoginDto, {});

    const errors = getErrorProps(dto);

    expect(errors).toContain('email');
    expect(errors).toContain('password');
  });

  it('rejects invalid email format', () => {
    const dto = plainToInstance(LoginDto, {
      email: 'not-an-email',
      password: 'secret',
    });

    const errors = getErrorProps(dto);

    expect(errors).toContain('email');
  });

  it('accepts valid credentials payload', () => {
    const dto = plainToInstance(LoginDto, {
      email: 'demo@worksearch.local',
      password: 'secret',
    });

    const errors = getErrorProps(dto);

    expect(errors).toHaveLength(0);
  });
});
