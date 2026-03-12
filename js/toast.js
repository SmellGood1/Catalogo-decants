function mostrarToast(mensaje, error) {
  var toast = document.getElementById('toast');
  toast.textContent = mensaje;

  if (error) {
    toast.className = 'show toast-error';
  } else {
    toast.className = 'show';
  }

  setTimeout(function() {
    toast.className = '';
  }, CONFIG.TOAST_DURATION);
}
