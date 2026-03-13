document.querySelectorAll('.faq-item summary').forEach(function(summary) {
  summary.addEventListener('click', function(e) {
    e.preventDefault();
    var item = summary.parentElement;

    if (item.classList.contains('active')) {
      // Animar cierre
      item.classList.remove('active');
      item.classList.add('closing');
      setTimeout(function() {
        item.classList.remove('closing');
        item.removeAttribute('open');
      }, 500);
    } else {
      // Animar apertura
      item.setAttribute('open', '');
      requestAnimationFrame(function() {
        requestAnimationFrame(function() {
          item.classList.add('active');
        });
      });
    }
  });
});
