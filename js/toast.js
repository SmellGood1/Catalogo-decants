function mostrarToast(mensaje, error) {
  var toast = document.getElementById('toast');
  toast.textContent = mensaje;

  // Reset any ongoing animation
  toast.className = '';
  void toast.offsetWidth;

  if (error) {
    toast.className = 'show toast-error';
  } else {
    toast.className = 'show';
  }

  setTimeout(function() {
    toast.classList.remove('show');
    toast.classList.add('toast-out');

    toast.addEventListener('animationend', function handler() {
      toast.removeEventListener('animationend', handler);
      toast.className = '';
    });
  }, CONFIG.TOAST_DURATION);
}
