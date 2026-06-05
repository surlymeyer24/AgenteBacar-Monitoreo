const fs = require('fs');

const files = [
  'D:/Desarrollo/MiniAgente-Inventario/inventario/inventario-front/src/pages/NvrList.jsx',
  'D:/Desarrollo/MiniAgente-Inventario/inventario/inventario-front/src/pages/RouterList.jsx',
  'D:/Desarrollo/MiniAgente-Inventario/inventario/inventario-front/src/pages/SwitchList.jsx',
  'D:/Desarrollo/MiniAgente-Inventario/inventario/inventario-front/src/pages/ServidorList.jsx',
  'D:/Desarrollo/MiniAgente-Inventario/inventario/inventario-front/src/pages/MaquinaTesoreriaList.jsx'
];

files.forEach(f => {
  let content = fs.readFileSync(f, 'utf8');

  // Inject onEditItem right before onItemClick
  if (!content.includes('onEditItem={handleOpenEditModal}')) {
    content = content.replace(/onItemClick=\{/g, 'onEditItem={handleOpenEditModal}\n            onItemClick={');
    fs.writeFileSync(f, content, 'utf8');
    console.log('Successfully added to', f);
  } else {
    console.log('Already exists in', f);
  }
});
