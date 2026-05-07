export class LinkRequirementToUiFlowDto {
  flowId!:    string;
  strength?:  'primary' | 'secondary';
}

export class UnlinkRequirementFromUiFlowDto {
  flowId!: string;
}
