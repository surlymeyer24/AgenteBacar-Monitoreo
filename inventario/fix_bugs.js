const fs = require('fs');

// 1. Fix NvrList.jsx missing 'ubicacion' field
const nvrPath = 'D:/Desarrollo/MiniAgente-Inventario/inventario/inventario-front/src/pages/NvrList.jsx';
let nvrContent = fs.readFileSync(nvrPath, 'utf8');

if (!nvrContent.includes("name: 'ubicacion'")) {
  nvrContent = nvrContent.replace(
    /\{\s*name:\s*'cantidadCanales',\s*label:\s*'Canales',\s*type:\s*'number'\s*\}/,
    "{ name: 'cantidadCanales', label: 'Canales', type: 'number' },\n        { name: 'ubicacion', label: 'Ubicación / Sitio', type: 'text' }"
  );
  fs.writeFileSync(nvrPath, nvrContent, 'utf8');
  console.log('Fixed NvrList.jsx');
}

// 2. Fix InfraestructuraGrid.jsx MaquinaTesoreria name display
const gridPath = 'D:/Desarrollo/MiniAgente-Inventario/inventario/inventario-front/src/components/InfraestructuraGrid.jsx';
let gridContent = fs.readFileSync(gridPath, 'utf8');

if (!gridContent.includes("const displayNombre = ")) {
  const replaceTarget = `                <h3 className="font-bold text-slate-950 group-hover:text-[#0c66e4] transition-colors line-clamp-1 leading-tight" title={item.nombre || 'Sin nombre'}>
                  {item.nombre || 'Sin nombre'}
                </h3>`;
  
  const replacement = `                {(() => {
                  let displayNombre = item.nombre;
                  if (!displayNombre) {
                    if (type === 'maquina-tesoreria') {
                      displayNombre = \`MTes-\${item.modelo || item.tipo || 'Generica'}\`;
                    } else {
                      displayNombre = 'Sin nombre';
                    }
                  }
                  return (
                    <h3 className="font-bold text-slate-950 group-hover:text-[#0c66e4] transition-colors line-clamp-1 leading-tight" title={displayNombre}>
                      {displayNombre}
                    </h3>
                  );
                })()}`;
  
  gridContent = gridContent.replace(replaceTarget, replacement);
  fs.writeFileSync(gridPath, gridContent, 'utf8');
  console.log('Fixed InfraestructuraGrid.jsx');
}
