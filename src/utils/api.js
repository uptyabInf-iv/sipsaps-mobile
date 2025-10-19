import Constants from 'expo-constants';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Alert, Platform } from 'react-native';

/**
 * Cliente API para Expo/React Native (robusto y portable)
 * - Detecta extra.apiUrl desde app.json (preferencia), normaliza removiendo un posible "/api" final.
 * - Fallbacks: intenta obtener host desde manifest/debuggerHost en dev o usa Render por defecto.
 * - Reintento automático si recibe 404 por ausencia de prefijo "/api".
 * - Manejo de JWT (AsyncStorage 'jwt'), timeout y manejo de errores centralizado.
 */

const DEFAULT_RENDER_URL = 'https://sipsaps-mobile-backend.onrender.com'; // SIN /api
// Ajuste solicitado: subir timeout a 1 minuto (60000 ms)
const DEFAULT_TIMEOUT_MS = 60000;

const stripTrailingSlash = (s = '') => s.replace(/\/+$/, '');
const stripTrailingApi = (s = '') => s.replace(/\/api\/?$/i, ''); // remove trailing '/api' or '/api/'

// Build a base URL from manifest.extra.apiUrl (if present) or sensible fallbacks.
// IMPORTANT: we remove a trailing '/api' if present in extra to avoid double "/api/api".
const getConfiguredBase = () => {
  try {
    const manifest = Constants.manifest || Constants.expoConfig || null;
    const fromExtra = manifest?.extra?.apiUrl;
    if (fromExtra) {
      // Normalize: remove trailing slash and trailing '/api' if present
      const normalized = stripTrailingSlash(stripTrailingApi(fromExtra));
      return normalized;
    }
  } catch (e) {
    // ignore
  }

  // If running in Expo Go, try to infer host from debuggerHost (dev convenience)
  try {
    const manifest = Constants.manifest || Constants.expoConfig || null;
    const debuggerHost = manifest?.debuggerHost || manifest?.hostUri || null;
    if (debuggerHost) {
      const host = debuggerHost.split(':')[0];
      // default developer backend port is 3000; prefer explicit extra.apiUrl to override
      return `http://${host}:3000`;
    }
  } catch (e) {
    // ignore
  }

  // fallback to public Render URL
  return DEFAULT_RENDER_URL;
};

const API_BASE = getConfiguredBase();
console.log('[api] Base URL usada:', API_BASE);

// Helpers
const ensureLeadingSlash = (s = '') => (s.startsWith('/') ? s : `/${s}`);
const buildUrl = (endpoint, useApiPrefix = true) => {
  if (!endpoint) return API_BASE;
  if (endpoint.startsWith('http://') || endpoint.startsWith('https://'))
    return endpoint;
  const base = API_BASE.replace(/\/+$/, ''); // no trailing slash
  let path = endpoint;
  if (useApiPrefix) {
    // if endpoint already begins with /api then keep it; otherwise prepend /api
    if (!endpoint.match(/^\/?api(\/|$)/i)) {
      path = `/api${ensureLeadingSlash(endpoint)}`;
    } else {
      path = ensureLeadingSlash(endpoint);
    }
  } else {
    path = ensureLeadingSlash(endpoint);
  }
  return `${base}${path}`;
};

const getToken = async () => {
  try {
    return await AsyncStorage.getItem('jwt');
  } catch (e) {
    console.warn('[api] getToken error', e);
    return null;
  }
};

