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
{{- /* Validate Keycloak OIDC - all 3 fields required or none */ -}}
{{- $keycloakFields := list .Values.auth.keycloak.clientId .Values.auth.keycloak.clientSecret .Values.auth.keycloak.issuer -}}
{{- $keycloakDefined := 0 -}}
{{- range $keycloakFields -}}
  {{- if . -}}
    {{- $keycloakDefined = add1 $keycloakDefined -}}
  {{- end -}}
{{- end -}}
{{- if and (gt $keycloakDefined 0) (lt $keycloakDefined 3) -}}
  {{- fail "Keycloak OIDC requires all 3 fields (clientId, clientSecret, issuer) or none" -}}
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
AUTH_KEYCLOAK_CLIENT_SECRET: {{ .Values.auth.keycloak.clientSecret | quote }}
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
- name: AUTH_KEYCLOAK_CLIENT_SECRET
  valueFrom:
    secretKeyRef:
      name: {{ include "terminal.secret.fullname" . }}
      key: AUTH_KEYCLOAK_CLIENT_SECRET
- name: AUTH_KEYCLOAK_ISSUER
  valueFrom:
    secretKeyRef:
      name: {{ include "terminal.secret.fullname" . }}
      key: AUTH_KEYCLOAK_ISSUER
{{- end }}
{{- end -}}
