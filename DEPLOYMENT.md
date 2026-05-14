# 🚀 Deployment Guide - Geolocalizador AI

## Railway Deployment Setup

### Prerequisites
- Railway.app account
- GitHub repository connected to Railway
- Environment variables configured

### Backend Setup on Railway

#### 1. **Create Environment Variables in Railway**

Go to Railway Dashboard → Your Project → Variables:

```
GEMINI_API_KEY=your-actual-gemini-key
DATABASE_URL=your-railway-postgres-url
SECRET_KEY=your-super-secret-key-here
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=30
```

⚠️ **IMPORTANT**: Never commit `.env` file to GitHub. Use Railway Secrets instead.

#### 2. **Update CORS if Adding More Domains**

If you add custom domains, update the `allowed_origins` list in `ai-geo-agent-monorepo/backend/app/main.py`:

```python
allowed_origins = [
    "https://geolocalizador-production-1c75.up.railway.app",
    "https://geolocalizador-ivory.vercel.app",
    "https://your-custom-domain.com",  # Add here
]
```

#### 3. **Set Start Command**

In Railway, the start command should be:
```bash
cd ai-geo-agent-monorepo/backend && uvicorn app.main:app --host 0.0.0.0 --port $PORT
```

Or use `railway.json` (already included in repo).

#### 4. **Database Migration (if needed)**

The app auto-creates tables on first run via:
```python
Base.metadata.create_all(bind=engine)
```

### Frontend Setup on Vercel

#### 1. **Build Command**
```bash
cd ai-geo-agent-monorepo/frontend && npm run build
```

#### 2. **Environment Variables**
```
API_URL=https://geolocalizador-production-1c75.up.railway.app
```

Update in `ai-geo-agent-monorepo/frontend/src/environments/environment.prod.ts`

#### 3. **Ensure CORS Headers Match**

Frontend URL must match one of the `allow_origins` in backend `main.py`.

---

## 🔒 Security Checklist

- [ ] `.env` file is in `.gitignore` ✅ (already added)
- [ ] `.env.example` exists with template variables ✅
- [ ] Sensitive keys are in Railway Secrets (not hardcoded)
- [ ] CORS origins are explicitly defined (not `*`)
- [ ] Database URL uses strong credentials
- [ ] JWT secret is strong and random
- [ ] HTTPS is enforced in production

---

## 🐛 Troubleshooting

### Error: 502 Bad Gateway

**Cause**: Usually CORS issues or missing middleware configuration.

**Solution**:
1. Verify `allow_origins` includes your frontend domain
2. Check Railway logs: `railway logs backend`
3. Test preflight: `curl -X OPTIONS https://your-api.railway.app/api/auth/login -v`
4. Ensure all headers are properly configured in CORS middleware

### Error: CORS policy blocked

**Cause**: Frontend domain not in `allow_origins`.

**Solution**:
1. Add frontend domain to `allowed_origins` in `main.py`
2. Redeploy backend on Railway
3. Wait 1-2 minutes for cache to clear
4. Clear browser cache (Ctrl+Shift+Delete)

### Error: DATABASE_URL not found

**Cause**: Environment variable not set in Railway.

**Solution**:
1. Go to Railway → Variables
2. Add `DATABASE_URL=postgresql://...`
3. Restart service

### API responds to GET but not OPTIONS

**Cause**: OPTIONS method not in `allow_methods`.

**Solution**: Already fixed in updated `main.py` - includes `"OPTIONS"`.

---

## 📊 Testing Endpoints

### Test CORS Preflight (OPTIONS)
```bash
curl -X OPTIONS https://geolocalizador-production-1c75.up.railway.app/api/auth/login \
  -H "Origin: https://geolocalizador-ivory.vercel.app" \
  -H "Access-Control-Request-Method: POST" \
  -H "Access-Control-Request-Headers: content-type" \
  -v
```

Should return:
```
HTTP/1.1 200 OK
access-control-allow-credentials: true
access-control-allow-methods: GET, POST, PUT, DELETE, OPTIONS, PATCH
access-control-allow-origin: https://geolocalizador-ivory.vercel.app
```

### Test Health Endpoint
```bash
curl https://geolocalizador-production-1c75.up.railway.app/health
```

### Test Login
```bash
curl -X POST https://geolocalizador-production-1c75.up.railway.app/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"test","password":"test123"}'
```

---

## 🔄 Deployment Pipeline

### Every Push to Main:

1. **Backend Tests** (Optional - add GitHub Actions)
2. **Railway Auto-Deploy**
   - Detects changes in `ai-geo-agent-monorepo/backend/`
   - Builds with Dockerfile
   - Runs health check
   - Deploys if healthy
3. **Frontend Vercel Deploy** (if connected)
   - Triggers on push to `main`
   - Builds Angular app
   - Deploys to Vercel

---

## 📝 Environment Variables Reference

| Variable | Example | Notes |
|----------|---------|-------|
| `GEMINI_API_KEY` | `AIza...` | Get from Google Cloud Console |
| `DATABASE_URL` | `postgresql://user:pass@host/db` | Optional - uses SQLite if not set |
| `SECRET_KEY` | `your-secret-123` | Change for production |
| `ALGORITHM` | `HS256` | JWT algorithm |
| `ACCESS_TOKEN_EXPIRE_MINUTES` | `30` | Token expiration time |
| `ALLOWED_ORIGINS` | `https://domain1.com,https://domain2.com` | Additional CORS origins |

---

## 🚨 Common Issues & Fixes

| Issue | Cause | Fix |
|-------|-------|-----|
| 502 Bad Gateway on login | CORS blocked | Add domain to `allow_origins` |
| Database migrations fail | DB not initialized | DB auto-creates on first run |
| Token expires immediately | `ACCESS_TOKEN_EXPIRE_MINUTES` too low | Increase value in variables |
| Cannot connect to API | Wrong `API_URL` in frontend | Update environment variables |
| HTTPS redirects fail | Missing SSL config | Railway handles this automatically |

---

## ✅ Final Deployment Checklist

- [ ] Backend running on Railway
- [ ] Frontend running on Vercel
- [ ] CORS configured correctly
- [ ] Environment variables set in Railway
- [ ] Database connected and working
- [ ] Health endpoint responds
- [ ] Login endpoint working (OPTIONS + POST)
- [ ] Frontend can communicate with backend
- [ ] SSL/HTTPS working
- [ ] Database backups enabled (Railway)

---

**For more help**: Check Railway Docs at https://docs.railway.app

