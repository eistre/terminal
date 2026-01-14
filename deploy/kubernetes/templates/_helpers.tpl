{{/* Standard Helm helpers */}}

{{- define "terminal.name" -}}
{{- default .Chart.Name .Values.nameOverride | trunc 63 | trimSuffix "-" -}}
{{- end -}}

{{/* Create fully qualified app name, truncated to 63 chars (DNS naming spec) */}}
{{- define "terminal.fullname" -}}
{{- if .Values.fullnameOverride -}}
{{- .Values.fullnameOverride | trunc 63 | trimSuffix "-" -}}
{{- else -}}
{{- $name := default .Chart.Name .Values.nameOverride -}}
{{- if contains $name .Release.Name -}}
{{- .Release.Name | trunc 63 | trimSuffix "-" -}}
{{- else -}}
{{- printf "%s-%s" .Release.Name $name | trunc 63 | trimSuffix "-" -}}
{{- end -}}
{{- end -}}
{{- end -}}

{{- define "terminal.chart" -}}
{{- printf "%s-%s" .Chart.Name .Chart.Version | replace "+" "_" | trunc 63 | trimSuffix "-" -}}
{{- end -}}

{{/* Component fullnames */}}

{{- define "terminal.web.fullname" -}}
{{- printf "%s-web" (include "terminal.fullname" .) | trunc 63 | trimSuffix "-" -}}
{{- end -}}

{{- define "terminal.mariadb.fullname" -}}
{{- printf "%s-mariadb" (include "terminal.fullname" .) | trunc 63 | trimSuffix "-" -}}
{{- end -}}

{{- define "terminal.databaseCleanup.fullname" -}}
{{- printf "%s-database-cleanup" (include "terminal.fullname" .) | trunc 63 | trimSuffix "-" -}}
{{- end -}}

{{- define "terminal.provisionerCleanup.fullname" -}}
{{- printf "%s-provisioner-cleanup" (include "terminal.fullname" .) | trunc 63 | trimSuffix "-" -}}
{{- end -}}

{{- define "terminal.session.fullname" -}}
{{- printf "%s-session" (include "terminal.fullname" .) | trunc 63 | trimSuffix "-" -}}
{{- end -}}

{{- define "terminal.configmap.fullname" -}}
{{- printf "%s-config" (include "terminal.fullname" .) | trunc 63 | trimSuffix "-" -}}
{{- end -}}

{{- define "terminal.secret.fullname" -}}
{{- printf "%s-secret" (include "terminal.fullname" .) | trunc 63 | trimSuffix "-" -}}
{{- end -}}

{{- define "terminal.mariadb.secretFullname" -}}
{{- printf "%s-mariadb-secret" (include "terminal.fullname" .) | trunc 63 | trimSuffix "-" -}}
{{- end -}}

{{/* MariaDB Operator CA bundle secret name (auto-created by operator when tls.enabled: true) */}}

{{- define "terminal.mariadb.caBundleSecretName" -}}
{{- printf "%s-ca-bundle" (include "terminal.mariadb.fullname" .) -}}
{{- end -}}

{{/* Database SSL volume mounts for containers */}}
{{/* Usage: include "terminal.database.ssl.volumeMounts" . | nindent N */}}
{{- define "terminal.database.ssl.volumeMounts" -}}
{{- if .Values.database.ssl.enabled -}}
{{- if or (eq .Values.database.type "operator") .Values.database.ssl.caSecretName -}}
- name: database-ca
  mountPath: /etc/ssl/database/ca.crt
  subPath: ca.crt
  readOnly: true
{{- end -}}
{{- end -}}
{{- end -}}

{{/* Database SSL volumes for pods */}}
{{/* Usage: include "terminal.database.ssl.volumes" . | nindent N */}}
{{- define "terminal.database.ssl.volumes" -}}
{{- if .Values.database.ssl.enabled -}}
{{- if or (eq .Values.database.type "operator") .Values.database.ssl.caSecretName -}}
{{- if eq .Values.database.type "operator" }}
- name: database-ca
  secret:
    secretName: {{ include "terminal.mariadb.caBundleSecretName" . }}
{{- else }}
- name: database-ca
  secret:
    secretName: {{ .Values.database.ssl.caSecretName }}
    items:
      - key: {{ .Values.database.ssl.caSecretKey | default "ca.crt" }}
        path: ca.crt
{{- end -}}
{{- end -}}
{{- end -}}
{{- end -}}

{{/* Label helpers */}}

{{- define "terminal.selectorLabels" -}}
app.kubernetes.io/name: {{ include "terminal.name" . }}
app.kubernetes.io/instance: {{ .Release.Name }}
{{- end -}}

