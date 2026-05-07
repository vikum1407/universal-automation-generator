export type RtmRequirementType   = 'functional' | 'nonFunctional' | 'technical' | 'regression';
export type RtmPriority          = 'P0' | 'P1' | 'P2' | 'P3';
export type RtmRisk              = 'high' | 'medium' | 'low';
export type RtmRequirementStatus = 'draft' | 'approved' | 'deprecated';

export interface RtmRequirement {
  id:           string;
  rtmVersionId: string;
  key:          string;
  title:        string;
  description:  string;
  type:         RtmRequirementType;
  priority:     RtmPriority;
  risk:         RtmRisk;
  status:       RtmRequirementStatus;
  tags:         string[];
  createdAt:    Date;
  updatedAt:    Date;
}
