export interface RtmVersion {
  id:            string;
  rtmRootId:     string;
  versionNumber: number;
  label:         string | null;
  createdAt:     Date;
  createdBy:     string | null;
}
