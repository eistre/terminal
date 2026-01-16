{{- /* Mailer environment variables */ -}}

{{- /* ConfigMap data */ -}}
{{- define "terminal.env.mailer.data" -}}
{{- include "terminal.validateEnum" (dict "value" .Values.mailer.type "allowed" (list "noop" "smtp") "name" "mailer.type") -}}
MAILER_TYPE: {{ .Values.mailer.type | quote }}
MAILER_MAX_RETRIES: {{ .Values.mailer.maxRetries | quote }}
MAILER_CONCURRENCY_LIMIT: {{ .Values.mailer.concurrencyLimit | quote }}
MAILER_RESEND_COOLDOWN_SECONDS: {{ .Values.mailer.resendCooldownSeconds | quote }}
{{- if eq .Values.mailer.type "smtp" -}}
  {{- if not .Values.mailer.sender -}}
    {{- fail "mailer.sender is required when mailer.type=smtp" -}}
  {{- end -}}
  {{- if not .Values.mailer.smtp.host -}}
    {{- fail "mailer.smtp.host is required when mailer.type=smtp" -}}
  {{- end -}}
MAILER_SENDER: {{ .Values.mailer.sender | quote }}
MAILER_SMTP_HOST: {{ .Values.mailer.smtp.host | quote }}
MAILER_SMTP_PORT: {{ .Values.mailer.smtp.port | quote }}
MAILER_SMTP_SECURE: {{ .Values.mailer.smtp.secure | quote }}
{{- end -}}
{{- end -}}

{{- /* Secret data */ -}}
{{- define "terminal.env.mailer.secret.data" -}}
{{- /* Validate SMTP auth fields - optional, but must be provided together */ -}}
{{- if eq .Values.mailer.type "smtp" -}}
  {{- if and .Values.mailer.smtp.user (not .Values.mailer.smtp.pass) -}}
    {{- fail "mailer.smtp.pass is required when mailer.smtp.user is set" -}}
  {{- end -}}
  {{- if and .Values.mailer.smtp.pass (not .Values.mailer.smtp.user) -}}
    {{- fail "mailer.smtp.user is required when mailer.smtp.pass is set" -}}
  {{- end -}}
  {{- if .Values.mailer.smtp.user -}}
MAILER_SMTP_USER: {{ .Values.mailer.smtp.user | quote }}
MAILER_SMTP_PASS: {{ .Values.mailer.smtp.pass | quote }}
  {{- end -}}
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
{{- if eq .Values.mailer.type "smtp" }}
- name: MAILER_SENDER
  valueFrom:
    configMapKeyRef:
      name: {{ include "terminal.configmap.fullname" . }}
      key: MAILER_SENDER
- name: MAILER_SMTP_HOST
  valueFrom:
    configMapKeyRef:
      name: {{ include "terminal.configmap.fullname" . }}
      key: MAILER_SMTP_HOST
- name: MAILER_SMTP_PORT
  valueFrom:
    configMapKeyRef:
      name: {{ include "terminal.configmap.fullname" . }}
      key: MAILER_SMTP_PORT
- name: MAILER_SMTP_SECURE
  valueFrom:
    configMapKeyRef:
      name: {{ include "terminal.configmap.fullname" . }}
      key: MAILER_SMTP_SECURE
  {{- if .Values.mailer.smtp.user }}
- name: MAILER_SMTP_USER
  valueFrom:
    secretKeyRef:
      name: {{ include "terminal.secret.fullname" . }}
      key: MAILER_SMTP_USER
- name: MAILER_SMTP_PASS
  valueFrom:
    secretKeyRef:
      name: {{ include "terminal.secret.fullname" . }}
      key: MAILER_SMTP_PASS
  {{- end }}
{{- end }}
{{- end -}}
