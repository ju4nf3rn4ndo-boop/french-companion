# French Companion — Guía de despliegue

App de refuerzo de francés con IA (Claude) + base de datos en la nube (Supabase) + deploy en Vercel.

---

## Requisitos previos

- Cuenta gratuita en [supabase.com](https://supabase.com)
- Cuenta gratuita en [vercel.com](https://vercel.com)
- Cuenta en [console.anthropic.com](https://console.anthropic.com) (para la API key de Claude)
- [Node.js](https://nodejs.org) instalado (versión 18+)
- [Git](https://git-scm.com) instalado

---

## Paso 1 — Configurar Supabase

1. Entra a [supabase.com](https://supabase.com) → **New project**
2. Ponle un nombre (ej: `french-companion`) y elige una región (USA East está bien)
3. Ve a **SQL Editor** → pega el contenido de `supabase_schema.sql` → click **Run**
4. Ve a **Settings → API** y copia:
   - **Project URL** → la necesitas como `VITE_SUPABASE_URL`
   - **anon public key** → la necesitas como `VITE_SUPABASE_ANON_KEY`

---

## Paso 2 — Obtener tu API key de Claude

1. Ve a [console.anthropic.com](https://console.anthropic.com)
2. **API Keys → Create Key**
3. Copia la key → la necesitas como `VITE_CLAUDE_API_KEY`

---

## Paso 3 — Correr la app localmente (para probar)

```bash
# En la carpeta del proyecto:
npm install

# Crea el archivo de variables de entorno:
cp .env.example .env.local
# Edita .env.local con tus 3 keys

# Corre la app:
npm run dev
# Abre http://localhost:5173
```

---

## Paso 4 — Desplegar en Vercel (URL permanente)

### Opción A — Sin instalar nada (más fácil)

1. Sube la carpeta a GitHub:
   - Crea un repo en [github.com](https://github.com)
   - En la terminal dentro de la carpeta:
     ```bash
     git init
     git add .
     git commit -m "initial"
     git remote add origin https://github.com/TU_USUARIO/french-companion.git
     git push -u origin main
     ```
2. Ve a [vercel.com](https://vercel.com) → **Add New Project**
3. Importa tu repositorio de GitHub
4. En **Environment Variables** agrega las 3 variables:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
   - `VITE_CLAUDE_API_KEY`
5. Click **Deploy** — en 2 minutos tendrás tu URL permanente

### Opción B — Con Vercel CLI

```bash
npm install -g vercel
vercel
# Sigue las instrucciones del wizard
# Agrega las env vars cuando te las pida
```

---

## Estructura del proyecto

```
french-companion/
├── src/
│   ├── components/
│   │   ├── Ingest.jsx      # Ingresar lecciones de Duolingo
│   │   ├── Vocabulary.jsx  # Banco de palabras clasificadas
│   │   ├── Practice.jsx    # Ejercicios generados por IA
│   │   └── Progress.jsx    # Estadísticas y seguimiento
│   ├── lib/
│   │   └── api.js          # Supabase + Claude helpers
│   ├── App.jsx
│   ├── App.css
│   └── main.jsx
├── supabase_schema.sql     # Schema de la base de datos
├── .env.example            # Template de variables de entorno
└── index.html
```

---

## Flujo de uso

1. **Lección de hoy** → pegas frases de Duolingo o describes el tema → la IA clasifica todo
2. **Guardar** → el vocabulario queda en Supabase (persistente, en la nube)
3. **Practicar** → la IA genera ejercicios basados en tu vocabulario acumulado
4. **Progreso** → ves estadísticas, precisión y temas cubiertos

---

## Costos estimados (uso personal)

| Servicio | Plan | Costo |
|----------|------|-------|
| Supabase | Free tier | $0/mes |
| Vercel   | Hobby | $0/mes |
| Claude API | ~50 llamadas/día | ~$1-3/mes |

---

## Próximos pasos sugeridos

- Agregar autenticación (Supabase Auth) si quieres que sea multi-usuario
- Sistema de repaso espaciado (spaced repetition) por palabra
- Notificaciones diarias vía email para mantener la racha
