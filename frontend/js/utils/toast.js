export function toast(message, type = 'success') {
  const element = document.getElementById('toast');
  element.textContent = message;
  element.className = `toast ${type}`;
  clearTimeout(toast.timer);
  toast.timer = setTimeout(() => { element.className = 'toast hidden'; }, 2600);
}
