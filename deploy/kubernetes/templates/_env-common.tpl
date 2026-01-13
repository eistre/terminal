{{- /* Common environment variables used by all apps */ -}}

{{- /* ConfigMap data */ -}}
{{- define "terminal.env.common.data" -}}
NODE_ENV: {{ required "general.nodeEnv is required" .Values.general.nodeEnv | quote }}
LOGGER_LEVEL: {{ required "general.logLevel is required" .Values.general.logLevel | quote }}
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
