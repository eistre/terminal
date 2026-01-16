{{- /* Auth environment variables */ -}}

{{- /* ConfigMap data */ -}}
{{- define "terminal.env.auth.data" -}}
AUTH_USER_EXPIRY_DAYS: {{ .Values.auth.userExpiryDays | quote }}
{{- if .Values.auth.microsoft.labelEn }}
AUTH_MICROSOFT_LABEL_EN: {{ .Values.auth.microsoft.labelEn | quote }}
{{- end }}
{{- if .Values.auth.microsoft.labelEt }}
AUTH_MICROSOFT_LABEL_ET: {{ .Values.auth.microsoft.labelEt | quote }}
{{- end }}
{{- if .Values.auth.keycloak.labelEn }}
AUTH_KEYCLOAK_LABEL_EN: {{ .Values.auth.keycloak.labelEn | quote }}
{{- end }}
{{- if .Values.auth.keycloak.labelEt }}
AUTH_KEYCLOAK_LABEL_ET: {{ .Values.auth.keycloak.labelEt | quote }}
{{- end }}
{{- end -}}

{{- /* Secret data */ -}}
{{- define "terminal.env.auth.secret.data" -}}
{{- /* Validate auth.secret length */ -}}
{{- if lt (len .Values.auth.secret) 32 -}}
{{- fail "auth.secret must be at least 32 characters long (schema requirement from packages/env)" -}}
{{- end -}}
{{- /* Validate Microsoft OIDC - all 3 fields required or none */ -}}
{{- $msftFields := list .Values.auth.microsoft.clientId .Values.auth.microsoft.clientSecret .Values.auth.microsoft.tenantId -}}
{{- $msftDefined := 0 -}}
{{- range $msftFields -}}
  {{- if . -}}
    {{- $msftDefined = add1 $msftDefined -}}
  {{- end -}}
{{- end -}}
{{- if and (gt $msftDefined 0) (lt $msftDefined 3) -}}
  {{- fail "Microsoft OIDC requires all 3 fields (clientId, clientSecret, tenantId) or none" -}}
{{- end -}}
{{- /* Validate Keycloak OIDC - clientId + issuer + (clientSecret or existingSecret+existingSecretKey) */ -}}
{{- $keycloakClientId := .Values.auth.keycloak.clientId -}}
{{- $keycloakIssuer := .Values.auth.keycloak.issuer -}}
{{- $keycloakClientSecret := .Values.auth.keycloak.clientSecret -}}
{{- $keycloakExistingSecret := .Values.auth.keycloak.existingSecret -}}
{{- $keycloakExistingSecretKey := .Values.auth.keycloak.existingSecretKey -}}
{{- $keycloakHasExisting := and $keycloakExistingSecret $keycloakExistingSecretKey -}}
{{- $keycloakHasSecret := or $keycloakClientSecret $keycloakHasExisting -}}
{{- $keycloakAny := or $keycloakClientId $keycloakIssuer $keycloakClientSecret $keycloakExistingSecret $keycloakExistingSecretKey -}}
{{- if and $keycloakAny (not (and $keycloakClientId $keycloakIssuer $keycloakHasSecret)) -}}
  {{- fail "Keycloak OIDC requires clientId, issuer, and either clientSecret or existingSecret+existingSecretKey" -}}
{{- end -}}
{{- if and $keycloakClientSecret $keycloakHasExisting -}}
  {{- fail "Keycloak OIDC: set either clientSecret or existingSecret, not both" -}}
{{- end -}}
AUTH_SECRET: {{ required "auth.secret is required (min 32 characters)" .Values.auth.secret | quote }}
AUTH_ADMIN_EMAIL: {{ required "auth.admin.email is required" .Values.auth.admin.email | quote }}
AUTH_ADMIN_PASSWORD: {{ required "auth.admin.password is required" .Values.auth.admin.password | quote }}
{{- if .Values.auth.microsoft.clientId }}
AUTH_MICROSOFT_CLIENT_ID: {{ .Values.auth.microsoft.clientId | quote }}
AUTH_MICROSOFT_CLIENT_SECRET: {{ .Values.auth.microsoft.clientSecret | quote }}
AUTH_MICROSOFT_TENANT_ID: {{ .Values.auth.microsoft.tenantId | quote }}
{{- end }}
{{- if .Values.auth.keycloak.clientId }}
AUTH_KEYCLOAK_CLIENT_ID: {{ .Values.auth.keycloak.clientId | quote }}
{{- if not .Values.auth.keycloak.existingSecret }}
AUTH_KEYCLOAK_CLIENT_SECRET: {{ .Values.auth.keycloak.clientSecret | quote }}
{{- end }}
AUTH_KEYCLOAK_ISSUER: {{ .Values.auth.keycloak.issuer | quote }}
{{- end }}
{{- end -}}

