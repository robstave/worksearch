import { WorkLocationType } from './application.dto';

export interface WorkLocationDistributionItemDto {
  location: WorkLocationType | 'UNSPECIFIED';
  count: number;
}

export interface WorkLocationDistributionDto {
  items: WorkLocationDistributionItemDto[];
  total: number;
}

export interface TagDistributionItemDto {
  tag: string;
  count: number;
}

export interface TagDistributionDto {
  items: TagDistributionItemDto[];
  totalTags: number;
}

export interface HotInterviewItemDto {
  id: string;
  company: string;
  jobTitle: string;
  appliedAt: string | null;
  hotDate: string | null;
}

export interface HotInterviewListDto {
  items: HotInterviewItemDto[];
  total: number;
}
