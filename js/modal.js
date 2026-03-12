var actual = null;

function verPerfume(p) {
  actual = p;

  document.getElementById('dImg').src = p.img;
  document.getElementById('dImg').alt = p.name;
  document.getElementById('dNombre').textContent = p.name;
  document.getElementById('dConc').textContent = p.conc;
  document.getElementById('dMarca').textContent = p.casa;

  document.getElementById('ml').value = '1';
  actualizarPrecioModal();

  var fragranticaLink = document.getElementById('fragranticaLink');
  if (p.link && p.link.trim() !== '') {
    fragranticaLink.href = p.link;
    fragranticaLink.style.display = 'inline-flex';
  } else {
    fragranticaLink.style.display = 'none';
  }

  var notasDiv = document.getElementById('dNotas');
  if (p.notes) {
    var html = '<strong class="notas-title">Notas olfativas</strong><div class="notas-grid">';
    if (p.notes.top) html += '<div class="nota"><span class="nota-label">Salida</span><span>' + p.notes.top.join(', ') + '</span></div>';
    if (p.notes.heart) html += '<div class="nota"><span class="nota-label">Corazón</span><span>' + p.notes.heart.join(', ') + '</span></div>';
    if (p.notes.base) html += '<div class="nota"><span class="nota-label">Fondo</span><span>' + p.notes.base.join(', ') + '</span></div>';
    html += '</div>';
    notasDiv.innerHTML = html;
    notasDiv.style.display = 'block';
  } else {
    notasDiv.innerHTML = '';
    notasDiv.style.display = 'none';
  }

  var detalle = document.getElementById('detalle');
  detalle.style.display = 'flex';
  // Pequeño timeout para permitir la transición de opacidad si se desea en el futuro
  setTimeout(function() {
    detalle.classList.add('show');
  }, 10);
  document.body.style.overflow = 'hidden';
}

function cerrarDetalle(e) {
  var detalle = document.getElementById('detalle');
  if (e && e.target !== detalle) return;
  
  detalle.classList.remove('show');
  setTimeout(function() {
    detalle.style.display = 'none';
  }, 250); // Mismo tiempo que blur animation
  document.body.style.overflow = '';
}

function actualizarPrecioModal() {
  var ml = Number(document.getElementById('ml').value);
  var precio = ml * actual.price;

  document.getElementById('precioModal').textContent = '$' + precio;
  document.getElementById('textoMlModal').textContent = ml + ' ml seleccionado' + (ml > 1 ? 's' : '');
}