{{- /* Env var references for deployments */ -}}
{{- define "terminal.env.auth" -}}
- name: AUTH_USER_EXPIRY_DAYS
  valueFrom:
    configMapKeyRef:
      name: {{ include "terminal.configmap.fullname" . }}
      key: AUTH_USER_EXPIRY_DAYS
{{- if .Values.auth.microsoft.labelEn }}
- name: AUTH_MICROSOFT_LABEL_EN
  valueFrom:
    configMapKeyRef:
      name: {{ include "terminal.configmap.fullname" . }}
      key: AUTH_MICROSOFT_LABEL_EN
{{- end }}
{{- if .Values.auth.microsoft.labelEt }}
- name: AUTH_MICROSOFT_LABEL_ET
  valueFrom:
    configMapKeyRef:
      name: {{ include "terminal.configmap.fullname" . }}
      key: AUTH_MICROSOFT_LABEL_ET
{{- end }}
{{- if .Values.auth.keycloak.labelEn }}
- name: AUTH_KEYCLOAK_LABEL_EN
  valueFrom:
    configMapKeyRef:
      name: {{ include "terminal.configmap.fullname" . }}
      key: AUTH_KEYCLOAK_LABEL_EN
{{- end }}
{{- if .Values.auth.keycloak.labelEt }}
- name: AUTH_KEYCLOAK_LABEL_ET
  valueFrom:
    configMapKeyRef:
      name: {{ include "terminal.configmap.fullname" . }}
      key: AUTH_KEYCLOAK_LABEL_ET
{{- end }}
- name: AUTH_SECRET
  valueFrom:
    secretKeyRef:
      name: {{ include "terminal.secret.fullname" . }}
      key: AUTH_SECRET
- name: AUTH_ADMIN_EMAIL
  valueFrom:
    secretKeyRef:
      name: {{ include "terminal.secret.fullname" . }}
      key: AUTH_ADMIN_EMAIL
- name: AUTH_ADMIN_PASSWORD
  valueFrom:
    secretKeyRef:
      name: {{ include "terminal.secret.fullname" . }}
      key: AUTH_ADMIN_PASSWORD
{{- if .Values.auth.microsoft.clientId }}
- name: AUTH_MICROSOFT_CLIENT_ID
  valueFrom:
    secretKeyRef:
      name: {{ include "terminal.secret.fullname" . }}
      key: AUTH_MICROSOFT_CLIENT_ID
- name: AUTH_MICROSOFT_CLIENT_SECRET
  valueFrom:
    secretKeyRef:
      name: {{ include "terminal.secret.fullname" . }}
      key: AUTH_MICROSOFT_CLIENT_SECRET
- name: AUTH_MICROSOFT_TENANT_ID
  valueFrom:
    secretKeyRef:
      name: {{ include "terminal.secret.fullname" . }}
      key: AUTH_MICROSOFT_TENANT_ID
{{- end }}
{{- if .Values.auth.keycloak.clientId }}
- name: AUTH_KEYCLOAK_CLIENT_ID
  valueFrom:
    secretKeyRef:
      name: {{ include "terminal.secret.fullname" . }}
      key: AUTH_KEYCLOAK_CLIENT_ID
{{- if .Values.auth.keycloak.existingSecret }}
- name: AUTH_KEYCLOAK_CLIENT_SECRET
  valueFrom:
    secretKeyRef:
      name: {{ .Values.auth.keycloak.existingSecret | quote }}
      key: {{ .Values.auth.keycloak.existingSecretKey | quote }}
{{- else }}
- name: AUTH_KEYCLOAK_CLIENT_SECRET
  valueFrom:
    secretKeyRef:
      name: {{ include "terminal.secret.fullname" . }}
      key: AUTH_KEYCLOAK_CLIENT_SECRET
{{- end }}
- name: AUTH_KEYCLOAK_ISSUER
  valueFrom:
    secretKeyRef:
      name: {{ include "terminal.secret.fullname" . }}
      key: AUTH_KEYCLOAK_ISSUER
{{- end }}
{{- end -}}
