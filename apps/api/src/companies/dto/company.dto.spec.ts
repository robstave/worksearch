import { plainToInstance } from 'class-transformer';
import { validateSync } from 'class-validator';
import {
  CreateCompanyDto,
  CreateCompanyVisitDto,
  UpdateCompanyDto,
} from './company.dto';

const getErrorProps = (dto: object) =>
  validateSync(dto as never).map((error) => error.property);

describe('CreateCompanyDto', () => {
  it('requires a non-empty name', () => {
    const dto = plainToInstance(CreateCompanyDto, {});

    const errors = getErrorProps(dto);

    expect(errors).toContain('name');
  });

  it('accepts valid company payload', () => {
    const dto = plainToInstance(CreateCompanyDto, {
      name: 'Acme',
      website: 'https://example.com',
      star: true,
      revisit: false,
    });

    const errors = getErrorProps(dto);

    expect(errors).toHaveLength(0);
  });
});

describe('UpdateCompanyDto', () => {
  it('allows empty payload for partial updates', () => {
    const dto = plainToInstance(UpdateCompanyDto, {});

    const errors = getErrorProps(dto);

    expect(errors).toHaveLength(0);
  });
});

describe('CreateCompanyVisitDto', () => {
  it('accepts optional note and status', () => {
    const dto = plainToInstance(CreateCompanyVisitDto, {
      note: 'Checked careers page',
      status: 'new jobs found',
    });

    const errors = getErrorProps(dto);

    expect(errors).toHaveLength(0);
  });
});