const request = async (method, endpoint, data = null, opts = {}) => {
  const timeout = opts.timeout || DEFAULT_TIMEOUT_MS;
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);

  const tryRequest = async (useApiPrefix) => {
    const url = buildUrl(endpoint, useApiPrefix);
    const token = await getToken();
    const headers = {
      'Content-Type': 'application/json',
      ...(opts.headers || {}),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    };
    const fetchOptions = { method, headers, signal: controller.signal };
    if (data != null && method !== 'GET' && method !== 'HEAD')
      fetchOptions.body = JSON.stringify(data);
    console.log(
      `[api] ${method} -> ${url}`,
      data ? { bodyPreview: data } : null
    );
    const res = await fetch(url, fetchOptions);
    const contentType = res.headers.get('content-type') || '';
    let responseBody = null;
    if (contentType.includes('application/json'))
      responseBody = await res.json().catch(() => null);
    else responseBody = await res.text().catch(() => null);
    if (!res.ok) {
      const statusText = res.statusText || `HTTP ${res.status}`;
      const errorDetail =
        responseBody &&
        typeof responseBody === 'object' &&
        (responseBody.error || responseBody.message)
          ? responseBody.error || responseBody.message
          : responseBody;
      const message = `HTTP ${res.status}: ${errorDetail || statusText}`;
      const err = new Error(message);
      err.status = res.status;
      err.response = responseBody;
      throw err;
    }
    if (
      responseBody &&
      typeof responseBody === 'object' &&
      responseBody.token
    ) {
      try {
        await AsyncStorage.setItem('jwt', responseBody.token);
      } catch (e) {
        console.warn('[api] save token failed', e);
      }
    }
    return responseBody;
  };

  try {
    try {
      const result = await tryRequest(true); // attempt with /api prefix
      clearTimeout(timeoutId);
      return result;
    } catch (err) {
      // If 404, optionally retry without /api prefix (for servers that don't mount under /api)
      if (
        err &&
        err.status === 404 &&
        opts.retryWithoutApiPrefixOn404 !== false
      ) {
        console.warn(
          '[api] Primera petición 404 — reintentando sin prefijo /api (fallback).'
        );
        const fallbackResult = await tryRequest(false);
        clearTimeout(timeoutId);
        return fallbackResult;
      }
      throw err;
    }
  } catch (error) {
    clearTimeout(timeoutId);
    if (error.name === 'AbortError') {
      const err = new Error(
        'Timeout: El backend no respondió en ' + timeout / 1000 + ' segundos.'
      );
      err.code = 'TIMEOUT';
      throw err;
    }
    throw error;
  }
};

const api = {
  get: async (endpoint, opts = {}) => request('GET', endpoint, null, opts),
  post: async (endpoint, data = {}, opts = {}) =>
    request('POST', endpoint, data, opts),
  put: async (endpoint, data = {}, opts = {}) =>
    request('PUT', endpoint, data, opts),
  patch: async (endpoint, data = {}, opts = {}) =>
    request('PATCH', endpoint, data, opts),
  del: async (endpoint, data = null, opts = {}) =>
    request('DELETE', endpoint, data, opts),
};

api.handleError = (error) => {
  console.error('[api] Error detallado:', {
    message: error?.message,
    code: error?.code || error?.status || 'N/A',
    url: API_BASE,
    response: error?.response || null,
  });
  let msgUsuario =
    'Error de conexión con el servidor. Revisa tu conexión o el estado del backend.';
  const status = error?.status || error?.code || null;
  const text =
    (error?.response && (error.response.error || error.response.message)) ||
    error?.message ||
    '';
  if (text.includes('Timeout') || error.code === 'TIMEOUT')
    msgUsuario =
      'El backend tarda en responder — por favor inténtalo de nuevo en unos instantes.';
  else if (status === 401 || text.includes('401'))
    msgUsuario = 'No autorizado. Por favor ingresa de nuevo.';
  else if (status === 400 || text.includes('400'))
    msgUsuario = 'Datos inválidos — verifica los campos.';
  else if (status >= 500 || text.includes('500'))
    msgUsuario = 'Error interno del servidor. Contacta al administrador.';
  else if (
    (text && text.toLowerCase().includes('network request failed')) ||
    error instanceof TypeError
  )
    msgUsuario =
      'Fallo de red. Asegúrate de que la app puede comunicarse con el servidor (Wi‑Fi / Emulator / Expo host).';
  Alert.alert('Error de API', msgUsuario);
};

export default api;