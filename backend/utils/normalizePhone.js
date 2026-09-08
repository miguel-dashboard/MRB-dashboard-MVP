module.exports = function normalizePhone(value) {
  if (typeof value !== "string") return "";
  const phone = value.replace(/\s+/g, "");
  if (/^9\d{8}$/.test(phone)) return "+56" + phone;
  if (/^569\d{8}$/.test(phone)) return "+" + phone;
  return phone;
};
