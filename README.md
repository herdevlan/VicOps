# VicOps

## Sistema de Monitoreo Académico - Backend API

## Descripción

Sistema que permite realizar el seguimiento académico en instituciones educativas, permitiendo registrar calificaciones y visualizar indicadores de rendimiento estudiantil.

## Objetivo general

Desarrollar una API REST para el monitoreo del desempeño académico en educación regular.

## Objetivos específicos (medibles)

- Implementar una API REST con 5 endpoints core funcionando
- Persistir datos en PostgreSQL y probar con Postman
- Implementar autenticación JWT básica

## Alcance

**Incluye:**
- CRUD de usuarios
- CRUD de calificaciones
- Autenticación JWT
- Conexión a base de datos

**No incluye (por ahora):**
- Notificaciones por email
- Roles avanzados
- Reportes en PDF

## Stack tecnológico

- **Backend:** Node.js + Express
- **Base de datos:** PostgreSQL
- **Testing:** Postman
- **Control de versiones:** Git + GitHub

## Arquitectura 

Cliente (Frontend) → API (Backend) → Base de datos

## Endpoints core 

1. POST /api/auth/login
2. POST /api/grades
3. GET /api/grades/student/:id
4. GET /api/reports/dashboard
5. GET /api/users

## Cómo ejecutar el proyecto (local)

1. Clonar repositorio  
   git clone <https://github.com/herdevlan/VicOps.git>  
   cd backend

2. Instalar dependencias  
   npm install

3. Configurar variables de entorno  
   cp .env.example .env

4. Ejecutar servidor  
   npm run dev

## Variables de entorno 

PORT=3000  
DB_USER=usuario  
DB_PASSWORD=password  
DB_NAME=basedatos  
JWT_SECRET=secreto

## Equipo y roles

- Backend: Herlan V. F.