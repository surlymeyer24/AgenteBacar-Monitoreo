const fs = require('fs');

const files = [
  'D:/Desarrollo/MiniAgente-Inventario/inventario/inventario-front/src/pages/NvrList.jsx',
  'D:/Desarrollo/MiniAgente-Inventario/inventario/inventario-front/src/pages/RouterList.jsx',
  'D:/Desarrollo/MiniAgente-Inventario/inventario/inventario-front/src/pages/SwitchList.jsx',
  'D:/Desarrollo/MiniAgente-Inventario/inventario/inventario-front/src/pages/ServidorList.jsx',
  'D:/Desarrollo/MiniAgente-Inventario/inventario/inventario-front/src/pages/MaquinaTesoreriaList.jsx',
  'D:/Desarrollo/MiniAgente-Inventario/inventario/inventario-front/src/pages/CamaraList.jsx'
];

files.forEach(f => {
  let content = fs.readFileSync(f, 'utf8');

  // Check if onEditItem is already there
  if (!content.includes('onEditItem={handleOpenEditModal}')) {
    // Find <InfraestructuraGrid and insert onEditItem
    // Use regex to find the closing '/>' of InfraestructuraGrid
    content = content.replace(/(<InfraestructuraGrid[^>]+?)\/>/g, '$1\n          onEditItem={handleOpenEditModal}\n        />');
    fs.writeFileSync(f, content, 'utf8');
    console.log('Fixed', f);
  } else {
    console.log('Already has onEditItem', f);
  }
});
