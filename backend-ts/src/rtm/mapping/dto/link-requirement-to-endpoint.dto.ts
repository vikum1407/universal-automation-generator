export class LinkRequirementToEndpointDto {
  discoveredEndpointId!: string;
  strength?:             'primary' | 'secondary';
}
