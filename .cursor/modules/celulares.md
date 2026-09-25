# Módulo: Celulares

Slug: `celulares`

## Qué es

Inventario de móviles corporativos: alta a stock, listado, edición y estados (`activo` / `en_stock` / `baja`).

## Dónde buscar

- `inventario/src/main/java/com/bacarsa/inventario/controller/CelularController.java`
- `inventario/src/main/java/com/bacarsa/inventario/services/CelularService.java`
- `inventario/src/main/java/com/bacarsa/inventario/repository/CelularRepository.java`
- `inventario/src/main/java/com/bacarsa/inventario/models/Celular.java`
- `inventario/src/main/java/com/bacarsa/inventario/models/EstadoCelular.java`
- `inventario/src/main/java/com/bacarsa/inventario/dto/CelularDTO.java`
- `inventario/src/main/java/com/bacarsa/inventario/dto/CelularCreateDTO.java`
- `inventario/src/main/java/com/bacarsa/inventario/mapper/CelularMapper.java`
- `inventario/inventario-front/src/pages/CelularList.jsx`
- `inventario/inventario-front/src/api/celularApi.js`
- `inventario/inventario-front/src/constants/celulares.js`
- `inventario/inventario-front/src/lib/importSchemas/celularesSchema.js`
- `inventario/src/test/java/com/bacarsa/inventario/services/CelularServiceTest.java`
- `inventario/inventario-front/src/hooks/useQueries.js` (`useCelulares`)
- `inventario/inventario-front/src/pages/PerifericosDashboard.jsx` (KPI / link)
- `inventario/inventario-front/src/components/SidebarNav.jsx` (ruta)
- `inventario/inventario-front/src/App.jsx` (ruta `/perifericos/celulares`)
- Colección Firestore: `celulares` (cache `CacheConfig`)

## Qué ver primero (orden)

1. `Celular.java` + `CelularCreateDTO.java` — contrato de campos.
2. `CelularService.java` — validación, create/update con mapa parcial.
3. `CelularList.jsx` — alta, edición, listado y filtros.

## Qué tocar

- Modelo, DTO, mapper, service, repository y controller de celulares.
- UI de `/perifericos/celulares` (`CelularList.jsx`) y API JS (`celularApi.js`, `constants/celulares.js`).
- Import schema de celulares solo para mapear campos nuevos si ya hay import.
- Tests y diagrama de clases si el modelo cambia.

## Qué NO tocar

- Pipeline de PCs, lotes, combos, conciliación, AgenteBacar.
- Stock de periféricos USB / infraestructura (`PerifericoManual*`, `StockPcPipeline`, `StockManualListModals`).
- Auth, dashboard (salvo el conteo de celulares si el DTO cambia y deja de listar), deploy, secretos, CI.
- Otros módulos: televisores, tesorería, cámaras, internos.

## Dependencias

Este módulo usa: catálogo `estados_dispositivo`, Firestore `celulares`.
Este módulo es usado por: dashboard de periféricos (conteo), menú.

## Notas

- Ya existe CRUD. La feat de stock agrega `conCargador` y `condicion` (nuevo/usado); no rehacer el módulo.
- Updates Firestore: merge / mapa parcial para no pisar campos.
- IMEI es la identidad del aparato; duplicados se rechazan.
- `estado` `en_stock` es el default al dar de alta a depósito.
