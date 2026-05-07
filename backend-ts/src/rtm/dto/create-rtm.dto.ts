export class CreateRtmDto {
  projectId: string;
  label?:    string;   // label for the first version
  createdBy?: string;
}

export class CreateRequirementDto {
  key:          string;
  title:        string;
  description?: string;
  type?:        'functional' | 'nonFunctional' | 'technical' | 'regression';
  priority?:    'P0' | 'P1' | 'P2' | 'P3';
  risk?:        'high' | 'medium' | 'low';
  status?:      'draft' | 'approved' | 'deprecated';
  tags?:        string[];
}

export class CreateJourneyDto {
  key:             string;
  name:            string;
  description?:    string;
  requirementIds?: string[];
}

export class CreateEndpointDto {
  key:             string;
  method:          'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  path:            string;
  serviceName?:    string;
  description?:    string;
  requirementIds?: string[];
}
