# 🌍 Geolocalizador AI - Guía de Instalación y Configuración

## ✅ Cambios Realizados

### Backend (FastAPI)
1. **Sistema de Autenticación JWT completo**
   - Registro de usuarios con validación
   - Login seguro con contraseña hasheada
   - Tokens JWT para proteger endpoints
   - Endpoints protegidos para chat, historial y calificaciones

2. **Nuevos Módulos**
   - `auth.py` - Funciones de cifrado y JWT
   - `auth_models.py` - Modelo de Usuario en BD
   - `auth_schemas.py` - Schemas para autenticación
   - `auth_routes.py` - Rutas de autenticación

3. **Base de Datos**
   - Tabla `users` con autenticación
   - Relación `user_id` en `search_history` y `visited_places`
   - Validaciones de usuario en todos los endpoints

### Frontend (Angular 21)
1. **Componente de Login**
   - Interfaz moderna con Tailwind CSS
   - Toggle entre login y registro
   - Validación de formularios
   - Estilos responsive

2. **Autenticación Completa**
   - `AuthService` - Gestión de tokens y usuario
   - `authGuard` - Protección de rutas
   - Persistencia de sesión en localStorage

3. **Mejoras de UI/UX**
   - Estilos CSS completamente arreglados
   - Animaciones y transiciones suaves
   - Diseño responsive para móvil y desktop
   - Botón de logout en navegación

4. **Actualización de Componentes**
   - Conversión a `signals` (Angular 21)
   - Gestión de estado reactivo
   - Componentes: Chat, History, Ratings, Login

---

## 🚀 Instalación

### Requisitos Previos
- Python 3.8+
- Node.js 18+
- npm o bun

### Backend Setup

```bash
# 1. Navegar al directorio backend
cd backend

# 2. Crear entorno virtual
python -m venv venv

# 3. Activar entorno virtual
# Windows
venv\Scripts\activate
# macOS/Linux
source venv/bin/activate

# 4. Instalar dependencias
pip install -r requirements.txt

# 5. Crear archivo .env (opcional)
# DATABASE_URL=sqlite:///./geo_agent.db

# 6. Ejecutar servidor
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

El servidor estará disponible en: `http://localhost:8000`

### Frontend Setup

```bash
# 1. Navegar al directorio frontend
cd frontend

# 2. Instalar dependencias
npm install
# o si usas bun:
bun install

# 3. Ejecutar servidor de desarrollo
npm start
# o con bun:
bun start

# El app estará disponible en: http://localhost:4200
```

---

## 📝 Primeros Pasos

### Registro e Inicio de Sesión

1. Abre `http://localhost:4200/login`
2. Haz clic en "Registrate" para crear una nueva cuenta
3. Completa el formulario con:
   - Usuario
   - Email
   - Contraseña (mínimo 6 caracteres)
   - Nombre Completo (opcional)
4. Haz clic en "Crear Cuenta"
5. Automáticamente serás redirigido al chat

### Usar la Aplicación

#### Chat
- Escribe tu pregunta sobre lugares
- Permite acceso a geolocalización (necesario)
- Recibirás recomendaciones del agente IA

#### Historial
- Ve todas tus búsquedas anteriores
- Selecciona una para ver detalles
- Elimina búsquedas que no necesites

#### Calificaciones
- Califica lugares que has visitado
- Ve tu calificación promedio
- Agrega comentarios sobre tu experiencia

---

## 🔐 Variables de Entorno

### Backend (.env)
```
DATABASE_URL=sqlite:///./geo_agent.db
SECRET_KEY=your-secret-key-change-in-production
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=30
```

### Frontend (si lo necesitas)
```
API_URL=http://localhost:8000
```

---

## 🛠 Endpoints de la API

### Autenticación
- `POST /api/auth/register` - Registrar nuevo usuario
- `POST /api/auth/login` - Login de usuario
- `GET /api/auth/me` - Obtener usuario actual
- `POST /api/auth/logout` - Logout

### Chat/Búsquedas
- `POST /ask` - Enviar pregunta al agente IA
- `GET /history` - Obtener historial de búsquedas
- `DELETE /history/{id}` - Eliminar una búsqueda

### Calificaciones
- `POST /visited` - Agregar calificación
- `GET /visited` - Obtener todas las calificaciones
- `DELETE /visited/{id}` - Eliminar una calificación

---

## 🎨 Estructura de Carpetas

```
frontend/src/
├── app/
│   ├── core/
│   │   ├── api-service.ts (HTTP requests)
│   │   ├── auth.service.ts (Autenticación)
│   │   └── auth.guard.ts (Protección de rutas)
│   ├── features/
│   │   ├── login/ (Componente de login)
│   │   ├── chat/ (Chat principal)
│   │   ├── history/ (Historial)
│   │   ├── ratings/ (Calificaciones)
│   │   └── components/
│   │       └── place-card/ (Tarjeta de lugar)
│   └── shared/
│       └── models/ (Tipos/Interfaces)
└── styles.css (Estilos globales)

backend/app/
├── main.py (Rutas principales)
├── auth.py (Funciones de autenticación)
├── auth_routes.py (Rutas de autenticación)
├── auth_models.py (Modelo de usuario)
├── auth_schemas.py (Schemas de autenticación)
├── models.py (Modelos de BD)
├── schemas.py (Schemas Pydantic)
├── database.py (Configuración de BD)
├── services/
│   ├── ai_agent.py (Agente IA)
│   └── geo_processor.py (Procesamiento geográfico)
└── requirements.txt (Dependencias)
```

---

## ✨ Características Principales

✅ **Autenticación Segura**
- Contraseñas hasheadas con bcrypt
- Tokens JWT
- Protección de rutas

✅ **Geolocalización**
- Obtención automática de ubicación del usuario
- Conversión a dirección legible
- Búsquedas basadas en ubicación

✅ **Base de Datos**
- SQLite (desarrollo) - fácil de cambiar a PostgreSQL
- Relaciones usuario-búsquedas
- Timestamps en todos los registros

✅ **Interfaz Moderna**
- Diseño con Tailwind CSS
- Responsive (móvil, tablet, desktop)
- Animaciones suaves
- Modo oscuro

✅ **Gestión de Estado Reactivo**
- Signals de Angular 21
- Reactividad sin RxJS complicado
- Sincronización automática de UI

---

## 🐛 Solución de Problemas

### "Error: No autenticado"
- Asegúrate de estar registrado y logueado
- Comprueba que el token se guardó en localStorage
- Recarga la página

### "Error de CORS"
- Verifica que el backend esté corriendo en puerto 8000
- Comprueba que CORS está habilitado en FastAPI

### "Geolocalización no funciona"
- Acepta el permiso de ubicación del navegador
- Usa HTTPS o localhost
- Comprueba que el GPS está habilitado en tu dispositivo

### Base de datos vacía
- Ejecuta el backend una vez para crear las tablas
- La BD se crea automáticamente en `geo_agent.db`

---

## 📦 Dependencias Principales

### Backend
- FastAPI - Framework web
- SQLAlchemy - ORM
- Pydantic - Validación de datos
- python-jose - JWT
- passlib/bcrypt - Seguridad
- geopy - Geolocalización

### Frontend
- Angular 21 - Framework
- Tailwind CSS - Estilos
- RxJS - Reactividad

---

## 📞 Soporte

Si tienes problemas, asegúrate de:
1. Tener todas las dependencias instaladas
2. Ejecutar tanto backend como frontend
3. Usar navegadores modernos (Chrome, Firefox, Edge)
4. Revisar la consola del navegador para errores

---

**¡Disfruta explorando lugares con Geolocalizador AI! 🌍**
