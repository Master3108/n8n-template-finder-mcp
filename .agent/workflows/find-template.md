---
description: Búsqueda avanzada de templates n8n en el índice local
---

Este workflow describe cómo buscar de forma eficiente entre los +7000 templates de n8n indexados en el proyecto.

1. **Identificar la necesidad del usuario:**
   - ¿Busca un nodo específico (ej. "Vapi", "OpenAI")?
   - ¿Busca un caso de uso (ej. "gestión de citas", "análisis de leads")?
   - ¿Busca complejidad (el más grande/completo)?

2. **Ejecutar búsqueda técnica:**
   - Usar el archivo `c:\Users\Usuario\.gemini\antigravity\scratch\n8n-template-finder\src\data\workflows-index.json`.
   - Si la búsqueda es por texto, usar `grep_search`.
   - Si la búsqueda es por complejidad/tamaño, usar el script `scripts/find_largest_flows.cjs`.

3. **Filtrado de resultados:**
   - Priorizar archivos en `n8n-workflows-esp-main` si el usuario habla en español.
   - Mostrar el `name`, `path` y una breve descripción de los nodos que utiliza.

4. **Presentación:**
   - Mostrar el Top 3 de mejores coincidencias.
   - Ofrecer analizar el JSON del flujo seleccionado para explicar cómo funciona.

// turbo
5. **Comando de búsqueda rápida:**
   Si el usuario pide una búsqueda general, puedes ejecutar este comando para ver opciones:
   `node c:\Users\Usuario\.gemini\antigravity\scratch\n8n-template-finder\scripts\find_largest_flows.cjs`
