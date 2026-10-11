const CLAVE = 'mis-gastos:v1';
const CATEGORIAS = [
  'Comida', 'Supermercado', 'Transporte', 'Vivienda', 'Servicios',
  'Salud', 'Ocio', 'Ropa', 'Educación', 'Otros',
];

const $ = (id) => document.getElementById(id);
const moneda = new Intl.NumberFormat('es', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

function cargar() {
  try {
    const datos = JSON.parse(localStorage.getItem(CLAVE));
    return Array.isArray(datos) ? datos : [];
  } catch {
    return [];
  }
}

function guardar() {
  localStorage.setItem(CLAVE, JSON.stringify(gastos));
}

let gastos = cargar();

function hoy() {
  const d = new Date();
  d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
  return d.toISOString().slice(0, 10);
}

function delMes() {
  const mes = $('mes').value;
  return gastos
    .filter((g) => g.fecha.startsWith(mes))
    .sort((a, b) => b.fecha.localeCompare(a.fecha) || b.creado - a.creado);
}

function render() {
  const lista = delMes();
  const total = lista.reduce((s, g) => s + g.monto, 0);
  $('total').textContent = moneda.format(total);
  $('cantidad').textContent = lista.length;

  const ul = $('lista');
  ul.replaceChildren();
  for (const g of lista) {
    const li = document.createElement('li');
    li.innerHTML = `
      <div class="info">
        <div class="desc"></div>
        <div class="meta"></div>
      </div>
      <span class="monto"></span>
      <button class="icono editar" title="Editar" aria-label="Editar">✎</button>
      <button class="icono borrar" title="Eliminar" aria-label="Eliminar">✕</button>`;
    li.querySelector('.desc').textContent = g.descripcion || g.categoria;
    li.querySelector('.meta').textContent = `${g.categoria} · ${g.fecha.split('-').reverse().join('/')}`;
    li.querySelector('.monto').textContent = moneda.format(g.monto);
    li.querySelector('.editar').onclick = () => editar(g.id);
    li.querySelector('.borrar').onclick = () => borrar(g.id);
    ul.append(li);
  }
  $('vacio').hidden = lista.length > 0;

  const porCat = {};
  for (const g of lista) porCat[g.categoria] = (porCat[g.categoria] || 0) + g.monto;
  const filas = Object.entries(porCat).sort((a, b) => b[1] - a[1]);
  const max = filas.length ? filas[0][1] : 1;
  const barras = $('categorias');
  barras.replaceChildren();
  for (const [cat, monto] of filas) {
    const li = document.createElement('li');
    const pct = total ? Math.round((monto / total) * 100) : 0;
    li.innerHTML = `
      <div class="fila"><span></span><span></span></div>
      <div class="pista"><div class="relleno"></div></div>`;
    const [nombre, valor] = li.querySelectorAll('.fila span');
    nombre.textContent = cat;
    valor.textContent = `${moneda.format(monto)} (${pct}%)`;
    li.querySelector('.relleno').style.width = `${(monto / max) * 100}%`;
    barras.append(li);
  }
}

function limpiarForm() {
  $('form').reset();
  $('id').value = '';
  $('fecha').value = hoy();
  $('form-titulo').textContent = 'Nuevo gasto';
  $('guardar').textContent = 'Agregar';
  $('cancelar').hidden = true;
}

function editar(id) {
  const g = gastos.find((x) => x.id === id);
  if (!g) return;
  $('id').value = g.id;
  $('monto').value = g.monto;
  $('categoria').value = g.categoria;
  $('fecha').value = g.fecha;
  $('descripcion').value = g.descripcion;
  $('form-titulo').textContent = 'Editar gasto';
  $('guardar').textContent = 'Guardar cambios';
  $('cancelar').hidden = false;
  $('monto').focus();
}

function borrar(id) {
  if (!confirm('¿Eliminar este gasto?')) return;
  gastos = gastos.filter((g) => g.id !== id);
  guardar();
  render();
}

$('form').addEventListener('submit', (e) => {
  e.preventDefault();
  const datos = {
    monto: Math.round(parseFloat($('monto').value) * 100) / 100,
    categoria: $('categoria').value,
    fecha: $('fecha').value,
    descripcion: $('descripcion').value.trim(),
  };
  const id = $('id').value;
  if (id) {
    Object.assign(gastos.find((g) => g.id === id), datos);
  } else {
    gastos.push({ id: crypto.randomUUID(), creado: Date.now(), ...datos });
    $('mes').value = datos.fecha.slice(0, 7);
  }
  guardar();
  limpiarForm();
  render();
});

$('cancelar').onclick = limpiarForm;
$('mes').onchange = render;

const nativo = window.Capacitor?.isNativePlatform?.() ?? false;

async function descargar(nombre, contenido, tipo) {
  if (nativo) {
    const { Filesystem, Share } = window.Capacitor.Plugins;
    try {
      const { uri } = await Filesystem.writeFile({
        path: nombre, data: contenido, directory: 'CACHE', encoding: 'utf8',
      });
      await Share.share({ title: nombre, files: [uri] });
    } catch (err) {
      if (!/cancel/i.test(err?.message || '')) alert('No se pudo exportar el archivo.');
    }
    return;
  }
  const url = URL.createObjectURL(new Blob([contenido], { type: tipo }));
  const a = Object.assign(document.createElement('a'), { href: url, download: nombre });
  a.click();
  URL.revokeObjectURL(url);
}

$('exportar-csv').onclick = () => {
  const esc = (v) => `"${String(v).replace(/"/g, '""')}"`;
  const filas = [['Fecha', 'Categoría', 'Descripción', 'Monto']]
    .concat([...gastos].sort((a, b) => a.fecha.localeCompare(b.fecha))
      .map((g) => [g.fecha, g.categoria, g.descripcion, g.monto.toFixed(2)]));
  descargar('gastos.csv', '﻿' + filas.map((f) => f.map(esc).join(',')).join('\n'), 'text/csv');
};

$('exportar-json').onclick = () => {
  descargar(`gastos-${hoy()}.json`, JSON.stringify(gastos, null, 2), 'application/json');
};

$('importar').onchange = async (e) => {
  const archivo = e.target.files[0];
  e.target.value = '';
  if (!archivo) return;
  try {
    const datos = JSON.parse(await archivo.text());
    if (!Array.isArray(datos) || !datos.every((g) => g.id && g.fecha && typeof g.monto === 'number')) {
      throw new Error('formato');
    }
    if (!confirm(`Se reemplazarán tus datos actuales por ${datos.length} gastos. ¿Continuar?`)) return;
    gastos = datos;
    guardar();
    render();
  } catch {
    alert('El archivo no es una copia de seguridad válida.');
  }
};

for (const c of CATEGORIAS) $('categoria').append(new Option(c, c));
$('mes').value = hoy().slice(0, 7);
limpiarForm();
render();

if (!nativo && 'serviceWorker' in navigator && location.protocol !== 'file:') {
  navigator.serviceWorker.register('sw.js');
}
