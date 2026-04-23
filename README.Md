# Sistema Distribuido de Gestión de Biblioteca (SD-Library)

### 1. Descripción General

Este proyecto implementa una arquitectura de microservicios para la gestión de una biblioteca digital. El sistema permite la administración de libros y autores mediante el uso de tecnologías heterogéneas, demostrando la interoperabilidad entre diferentes lenguajes de programación y motores de base de datos en un entorno contenedorizado. 

### 2. Arquitectura del Sistema

El sistema se basa en una arquitectura de microservicios compuesta por cuatro componentes principales, cada uno ejecutándose en su propio contenedor aislado:

    * API Gateway (Node.js/Express): Actúa como el punto de entrada único para las peticiones del frontend. Se encarga de redirigir el tráfico hacia el microservicio correspondiente (Libros o Autores), centralizando la lógica de rutas y evitando problemas de CORS.

    * Microservicio de Libros (PHP 8.1/Apache): Gestiona la lógica de negocio relacionada con los libros. Utiliza una base de datos relacional para el almacenamiento.

    * Microservicio de Autores (Go/Gin): Gestiona la información de los autores. Utiliza una base de datos no relacional, optimizando la flexibilidad del esquema de datos.

    * Frontend (React): Interfaz de usuario dinámica que consume los servicios a través del Gateway.

### 3. Infraestructura de Datos

El proyecto utiliza una persistencia políglota, seleccionando el motor de base de datos según la naturaleza del dato:

    * MySQL (Relacional): Utilizado por el Microservicio de Libros. Garantiza la integridad referencial y es ideal para estructuras de datos fijas (ID, título, género, año).

    * MongoDB (No Relacional): Utilizado por el Microservicio de Autores. Permite almacenar documentos JSON flexibles, facilitando la gestión de atributos variables en los perfiles de los autores sin necesidad de migraciones de esquema complejas.

### 4. Definición de Contenedores y Dockerfiles

El despliegue se gestiona mediante Docker, asegurando que el entorno sea idéntico en desarrollo y producción:

    * Dockerfile (PHP/Go/Node): Cada archivo define la imagen base, instala las dependencias necesarias, compila el código (en el caso de Go) y configura los permisos del servidor (mod_rewrite en Apache para PHP).

    * Docker Compose: Coordina el levantamiento de los cinco contenedores (Gateway, Libros, Autores, MySQL y MongoDB), gestiona las redes internas para la comunicación entre servicios y define las variables de entorno para las conexiones de bases de datos.

### 5. Beneficios del Sistema Distribuido

La implementación de este modelo ofrece las siguientes ventajas competitivas:

    * Escalabilidad Independiente: Cada microservicio puede escalar según su demanda. Si el tráfico de búsqueda de libros aumenta, se pueden replicar solo los contenedores de Libros sin afectar al servicio de Autores.

    * Aislamiento de Fallos: Si el servicio de Autores experimenta una caída, el servicio de consulta de Libros puede seguir operando parcialmente, mejorando la disponibilidad general.

    * Flexibilidad Tecnológica: Permite utilizar el lenguaje o base de datos que mejor se adapte a la tarea (PHP para desarrollo rápido de APIs, Go para alto rendimiento en concurrencia).

    * Despliegue Simplificado: Gracias a Docker, el proceso de instalación se reduce a un solo comando, eliminando el problema de "en mi máquina funciona".

### 6. Requisitos de Instalación

Es necesario contar con las siguientes herramientas instaladas:

    * Docker

    * Docker Compose

### 7. Instrucciones de Despliegue

Para poner en marcha el sistema completo, ejecute el siguiente comando en la raíz del proyecto:
Bash

#### docker compose up -d --build

Este comando realizará las siguientes acciones:

    * Construirá las imágenes personalizadas para cada microservicio.

    * Descargará las imágenes oficiales de MySQL y MongoDB.

    * Configurará la red virtual para la comunicación inter-servicios.

    * Iniciará todos los servicios en segundo plano.

### 8. Endpoints Principales (vía API Gateway)

El Gateway escucha en el puerto 3000 y redirige las peticiones de la siguiente manera:

    * Libros: GET/POST/PUT/DELETE a http://localhost:3000/api/libros

    * Autores: GET/POST a http://localhost:3000/api/autores

### 9. Estructura de Archivos

    /api-gateway: Lógica del Proxy Inverso.

    /ms-libros: Código fuente PHP y configuración de Apache.

    /ms-autores: Código fuente en Go.

    /frontend: Aplicación SPA en React.

    docker-compose.yml: Orquestación de toda la infraestructura.