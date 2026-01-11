export interface PublicConfig {
  emailVerificationEnabled: boolean;
  adminEmail: string;
  microsoft?: {
    labels: {
      en: string;
      et: string;
    };
  };
}
