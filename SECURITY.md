# Security Policy

## Supported Versions

| Version | Supported          |
| ------- | ------------------ |
| v0.9.x  | :white_check_mark: |
| < v0.9  | :x:                |

## Reporting a Vulnerability

Si descubres una vulnerabilidad de seguridad en OpenXixón, por favor no la reportes públicamente.

En su lugar, envía un email a **security@openxixon.vodtinker.dev** con:

- Descripción del problema
- Pasos para reproducir
- Impacto potencial
- Sugerencia de mitigación (opcional)

Responderemos en un plazo de **72 horas**. Trataremos el reporte con confidencialidad y te mantendremos informado del progreso.

## Áreas de especial interés

- Inyección SQL en endpoints API
- Bypass de rate limiting o autenticación
- Exposición de datos de usuario (emails, API keys)
- XSS en visualizaciones de datos
- Configuración incorrecta de CORS o CSP

## Seguridad de la base de datos

- Todas las tablas tienen RLS habilitado
- Los datos municipales (`calidad_aire`, `incidencias`, etc.) son públicos por diseño
- Los perfiles de usuario (`profiles`, `alertas`) requieren autenticación
- La API key se genera automáticamente al registrarse

## Reconocimiento

Los reportadores responsables serán agradecidos en el changelog del proyecto.
