{{- /* Common environment variables used by all apps */ -}}

{{- /* ConfigMap data */ -}}
{{- define "terminal.env.common.data" -}}
{{- include "terminal.validateEnum" (dict "value" .Values.general.nodeEnv "allowed" (list "development" "test" "production") "name" "general.nodeEnv") -}}
{{- include "terminal.validateEnum" (dict "value" .Values.general.logLevel "allowed" (list "error" "warn" "info" "debug" "trace") "name" "general.logLevel") -}}
NODE_ENV: {{ .Values.general.nodeEnv | quote }}
LOGGER_LEVEL: {{ .Values.general.logLevel | quote }}
{{- end -}}

{{- /* Env var references for deployments */ -}}
{{- define "terminal.env.common" -}}
- name: NODE_ENV
  valueFrom:
    configMapKeyRef:
      name: {{ include "terminal.configmap.fullname" . }}
      key: NODE_ENV
- name: LOGGER_LEVEL
  valueFrom:
    configMapKeyRef:
      name: {{ include "terminal.configmap.fullname" . }}
      key: LOGGER_LEVEL
{{- end -}}
