# Publicación temporal de Recruit

- Configurar NODE_ENV=production explícitamente en el servicio antes de exponerlo. Sin token, las rutas privadas permanecen bloqueadas en producción.
- INTERNAL_API_TOKEN es opcional: si se necesita acceso administrativo servidor a servidor, configurar un valor aleatorio de alta entropía en el gestor de secretos del hosting. Enviar Authorization: Bearer <token> exclusivamente desde herramientas internas o un proxy privado. Nunca incluirlo en React, VITE, URLs ni repositorio.
- Público: GET /, POST /api/recruit/applicants y preflight OPTIONS para ese POST. JSON limitado a 16 KB. Cualquier otra ruta requiere token en producción, incluidas rutas futuras.
- Desarrollo: NODE_ENV ausente o development, sin token, permite conexiones de loopback para el dashboard local. Con token configurado se exige autorización también localmente. No publicar con NODE_ENV de desarrollo: un proxy local podría hacer que conexiones externas lleguen desde loopback.
- Publicar la landing estática y solo las rutas públicas mediante proxy HTTPS. No publicar Control Tower. Restringir el puerto directo del backend por firewall/red privada para impedir elusión del proxy. No reenviar tokens internos desde el proxy público.
- La URL pública va en VITE_RECRUIT_API_URL y requiere reconstruir la landing. Esa URL no es un secreto.
- El dashboard local conserva sus URLs y no recibe token. Para acceder al backend de producción, usar un canal privado separado; el dashboard en localhost no obtiene una excepción contra el backend remoto.
- Verificar desde Internet que GET/PUT/PATCH/DELETE de Recruit y operaciones no devuelvan datos ni alteren registros; verificar que el POST sí funcione. Reiniciar backend para cargar cambios.
- Pendiente: limitación de frecuencia del POST en proxy/hosting, verificación integrada con MongoDB, y posterior login con sesiones/cookies seguras. El token temporal no aporta identidad individual ni permisos por usuario.

Pruebas: node --test backend/tests/*.test.js desde la raíz. El guardado de MongoDB se simula; no se crean postulantes reales.
