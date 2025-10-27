// src/utils/validator.js
// Utilidades para validación dinámica: Emails, passwords, etc. Semántica, escalable para más rules.

export const validarLogin = (email, password) => {
  const errors = {};

  // UsernameOrEmail: Email o alfanum (min 3, max 100).
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!email || email.length < 3 || email.length > 100) {
    errors.email = 'Debe tener entre 3 y 100 caracteres.';
  } else if (!emailRegex.test(email) && !/^[a-zA-Z0-9]{3,50}$/.test(email)) {
    errors.email = 'Debe ser email válido o username alfanumérico.';
  }

  // Password: Min 6 chars.
  if (!password || password.length < 8) {
    errors.password = 'Debe tener al menos 8 caracteres.';
  }

  return errors;
};