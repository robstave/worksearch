import { plainToInstance } from 'class-transformer';
import { validateSync } from 'class-validator';
import {
  CalendarEventType,
  CreateEventDto,
  UpdateEventDto,
} from './event.dto';

const getErrorProps = (dto: object) =>
  validateSync(dto as never).map((error) => error.property);

describe('CreateEventDto', () => {
  it('requires title and scheduledAt', () => {
    const dto = plainToInstance(CreateEventDto, {});

    const errors = getErrorProps(dto);

    expect(errors).toContain('title');
    expect(errors).toContain('scheduledAt');
  });

  it('accepts valid event payload', () => {
    const dto = plainToInstance(CreateEventDto, {
      title: 'Phone Screen',
      scheduledAt: '2026-10-29T12:00:00.000Z',
      type: CalendarEventType.SCREENING,
      createFollowUp: true,
      followUpAt: '2026-11-05T12:00:00.000Z',
    });

    const errors = getErrorProps(dto);

    expect(errors).toHaveLength(0);
  });

  it('rejects unknown event type', () => {
    const dto = plainToInstance(CreateEventDto, {
      title: 'Screen',
      scheduledAt: '2026-10-29T12:00:00.000Z',
      type: 'RANDOM_EVENT',
    });

    const errors = getErrorProps(dto);

    expect(errors).toContain('type');
  });
});

describe('UpdateEventDto', () => {
  it('allows partial update payload', () => {
    const dto = plainToInstance(UpdateEventDto, {
      confirmed: true,
    });

    const errors = getErrorProps(dto);

    expect(errors).toHaveLength(0);
  });
});
