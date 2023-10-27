# API de Ejemplo con Node.js, Express y MongoDB

Bienvenido a la documentación de la API de ejemplo construida con Node.js, Express y MongoDB. Esta API proporciona endpoints para gestionar usuarios y lugares.

## Requisitos

- Node.js
- Express
- MongoDB
- Dependencias adicionales (ver "Instalación")

## Instalación

1. Clona este repositorio o descarga el código fuente.
2. Ejecuta `npm install` para instalar las dependencias.

## Configuración

Crea un archivo `.env` en la raíz del proyecto y define las siguientes variables de entorno:

```plaintext
MONGODB_URI= your_mongodb_connection_string
SECRET_KEY= your_secret_key

# Estructura del Proyecto

El proyecto está organizado de la siguiente manera:

- `controllers/` - Controladores que manejan las lógicas de negocio.
  - `places-controller.js` - Controlador para lugares.
  - `users-controller.js` - Controlador para usuarios.
- `middleware/` - Middleware para la autenticación y otras funciones.
  - `check-auth.js` - Middleware para la autenticación de usuarios.
  - `file-upload.js` - Middleware para la carga de archivos.
- `models/` - Definición de modelos de datos.
  - `http-error.js` - Clase personalizada para manejar errores HTTP.
  - `place.js` - Modelo para lugares.
  - `user.js` - Modelo para usuarios.
- `routes/` - Definición de rutas y endpoints de la API.
  - `place-routes.js` - Rutas relacionadas con lugares.
  - `user-routes.js` - Rutas relacionadas con usuarios.
- `app.js` - Archivo principal de la aplicación.

## Uso

- Ejecuta la aplicación con `npm start`.
- Accede a la API en http://localhost:3000 o el puerto que hayas configurado.

## Endpoints

A continuación se detallan los endpoints disponibles en la API:

### Usuarios

- `GET /api/users` - Obtiene la lista de usuarios.
- `POST /api/users/signup` - Registra un nuevo usuario.
- `POST /api/users/login` - Inicia sesión de un usuario.
- `GET /api/users/:userId` - Obtiene información de un usuario específico.

### Lugares

- `GET /api/places/:pid` - Obtiene información de un lugar específico por su ID.
- `GET /api/places/user/:uid` - Obtiene la lista de lugares relacionados con un usuario específico.
- `POST /api/places` - Crea un nuevo lugar.
- `PATCH /api/places/:pid` - Actualiza un lugar existente por su ID.
- `DELETE /api/places/:pid` - Elimina un lugar por su ID.


### Autenticación

La autenticación es necesaria para acceder a las rutas privadas de la API. Se utiliza el middleware `check-auth.js` para verificar la autenticación del usuario antes de permitir el acceso a estas rutas.

Para acceder a las rutas privadas, se requiere un token de autenticación válido. El token se debe incluir en el encabezado de la solicitud HTTP utilizando la clave "Authorization". El formato del encabezado debe ser el siguiente:

Donde `{token}` es el token de autenticación válido generado durante el proceso de inicio de sesión.

Si no se proporciona un token válido o si ocurre algún error durante la verificación, la solicitud será rechazada con un código de estado 403 (Prohibido).

Asegúrate de que todas las rutas privadas en las rutas de lugares (`/api/places`) incluyan el middleware `check-auth` antes de permitir el acceso. Esto garantiza que solo los usuarios autenticados tengan acceso a estas rutas.
