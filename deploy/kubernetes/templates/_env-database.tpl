{{- /* Database secret data for mariadb-secret.yaml */ -}}
{{- define "terminal.env.mariadb.secret.data" -}}
{{- include "terminal.validateEnum" (dict "value" .Values.database.type "allowed" (list "internal" "operator" "external") "name" "database.type") -}}
{{- if and .Values.database.ssl.enabled (eq .Values.database.type "internal") -}}
{{- fail "database.ssl.enabled is not supported with database.type: internal. Use 'operator' or 'external' type for TLS support." -}}
{{- end -}}
{{- if ne .Values.database.type "external" }}
MARIADB_ROOT_PASSWORD: {{ required "database.credentials.rootPassword is required" .Values.database.credentials.rootPassword | quote }}
{{- end }}
MARIADB_USER: {{ .Values.database.credentials.user | quote }}
MARIADB_PASSWORD: {{ required "database.credentials.password is required" .Values.database.credentials.password | quote }}
MARIADB_DATABASE: {{ .Values.database.name | quote }}
{{- end -}}

{{- /* MariaDB container environment variables (for mariadb-statefulset.yaml) */ -}}
{{- define "terminal.env.mariadb" -}}
- name: MARIADB_ROOT_PASSWORD
  valueFrom:
    secretKeyRef:
      name: {{ include "terminal.mariadb.secretFullname" . }}
      key: MARIADB_ROOT_PASSWORD
- name: MARIADB_DATABASE
  valueFrom:
    secretKeyRef:
      name: {{ include "terminal.mariadb.secretFullname" . }}
      key: MARIADB_DATABASE
- name: MARIADB_USER
  valueFrom:
    secretKeyRef:
      name: {{ include "terminal.mariadb.secretFullname" . }}
      key: MARIADB_USER
- name: MARIADB_PASSWORD
  valueFrom:
    secretKeyRef:
      name: {{ include "terminal.mariadb.secretFullname" . }}
      key: MARIADB_PASSWORD
{{- end -}}

{{- /* Database connection environment variables (for app containers) */ -}}
{{- define "terminal.env.database" -}}
- name: MARIADB_USER
  valueFrom:
    secretKeyRef:
      name: {{ include "terminal.mariadb.secretFullname" . }}
      key: MARIADB_USER
- name: MARIADB_PASSWORD
  valueFrom:
    secretKeyRef:
      name: {{ include "terminal.mariadb.secretFullname" . }}
      key: MARIADB_PASSWORD
- name: MARIADB_DATABASE
  valueFrom:
    secretKeyRef:
      name: {{ include "terminal.mariadb.secretFullname" . }}
      key: MARIADB_DATABASE
- name: DATABASE_URL
  value: 'mysql://$(MARIADB_USER):$(MARIADB_PASSWORD)@{{ include "terminal.database.host" . }}:{{ include "terminal.database.port" . }}/$(MARIADB_DATABASE)'
{{- if .Values.database.ssl.enabled }}
- name: DATABASE_SSL_ENABLED
  value: 'true'
{{- if or (eq .Values.database.type "operator") .Values.database.ssl.caSecretName }}
- name: DATABASE_SSL_CA
  value: '/etc/ssl/database/ca.crt'
{{- end }}
{{- end }}
{{- end -}}
