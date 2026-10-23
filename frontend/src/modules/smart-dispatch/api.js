const API_BASE = (import.meta.env.VITE_API_BASE_URL || "http://localhost:3001/api")
  .replace(/\/$/, "");

// This boundary can also be used by a future barcode camera or roster importer.
export async function dispatchRequest(path = "", options = {}) {
  let response;
  try {
    response = await fetch(`${API_BASE}/smart-dispatch/days${path}`, {
      ...options,
      headers: { "Content-Type": "application/json", ...options.headers },
      body: options.body === undefined ? undefined : JSON.stringify(options.body),
    });
  } catch (error) {
    if (error.name === "AbortError") throw error;
    throw new Error("No se pudo conectar con Smart Dispatch. Revisa que el servidor esté disponible.");
  }

  const data = await response.json().catch(() => null);
  if (!response.ok) {
    const error = new Error(data?.message || `No se pudo completar la solicitud (${response.status}).`);
    error.status = response.status;
    error.day = data?.day;
    throw error;
  }
  if (!data) throw new Error("El servidor devolvió una respuesta vacía. Vuelve a intentarlo.");
  return data;
}
