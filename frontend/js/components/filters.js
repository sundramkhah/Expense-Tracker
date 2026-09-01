export function setupMonthFilter(onChange) {
  const input = document.getElementById('month-filter');
  input.value = new Date().toISOString().slice(0, 7);
  input.addEventListener('change', () => onChange(input.value));
  return input.value;
}
