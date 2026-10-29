import { plainToInstance } from 'class-transformer';
import { validateSync } from 'class-validator';
import { CreateJobBoardDto, UpdateJobBoardDto } from './job-board.dto';

const getErrorProps = (dto: object) =>
  validateSync(dto as never).map((error) => error.property);

describe('CreateJobBoardDto', () => {
  it('requires a name', () => {
    const dto = plainToInstance(CreateJobBoardDto, {});

    const errors = getErrorProps(dto);

    expect(errors).toContain('name');
  });

  it('accepts optional link and notes', () => {
    const dto = plainToInstance(CreateJobBoardDto, {
      name: 'LinkedIn',
      link: 'https://linkedin.com/jobs',
      notesMd: '# Priorities',
    });

    const errors = getErrorProps(dto);

    expect(errors).toHaveLength(0);
  });
});

describe('UpdateJobBoardDto', () => {
  it('allows partial updates', () => {
    const dto = plainToInstance(UpdateJobBoardDto, {});

    const errors = getErrorProps(dto);

    expect(errors).toHaveLength(0);
  });
});
