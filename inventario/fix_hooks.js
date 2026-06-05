const fs = require('fs');

const files = [
  'D:/Desarrollo/MiniAgente-Inventario/inventario/inventario-front/src/pages/NvrList.jsx',
  'D:/Desarrollo/MiniAgente-Inventario/inventario/inventario-front/src/pages/RouterList.jsx',
  'D:/Desarrollo/MiniAgente-Inventario/inventario/inventario-front/src/pages/SwitchList.jsx',
  'D:/Desarrollo/MiniAgente-Inventario/inventario/inventario-front/src/pages/ServidorList.jsx',
  'D:/Desarrollo/MiniAgente-Inventario/inventario/inventario-front/src/pages/MaquinaTesoreriaList.jsx'
];

files.forEach(f => {
  let content = fs.readFileSync(f.path || f, 'utf8');

  // Regex to capture the injected block
  const blockRegex = /\s*const \[isModalOpen[\s\S]*?handleModalSubmit = async \(e\) => \{[\s\S]*?^\s*};\n/m;
  const match = content.match(blockRegex);
  
  if (match) {
    const block = match[0];
    // Remove the block from its current location
    content = content.replace(block, '\n');

    // Find a good place to insert it (after `const navigate = useNavigate();` or similar)
    // All these files have `const [lista, setLista] = useState([]);`
    content = content.replace(/const \[lista, setLista\] = useState\(\[\]\);/, `const [lista, setLista] = useState([]);\n${block}\n`);

    fs.writeFileSync(f.path || f, content, 'utf8');
    console.log('Fixed', f.path || f);
  } else {
    console.log('Block not found in', f.path || f);
  }
});
