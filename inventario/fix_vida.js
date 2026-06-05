const fs = require('fs');
const gridPath = 'D:/Desarrollo/MiniAgente-Inventario/inventario/inventario-front/src/components/InfraestructuraGrid.jsx';
let content = fs.readFileSync(gridPath, 'utf8');

if (!content.includes('Vida Útil:')) {
  // Replace the S/N logic to include vida, or actually, the S/N logic uses 'numeroSerie'. MaquinaTesoreria uses 'nroSerie'.
  // Let's fix that too.
  content = content.replace(
    /\{marcaModelo\} \{item\.numeroSerie \? \`[^\`]*\` \: ''\}/g,
    `{marcaModelo} {(item.numeroSerie || item.nroSerie) ? \` • S/N: \${item.numeroSerie || item.nroSerie}\` : ''}`
  );

  // Now the footer. We'll replace "Ubicación Física" rendering.
  // The original string is: <p className="text-slate-400 text-[10px]">Ubicacin Fsica:</p>
  // We'll use a regex that matches the div containing it.
  const regex = /(<div className="text-xs">\s*<p className="text-slate-400 text-\[10px\]">)Ubicaci[^\<]+(<\/p>\s*<p className="font-semibold text-slate-800 truncate max-w-\[120px\]"[^>]+>)\s*\{item\.sitio \|\| labelUbicacionEnum\(item\.ubicacion\) \|\| 'No especificada'\}\s*(<\/p>\s*<\/div>)/;
  
  const replacement = `$1{type === 'maquina-tesoreria' ? 'Vida Útil:' : 'Ubicación Física:'}$2
                    {type === 'maquina-tesoreria' 
                      ? (item.vida || 'No especificada') 
                      : (item.sitio || labelUbicacionEnum(item.ubicacion) || 'No especificada')}
                  $3`;
                  
  content = content.replace(regex, replacement);
  fs.writeFileSync(gridPath, content, 'utf8');
  console.log('Fixed grid footer for vida');
}
