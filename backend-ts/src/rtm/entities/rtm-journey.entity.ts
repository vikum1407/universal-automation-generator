export interface RtmJourney {
  id:             string;
  rtmVersionId:   string;
  key:            string;
  name:           string;
  description:    string;
  requirementIds: string[];
  createdAt:      Date;
}
