const fs = require('fs');

const files = [
  {
    path: 'D:/Desarrollo/MiniAgente-Inventario/inventario/inventario-front/src/pages/NvrList.jsx',
    fields: `[
      { name: 'nombre', label: 'Nombre del NVR', type: 'text', required: true },
      { name: 'marca', label: 'Marca', type: 'text' },
      { name: 'modelo', label: 'Modelo', type: 'text' },
      { name: 'numeroSerie', label: 'Nro de Serie', type: 'text' },
      { name: 'ip', label: 'Dirección IP', type: 'text' },
      { name: 'cantidadCanales', label: 'Canales', type: 'number' }
    ]`
  },
  {
    path: 'D:/Desarrollo/MiniAgente-Inventario/inventario/inventario-front/src/pages/RouterList.jsx',
    fields: `[
      { name: 'nombre', label: 'Nombre', type: 'text', required: true },
      { name: 'marca', label: 'Marca', type: 'text' },
      { name: 'modelo', label: 'Modelo', type: 'text' },
      { name: 'numeroSerie', label: 'Nro de Serie', type: 'text' },
      { name: 'ip', label: 'IP Local', type: 'text' },
      { name: 'ipPublica', label: 'IP Pública', type: 'text' },
      { name: 'sitio', label: 'Sitio / Ubicación', type: 'text' }
    ]`
  },
  {
    path: 'D:/Desarrollo/MiniAgente-Inventario/inventario/inventario-front/src/pages/SwitchList.jsx',
    fields: `[
      { name: 'nombre', label: 'Nombre', type: 'text', required: true },
      { name: 'marca', label: 'Marca', type: 'text' },
      { name: 'modelo', label: 'Modelo', type: 'text' },
      { name: 'numeroSerie', label: 'Nro de Serie', type: 'text' },
      { name: 'ip', label: 'IP Local', type: 'text' },
      { name: 'cantidadPuertos', label: 'Cant. Puertos', type: 'number' },
      { name: 'sitio', label: 'Sitio / Ubicación', type: 'text' }
    ]`
  },
  {
    path: 'D:/Desarrollo/MiniAgente-Inventario/inventario/inventario-front/src/pages/ServidorList.jsx',
    fields: `[
      { name: 'nombre', label: 'Nombre', type: 'text', required: true },
      { name: 'hostname', label: 'Hostname', type: 'text' },
      { name: 'ip', label: 'IP', type: 'text' },
      { name: 'sistemaOperativo', label: 'Sistema Operativo', type: 'text' },
      { name: 'cpu', label: 'CPU', type: 'text' },
      { name: 'ram', label: 'Memoria RAM', type: 'text' },
      { name: 'discoTotal', label: 'Disco Total', type: 'text' }
    ]`
  },
  {
    path: 'D:/Desarrollo/MiniAgente-Inventario/inventario/inventario-front/src/pages/MaquinaTesoreriaList.jsx',
    fields: `[
      { name: 'tipo', label: 'Tipo (Clasificadora, Validadora)', type: 'text', required: true },
      { name: 'modelo', label: 'Modelo', type: 'text' },
      { name: 'nroSerie', label: 'Nro Serie', type: 'text' },
      { name: 'vida', label: 'Vida Útil', type: 'text' },
      { name: 'estado', label: 'Estado', type: 'text' }
    ]`
  }
];

files.forEach(f => {
  let content = fs.readFileSync(f.path, 'utf8');

  // Replace fields array
  const regex = /fields=\{\[[\s\S]*?\]\}/g;
  content = content.replace(regex, `fields={${f.fields}}`);
  
  fs.writeFileSync(f.path, content, 'utf8');
  console.log('Updated fields for', f.path);
});
