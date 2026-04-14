function mostrarToast(mensaje, error) {
  var toast = document.getElementById('toast');
  if (!toast) return;

  toast.textContent = mensaje;
  toast.setAttribute('role', error ? 'alert' : 'status');
  toast.setAttribute('aria-live', error ? 'assertive' : 'polite');

  toast.className = '';
  void toast.offsetWidth;
  toast.className = error ? 'show toast-error' : 'show';

  setTimeout(function () {
    toast.classList.remove('show');
    toast.classList.add('toast-out');
    toast.addEventListener('animationend', function handler() {
      toast.removeEventListener('animationend', handler);
      toast.className = '';
    });
  }, CONFIG.TOAST_DURATION);
}
