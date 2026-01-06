export interface UpsertEmailDomainInput {
  id?: number;
  domain: string;
  skipVerification: boolean;
}

export interface UpsertEmailDomainResult {
  id: number;
}
