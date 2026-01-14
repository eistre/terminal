{{- /* Mailer environment variables */ -}}

{{- /* ConfigMap data */ -}}
{{- define "terminal.env.mailer.data" -}}
{{- include "terminal.validateEnum" (dict "value" .Values.mailer.type "allowed" (list "noop" "azure") "name" "mailer.type") -}}
MAILER_TYPE: {{ .Values.mailer.type | quote }}
MAILER_MAX_RETRIES: {{ .Values.mailer.maxRetries | quote }}
MAILER_CONCURRENCY_LIMIT: {{ .Values.mailer.concurrencyLimit | quote }}
MAILER_RESEND_COOLDOWN_SECONDS: {{ .Values.mailer.resendCooldownSeconds | quote }}
{{- end -}}

{{- /* Secret data */ -}}
{{- define "terminal.env.mailer.secret.data" -}}
{{- /* Validate Azure mailer - required when type=azure */ -}}
{{- if eq .Values.mailer.type "azure" -}}
  {{- if not .Values.mailer.azure.connectionString -}}
    {{- fail "mailer.azure.connectionString is required when mailer.type=azure" -}}
  {{- end -}}
  {{- if not .Values.mailer.azure.sender -}}
    {{- fail "mailer.azure.sender is required when mailer.type=azure" -}}
  {{- end -}}
MAILER_AZURE_CONNECTION_STRING: {{ .Values.mailer.azure.connectionString | quote }}
MAILER_AZURE_SENDER: {{ .Values.mailer.azure.sender | quote }}
{{- end -}}
{{- end -}}

{{- /* Env var references for deployments */ -}}
{{- define "terminal.env.mailer" -}}
- name: MAILER_TYPE
  valueFrom:
    configMapKeyRef:
      name: {{ include "terminal.configmap.fullname" . }}
      key: MAILER_TYPE
- name: MAILER_MAX_RETRIES
  valueFrom:
    configMapKeyRef:
      name: {{ include "terminal.configmap.fullname" . }}
      key: MAILER_MAX_RETRIES
- name: MAILER_CONCURRENCY_LIMIT
  valueFrom:
    configMapKeyRef:
      name: {{ include "terminal.configmap.fullname" . }}
      key: MAILER_CONCURRENCY_LIMIT
- name: MAILER_RESEND_COOLDOWN_SECONDS
  valueFrom:
    configMapKeyRef:
      name: {{ include "terminal.configmap.fullname" . }}
      key: MAILER_RESEND_COOLDOWN_SECONDS
{{- if eq .Values.mailer.type "azure" }}
- name: MAILER_AZURE_CONNECTION_STRING
  valueFrom:
    secretKeyRef:
      name: {{ include "terminal.secret.fullname" . }}
      key: MAILER_AZURE_CONNECTION_STRING
- name: MAILER_AZURE_SENDER
  valueFrom:
    secretKeyRef:
      name: {{ include "terminal.secret.fullname" . }}
      key: MAILER_AZURE_SENDER
{{- end }}
{{- end -}}
