export interface PublicConfig {
  emailVerificationEnabled: boolean;
  adminEmail: string;
  providers: Record<'microsoft' | 'keycloak' | string, {
    labels: {
      en: string;
      et: string;
    };
  }>;
}
