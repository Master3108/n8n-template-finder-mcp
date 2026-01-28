# 🎯 FlowMatch - Tu Asistente Inteligente de Workflows N8N

FlowMatch es un asistente inteligente que ayuda a encontrar el workflow perfecto entre **6,698 plantillas de N8N** usando IA.

## ✨ Características

### Fase 1 ✅ COMPLETADA
- ✅ Chat inteligente con interfaz moderna
- ✅ Búsqueda en 6,698 workflows indexados
- ✅ Upload de archivos (imágenes, PDFs, audios)
- ✅ Resultados visuales con tarjetas de workflows
- ✅ Diseño responsive y profesional

### Fase 2 🚧 EN PROGRESO
- ✅ Integración con N8N
- ✅ Análisis de imágenes con OpenAI Vision
- ✅ Procesamiento de PDFs con IA
- ✅ Análisis de audios con Whisper
- ✅ Búsqueda semántica mejorada

## 🚀 Configuración

### 1. Instalar Dependencias

```bash
npm install
```

### 2. Configurar N8N Workflow

1. Abre tu N8N: `https://n8n-n8n.cwf1hb.easypanel.host`
2. Importa el workflow: `n8n-workflow/flowmatch-ai-processor.json`
3. En cada nodo de OpenAI, selecciona tu credencial de OpenAI
4. Actualiza el webhook ID si es necesario: `6949076f-6c4c-45f8-a010-2997508d99ba`
5. Activa el workflow

### 3. Indexar Workflows

```bash
npm run index
```

Esto procesará los 6,698 workflows y creará el índice de búsqueda.

### 4. Ejecutar la Aplicación

```bash
npm run dev
```

La app estará disponible en: `http://localhost:5173`

## 📁 Estructura del Proyecto

```
flowmatch/
├─ templates/                 # 6,698 workflows de N8N
│  ├─ awesome-n8n-templates-main/
│  ├─ n8n-free-templates-main/
│  ├─ n8n-workflow-templates-main/
│  ├─ n8n-workflows-esp-main/
│  └─ n8n-workflows-main/
├─ src/
│  ├─ components/
│  │  └─ ChatInterface.jsx   # Chat principal
│  ├─ data/
│  │  ├─ workflows-index.json  # Índice de búsqueda
│  │  └─ workflows-summary.json # Resumen
│  ├─ App.jsx
│  └─ main.jsx
├─ n8n-workflow/
│  └─ flowmatch-ai-processor.json  # Workflow de N8N
└─ scripts/
   └─ index-workflows.js      # Script de indexación
```

## 🔧 URLs y Configuración

### N8N Webhooks
- **Test**: `https://n8n-n8n.cwf1hb.easypanel.host/webhook-test/6949076f-6c4c-45f8-a010-2997508d99ba`
- **Producción**: `https://n8n-n8n.cwf1hb.easypanel.host/webhook/6949076f-6c4c-45f8-a010-2997508d99ba`

### N8N Dashboard
- `https://n8n-n8n.cwf1hb.easypanel.host`

## 💡 Cómo Funciona

### Sin Archivos (Búsqueda Local)
```
Usuario escribe → Búsqueda en índice local → Muestra resultados
```

### Con Archivos (IA Avanzada)
```
Usuario sube archivo
    ↓
N8N Webhook
    ↓
Detecta tipo de archivo
    ├─ Imagen → OpenAI Vision
    ├─ PDF → Extracción + GPT-4
    └─ Audio → Whisper + GPT-4
    ↓
Análisis de contenido
    ↓
Búsqueda de workflows relevantes
    ↓
Respuesta con recomendaciones
    ↓
Frontend muestra resultados
```

## 📊 Estadísticas

- **Total workflows**: 6,698
- **Categorías**: automation, uncategorized
- **Top tags**: automation, n8n, production-ready, excellent, optimized
- **Repositorios fuente**: 5

## 🎨 Tecnologías

- **Frontend**: React + Vite
- **Estilos**: Tailwind-like utility classes
- **Iconos**: Lucide React
- **Backend**: N8N
- **IA**: OpenAI (GPT-4, Vision, Whisper)
- **Búsqueda**: Indexación JSON local

## 🚧 Próximas Mejoras

- [ ] Búsqueda semántica con embeddings
- [ ] Historial de conversaciones
- [ ] Autenticación de usuarios
- [ ] Guardar workflows favoritos
- [ ] Exportar workflows a N8N directo
- [ ] Modo oscuro
- [ ] Despliegue en Easypanel

## 📝 Comandos Disponibles

```bash
npm run dev      # Ejecutar en desarrollo
npm run build    # Construir para producción
npm run preview  # Preview de producción
npm run index    # Re-indexar workflows
```

## ⚠️ Notas Importantes

1. **OpenAI API Key**: Necesitas una API key de OpenAI configurada en N8N
2. **Webhook ID**: El ID del webhook debe coincidir entre frontend y N8N
3. **CORS**: Asegúrate de que N8N acepte requests desde tu frontend
4. **Rate Limits**: OpenAI tiene límites de rate, considera implementar caché

## 🤝 Contribuir

Este es un proyecto interno. Para agregar más workflows:

1. Coloca los archivos JSON en `templates/`
2. Ejecuta `npm run index`
3. Los nuevos workflows estarán disponibles automáticamente

## 📧 Soporte

Para dudas o problemas, contacta al equipo de desarrollo.

---

**FlowMatch** - El match perfecto para tus workflows 🎯⚡
