# 🚀 Guía Rápida de Inicio - Geolocalizador AI

## ⚡ Inicio Rápido (5 minutos)

### 1️⃣ Abrir 2 Terminales

**Terminal 1 - Backend:**
```bash
cd backend
python -m venv venv
venv\Scripts\activate  # o: source venv/bin/activate en Linux/Mac
pip install -r requirements.txt
uvicorn app.main:app --reload
```

**Terminal 2 - Frontend:**
```bash
cd frontend
npm install
npm start
```

### 2️⃣ Abrir en el Navegador
```
http://localhost:4200/login
```

---

## 📝 Crear Cuenta

1. Haz clic en **"Registrate"**
2. Completa el formulario:
   - **Usuario:** tu_usuario
   - **Email:** tu@email.com
   - **Contraseña:** mínimo 6 caracteres
   - **Nombre (opcional)**
3. Haz clic en **"Crear Cuenta"**
4. ¡Automáticamente vas al chat! 🎉

---

## 💬 Usar la App

### Chat
- Escribe una pregunta sobre lugares
- Permite acceso a tu ubicación (GPS)
- Recibirás recomendaciones del IA

**Ejemplos:**
- "¿Dónde hay buenos restaurantes?"
- "Muéstrame cafeterías cerca"
- "¿Hay museos interesantes?"

### Historial
- Ve todas tus búsquedas anteriores
- Selecciona una para ver detalles
- Elimina si lo necesitas

### Calificaciones
- Califica lugares que visitaste
- Ve tu puntuación promedio
- Deja comentarios

---

## 🔐 Funciones de Seguridad

✅ **Autenticación JWT** - Token seguro por 30 minutos
✅ **Contraseñas Hasheadas** - Cifrado con bcrypt
✅ **Datos Privados** - Solo ves tus propios datos
✅ **Sesión Persistente** - Se guarda en el navegador

---

## ❌ Si Algo No Funciona

### "No carga la página"
- ¿Backend en `http://localhost:8000`?
- ¿Frontend en `http://localhost:4200`?
- ¿Ambos terminales activos?

### "Error de autenticación"
- Crea una cuenta nueva
- Recarga la página (F5)
- Vacía el localStorage del navegador

### "Geolocalización no funciona"
- Acepta el permiso del navegador
- Comprueba que GPS está habilitado
- Usa localhost o HTTPS

### "Error de base de datos"
- Elimina `backend/geo_agent.db`
- Reinicia el backend
- Se crea automáticamente

---

## 📂 Archivos Importantes

**Backend:**
- `backend/app/auth.py` - Lógica de seguridad
- `backend/app/main.py` - Endpoints
- `backend/requirements.txt` - Dependencias

**Frontend:**
- `frontend/src/app/core/auth.service.ts` - Servicio de login
- `frontend/src/app/features/` - Componentes
- `frontend/src/styles.css` - Estilos globales

---

## 🎨 Customización

### Cambiar Color del Logo
En `frontend/src/app/app.html` busca `<span class="text-2xl">🌍</span>` y cambia el emoji

### Cambiar Tiempo de Sesión
En `backend/app/auth.py` cambia `ACCESS_TOKEN_EXPIRE_MINUTES = 30`

### Cambiar Información del Servidor
En `backend/app/main.py` busca el endpoint `@app.get("/")`

---

## 🐛 Comandos Útiles

### Limpiar caché de npm
```bash
cd frontend
npm cache clean --force
rm -rf node_modules package-lock.json
npm install
npm start
```

### Resetear base de datos
```bash
cd backend
rm geo_agent.db
# Reinicia el backend
```

### Ver logs de Angular
Abre DevTools en navegador (F12) → Console

### Ver logs de FastAPI
Mira la terminal donde está corriendo el backend

---

## 📱 Responsive Design

La app funciona en:
- ✅ Desktop (Chrome, Firefox, Safari, Edge)
- ✅ Tablet (iPad, tablets Android)
- ✅ Móvil (iPhone, Android)

---

## 🎯 Próximos Pasos

1. Cambia `SECRET_KEY` en `backend/app/auth.py` para producción
2. Configura una base de datos PostgreSQL
3. Despliega en un servidor (Heroku, Vercel, etc.)
4. Agrega HTTPS
5. Configura variables de entorno

---

## 💡 Tips

- 🌍 El botón emoji del logo también lleva al chat
- 👤 Tu usuario aparece en la barra superior
- 🚪 Haz clic en "Salir" para cerrar sesión
- 💾 Tus búsquedas se guardan automáticamente
- ⭐ Puedes calificar lugares desde el chat

---

## 🆘 Soporte

Si tienes problemas:
1. Revisa la consola (F12)
2. Verifica que ambos servidores estén activos
3. Limpia el cache del navegador
4. Reinicia ambos terminales

---

**¡Disfruta explorando lugares! 🌟**
