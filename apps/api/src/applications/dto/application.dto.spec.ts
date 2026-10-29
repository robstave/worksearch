import { plainToInstance } from 'class-transformer';
import { validateSync } from 'class-validator';
import {
  AppState,
  CreateApplicationDto,
  MoveApplicationDto,
  UpdateApplicationDto,
  WorkLocationType,
} from './application.dto';

const getErrorProps = (dto: object) =>
  validateSync(dto as never).map((error) => error.property);

describe('CreateApplicationDto', () => {
  it('requires companyId and jobTitle', () => {
    const dto = plainToInstance(CreateApplicationDto, {});

    const errors = getErrorProps(dto);

    expect(errors).toContain('companyId');
    expect(errors).toContain('jobTitle');
  });

  it('accepts a valid payload', () => {
    const dto = plainToInstance(CreateApplicationDto, {
      companyId: 'company-1',
      jobTitle: 'Software Engineer',
      workLocation: WorkLocationType.REMOTE,
      initialState: AppState.INTERESTED,
      easyApply: true,
    });

    const errors = getErrorProps(dto);

    expect(errors).toHaveLength(0);
  });

  it('rejects invalid enum values', () => {
    const dto = plainToInstance(CreateApplicationDto, {
      companyId: 'company-1',
      jobTitle: 'Role',
      workLocation: 'INVALID',
    });

    const errors = getErrorProps(dto);

    expect(errors).toContain('workLocation');
  });
});

describe('MoveApplicationDto', () => {
  it('requires toState', () => {
    const dto = plainToInstance(MoveApplicationDto, {});

    const errors = getErrorProps(dto);

    expect(errors).toContain('toState');
  });

  it('rejects unknown transition state', () => {
    const dto = plainToInstance(MoveApplicationDto, {
      toState: 'NOT_A_STATE',
    });

    const errors = getErrorProps(dto);

    expect(errors).toContain('toState');
  });
});

describe('UpdateApplicationDto', () => {
  it('allows empty payload for partial update semantics', () => {
    const dto = plainToInstance(UpdateApplicationDto, {});

    const errors = getErrorProps(dto);

    expect(errors).toHaveLength(0);
  });
});