{{- define "terminal.metadata" -}}
helm.sh/chart: {{ include "terminal.chart" . }}
{{- if .Chart.AppVersion }}
app.kubernetes.io/version: {{ .Chart.AppVersion | quote }}
{{- end }}
app.kubernetes.io/managed-by: {{ .Release.Service }}
{{- end -}}

{{- define "terminal.labels" -}}
{{ include "terminal.selectorLabels" . }}
{{ include "terminal.metadata" . }}
{{- end -}}

{{/* Component labels - usage: include "terminal.component.selectorLabels" (dict "context" . "component" "web") */}}

{{- define "terminal.component.selectorLabels" -}}
{{ include "terminal.selectorLabels" .context }}
app.kubernetes.io/component: {{ .component }}
{{- end -}}

{{- define "terminal.component.labels" -}}
{{ include "terminal.component.selectorLabels" . }}
{{ include "terminal.metadata" .context }}
{{- end -}}

{{/* Component label wrappers */}}

{{- define "terminal.web.selectorLabels" -}}
{{ include "terminal.component.selectorLabels" (dict "context" . "component" "web") }}
{{- end -}}

{{- define "terminal.web.labels" -}}
{{ include "terminal.component.labels" (dict "context" . "component" "web") }}
{{- end -}}

{{- define "terminal.mariadb.selectorLabels" -}}
{{ include "terminal.component.selectorLabels" (dict "context" . "component" "database") }}
{{- end -}}

{{- define "terminal.mariadb.labels" -}}
{{ include "terminal.component.labels" (dict "context" . "component" "database") }}
{{- end -}}

{{- define "terminal.databaseCleanup.selectorLabels" -}}
{{ include "terminal.component.selectorLabels" (dict "context" . "component" "database-cleanup") }}
{{- end -}}

{{- define "terminal.databaseCleanup.labels" -}}
{{ include "terminal.component.labels" (dict "context" . "component" "database-cleanup") }}
{{- end -}}

{{- define "terminal.provisionerCleanup.selectorLabels" -}}
{{ include "terminal.component.selectorLabels" (dict "context" . "component" "provisioner-cleanup") }}
{{- end -}}

{{- define "terminal.provisionerCleanup.labels" -}}
{{ include "terminal.component.labels" (dict "context" . "component" "provisioner-cleanup") }}
{{- end -}}

{{- define "terminal.session.selectorLabels" -}}
{{ include "terminal.component.selectorLabels" (dict "context" . "component" "session") }}
{{- end -}}

{{- define "terminal.session.labels" -}}
{{ include "terminal.component.labels" (dict "context" . "component" "session") }}
{{- end -}}

{{/* Service account names */}}

{{- define "terminal.web.serviceAccountName" -}}
{{- if .Values.web.serviceAccount.create -}}
{{- default (include "terminal.web.fullname" .) .Values.web.serviceAccount.name -}}
{{- else -}}
{{- default "default" .Values.web.serviceAccount.name -}}
{{- end -}}
{{- end -}}

{{- define "terminal.provisionerCleanup.serviceAccountName" -}}
{{- if .Values.cronjobs.provisionerCleanup.serviceAccount.create -}}
{{- default (include "terminal.provisionerCleanup.fullname" .) .Values.cronjobs.provisionerCleanup.serviceAccount.name -}}
{{- else -}}
{{- default "default" .Values.cronjobs.provisionerCleanup.serviceAccount.name -}}
{{- end -}}
{{- end -}}

{{/* Database connection helpers */}}

{{- define "terminal.database.host" -}}
{{- if eq .Values.database.type "external" -}}
{{- required "database.host is required when database.type is external" .Values.database.host -}}
{{- else -}}
{{- /* For internal and operator types, use the service name */ -}}
{{- include "terminal.mariadb.fullname" . -}}
{{- end -}}
{{- end -}}

{{- define "terminal.database.port" -}}
{{- .Values.database.port | default 3306 -}}
{{- end -}}

{{/* Enum validation helper - validates that a value is one of the allowed options */}}
{{/* Usage: include "terminal.validateEnum" (dict "value" .Values.foo "allowed" (list "a" "b" "c") "name" "foo") */}}
{{- define "terminal.validateEnum" -}}
{{- if not (has .value .allowed) -}}
{{- fail (printf "%s must be one of: %s (got: %s)" .name (join ", " .allowed) .value) -}}
{{- end -}}
{{- end -}}

{{/* ImagePullPolicy helper - returns pullPolicy or smart default based on tag */}}
{{/* Usage: include "terminal.imagePullPolicy" (dict "pullPolicy" .Values.x.image.pullPolicy "tag" .Values.x.image.tag) */}}
{{- define "terminal.imagePullPolicy" -}}
{{- .pullPolicy | default (ternary "Always" "IfNotPresent" (eq .tag "latest")) -}}
{{- end -}}
