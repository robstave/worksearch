import { plainToInstance } from 'class-transformer';
import { validateSync } from 'class-validator';
import { UpdateProfileDto } from './update-profile.dto';

const getErrorProps = (dto: object) =>
  validateSync(dto as never).map((error) => error.property);

describe('UpdateProfileDto', () => {
  it('allows empty payload for partial updates', () => {
    const dto = plainToInstance(UpdateProfileDto, {});

    const errors = getErrorProps(dto);

    expect(errors).toHaveLength(0);
  });

  it('accepts valid IANA timezone', () => {
    const dto = plainToInstance(UpdateProfileDto, {
      timezone: 'America/New_York',
    });

    const errors = getErrorProps(dto);

    expect(errors).toHaveLength(0);
  });

  it('rejects invalid timezone strings', () => {
    const dto = plainToInstance(UpdateProfileDto, {
      timezone: 'not-a-real-zone',
    });

    const errors = getErrorProps(dto);

    expect(errors).toContain('timezone');
  });
});
