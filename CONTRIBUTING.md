# Contributing to OpenXixón

Gracias por tu interés en mejorar OpenXixón. Este documento describe cómo contribuir de forma efectiva.

## Cómo contribuir

### 1. Reportar bugs o solicitar features

Abre un issue en GitHub describiendo:
- Qué problema encuentras o qué feature propones
- Pasos para reproducir (si es un bug)
- Comportamiento esperado vs actual
- Stack / navegador / entorno

### 2. Enviar código

1. **Fork** el repositorio
2. Crea una rama descriptiva: `feat/nombre-feature` o `fix/descripcion-bug`
3. Haz commits con mensajes claros siguiendo [Conventional Commits](https://www.conventionalcommits.org/)
4. Abre un **Pull Request** vinculado al issue si existe

### Estilo de código

- TypeScript strict, sin `any` innecesarios
- Astro SSR (`output: 'server'`)
- Componentes Astro para markup estático, islands (`client:only`) para interacción
- Preferir funciones nombradas sobre arrow functions en módulos
- No dejar `console.log` en commits de producción

### Antes de hacer commit

```bash
bun run check
```

Esto ejecuta `astro check` y valida TypeScript.

## Áreas donde se necesita ayuda

- Mejorar accesibilidad (a11y) en gráficos y mapas
- Tests E2E para el flujo de autenticación
- Traducción de la documentación `/docs` al inglés
- Nuevos datasets del Ayuntamiento de Gijón

## Código de conducta

Sé respetuoso. Los datos abiertos son para toda la comunidad.
