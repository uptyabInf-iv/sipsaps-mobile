export const formatDate = (date) => {
  return new Date(date).toLocaleDateString('es-ES');
};

export const validateEmail = (email) => {
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return re.test(email);
};