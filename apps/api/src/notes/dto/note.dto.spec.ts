import { plainToInstance } from 'class-transformer';
import { validateSync } from 'class-validator';
import { CreateNoteDto, UpdateNoteDto } from './note.dto';

const getErrorProps = (dto: object) =>
  validateSync(dto as never).map((error) => error.property);

describe('CreateNoteDto', () => {
  it('requires a name', () => {
    const dto = plainToInstance(CreateNoteDto, {});

    const errors = getErrorProps(dto);

    expect(errors).toContain('name');
  });

  it('accepts optional value and notes', () => {
    const dto = plainToInstance(CreateNoteDto, {
      name: 'GitHub',
      value: 'Any text\nincluding multiple lines',
      notesMd: '# Priorities',
    });

    const errors = getErrorProps(dto);

    expect(errors).toHaveLength(0);
  });
});

describe('UpdateNoteDto', () => {
  it('allows partial updates', () => {
    const dto = plainToInstance(UpdateNoteDto, {});

    const errors = getErrorProps(dto);

    expect(errors).toHaveLength(0);
  });
});
