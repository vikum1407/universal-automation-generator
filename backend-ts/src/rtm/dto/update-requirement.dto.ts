export class UpdateRequirementDto {
  title?:       string;
  description?: string;
  type?:        'functional' | 'nonFunctional' | 'technical' | 'regression';
  priority?:    'P0' | 'P1' | 'P2' | 'P3';
  risk?:        'high' | 'medium' | 'low';
  status?:      'draft' | 'approved' | 'deprecated';
  tags?:        string[];
}
