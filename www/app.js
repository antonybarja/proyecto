const CLAVE = 'mis-gastos:v1';
const CATEGORIAS = [
  'Comida', 'Supermercado', 'Transporte', 'Vivienda', 'Servicios',
  'Salud', 'Ocio', 'Ropa', 'Educación', 'Otros',
];

const METODOS = [
  'Yape', 'Plin', 'Transferencia', 'Tarjeta de débito', 'Tarjeta de crédito', 'Efectivo',
];

const $ = (id) => document.getElementById(id);
const moneda = new Intl.NumberFormat('es-PE', { style: 'currency', currency: 'PEN' });

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

function renderBarras(barras, lista, clave, total) {
  const suma = {};
  for (const g of lista) suma[clave(g)] = (suma[clave(g)] || 0) + g.monto;
  const filas = Object.entries(suma).sort((a, b) => b[1] - a[1]);
  const max = filas.length ? filas[0][1] : 1;
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
    li.querySelector('.meta').textContent = `${g.categoria}${g.metodo ? ` · ${g.metodo}` : ''} · ${g.fecha.split('-').reverse().join('/')}`;
    li.querySelector('.monto').textContent = moneda.format(g.monto);
    li.querySelector('.editar').onclick = () => editar(g.id);
    li.querySelector('.borrar').onclick = () => borrar(g.id);
    ul.append(li);
  }
  $('vacio').hidden = lista.length > 0;

  renderBarras($('categorias'), lista, (g) => g.categoria, total);
  renderBarras($('metodos'), lista, (g) => g.metodo || 'Sin indicar', total);
}

// Registro rápido desde un enlace o un Atajo de iPhone:
// index.html?monto=12.50&metodo=Yape&desc=Menú&cat=Comida
function prellenarDesdeUrl() {
  const q = new URLSearchParams(location.search);
  if (![...q.keys()].length) return;
  const buscar = (lista, v) => lista.find((x) => x.toLowerCase() === (v || '').trim().toLowerCase());
  const monto = parseFloat((q.get('monto') || '').replace(',', '.').replace(/[^\d.]/g, ''));
  if (monto > 0) $('monto').value = monto;
  const metodo = buscar(METODOS, q.get('metodo'));
  if (metodo) $('metodo').value = metodo;
  const cat = buscar(CATEGORIAS, q.get('cat'));
  if (cat) $('categoria').value = cat;
  if (q.get('desc')) $('descripcion').value = q.get('desc').slice(0, 100);
  history.replaceState(null, '', location.pathname);
  $('monto').focus();
}

function limpiarForm() {
  const metodo = $('metodo').value;
  $('form').reset();
  $('id').value = '';
  if (metodo) $('metodo').value = metodo;
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
  $('metodo').value = g.metodo || METODOS[0];
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
    metodo: $('metodo').value,
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
  const filas = [['Fecha', 'Categoría', 'Medio de pago', 'Descripción', 'Monto']]
    .concat([...gastos].sort((a, b) => a.fecha.localeCompare(b.fecha))
      .map((g) => [g.fecha, g.categoria, g.metodo || '', g.descripcion, g.monto.toFixed(2)]));
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
for (const m of METODOS) $('metodo').append(new Option(m, m));
$('mes').value = hoy().slice(0, 7);
limpiarForm();
prellenarDesdeUrl();
render();

if (!nativo && 'serviceWorker' in navigator && location.protocol !== 'file:') {
  navigator.serviceWorker.register('sw.js');
}
