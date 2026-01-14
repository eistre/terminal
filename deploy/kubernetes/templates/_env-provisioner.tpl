{{- /* Provisioner configuration environment variables */ -}}

{{- /* ConfigMap data */ -}}
{{- define "terminal.env.provisioner.data" -}}
{{- include "terminal.validateEnum" (dict "value" .Values.provisioner.type "allowed" (list "kubernetes") "name" "provisioner.type") -}}
{{- include "terminal.validateEnum" (dict "value" .Values.provisioner.kubernetes.serviceType "allowed" (list "headless" "nodePort") "name" "provisioner.kubernetes.serviceType") -}}
PROVISIONER_TYPE: {{ .Values.provisioner.type | quote }}
PROVISIONER_MAX_RETRIES: {{ .Values.provisioner.maxRetries | quote }}
PROVISIONER_CONCURRENCY_LIMIT: {{ .Values.provisioner.concurrencyLimit | quote }}
PROVISIONER_CONTAINER_EXPIRY_MINUTES: {{ .Values.provisioner.containerExpiryMinutes | quote }}
PROVISIONER_CONTAINER_IMAGE: {{ .Values.provisioner.containerImage | quote }}
PROVISIONER_CONTAINER_MEMORY_REQUEST: {{ .Values.provisioner.container.memoryRequest | quote }}
PROVISIONER_CONTAINER_MEMORY_LIMIT: {{ .Values.provisioner.container.memoryLimit | quote }}
PROVISIONER_CONTAINER_CPU_REQUEST: {{ .Values.provisioner.container.cpuRequest | quote }}
PROVISIONER_CONTAINER_CPU_LIMIT: {{ .Values.provisioner.container.cpuLimit | quote }}
PROVISIONER_KUBERNETES_NAMESPACE: {{ .Release.Namespace | quote }}
PROVISIONER_APP_NAME: {{ include "terminal.name" . | quote }}
PROVISIONER_KUBERNETES_RELEASE_NAME: {{ .Release.Name | quote }}
PROVISIONER_KUBERNETES_SERVICE_TYPE: {{ .Values.provisioner.kubernetes.serviceType | quote }}
{{- end -}}

{{- /* Env var references for deployments */ -}}
{{- define "terminal.env.provisioner" -}}
- name: PROVISIONER_TYPE
  valueFrom:
    configMapKeyRef:
      name: {{ include "terminal.configmap.fullname" . }}
      key: PROVISIONER_TYPE
- name: PROVISIONER_MAX_RETRIES
  valueFrom:
    configMapKeyRef:
      name: {{ include "terminal.configmap.fullname" . }}
      key: PROVISIONER_MAX_RETRIES
- name: PROVISIONER_CONCURRENCY_LIMIT
  valueFrom:
    configMapKeyRef:
      name: {{ include "terminal.configmap.fullname" . }}
      key: PROVISIONER_CONCURRENCY_LIMIT
- name: PROVISIONER_CONTAINER_EXPIRY_MINUTES
  valueFrom:
    configMapKeyRef:
      name: {{ include "terminal.configmap.fullname" . }}
      key: PROVISIONER_CONTAINER_EXPIRY_MINUTES
- name: PROVISIONER_CONTAINER_IMAGE
  valueFrom:
    configMapKeyRef:
      name: {{ include "terminal.configmap.fullname" . }}
      key: PROVISIONER_CONTAINER_IMAGE
- name: PROVISIONER_CONTAINER_MEMORY_REQUEST
  valueFrom:
    configMapKeyRef:
      name: {{ include "terminal.configmap.fullname" . }}
      key: PROVISIONER_CONTAINER_MEMORY_REQUEST
- name: PROVISIONER_CONTAINER_MEMORY_LIMIT
  valueFrom:
    configMapKeyRef:
      name: {{ include "terminal.configmap.fullname" . }}
      key: PROVISIONER_CONTAINER_MEMORY_LIMIT
- name: PROVISIONER_CONTAINER_CPU_REQUEST
  valueFrom:
    configMapKeyRef:
      name: {{ include "terminal.configmap.fullname" . }}
      key: PROVISIONER_CONTAINER_CPU_REQUEST
- name: PROVISIONER_CONTAINER_CPU_LIMIT
  valueFrom:
    configMapKeyRef:
      name: {{ include "terminal.configmap.fullname" . }}
      key: PROVISIONER_CONTAINER_CPU_LIMIT
- name: PROVISIONER_KUBERNETES_NAMESPACE
  valueFrom:
    configMapKeyRef:
      name: {{ include "terminal.configmap.fullname" . }}
      key: PROVISIONER_KUBERNETES_NAMESPACE
- name: PROVISIONER_APP_NAME
  valueFrom:
    configMapKeyRef:
      name: {{ include "terminal.configmap.fullname" . }}
      key: PROVISIONER_APP_NAME
- name: PROVISIONER_KUBERNETES_RELEASE_NAME
  valueFrom:
    configMapKeyRef:
      name: {{ include "terminal.configmap.fullname" . }}
      key: PROVISIONER_KUBERNETES_RELEASE_NAME
- name: PROVISIONER_KUBERNETES_SERVICE_TYPE
  valueFrom:
    configMapKeyRef:
      name: {{ include "terminal.configmap.fullname" . }}
      key: PROVISIONER_KUBERNETES_SERVICE_TYPE
{{- end -}}
