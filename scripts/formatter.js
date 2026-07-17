const { execSync } = require('child_process');

// Códigos ANSI para los colores de la terminal
const fondoVerde = '\x1b[42m\x1b[30m'; // Fondo verde (42) y texto negro (30) para contraste
const fondoRojo = '\x1b[41m\x1b[37m';  // Fondo rojo (41) y texto blanco (37)
const resetearColor = '\x1b[0m';       // Restablece el color normal de la terminal

console.log('Iniciando el formateo de archivos en app/...');

try {
  const comando = 'npx prettier --write "app/**/*.{js,css,html,json}"';
  
  execSync(comando, { stdio: 'inherit' });
  
  // Imprime el mensaje de éxito con fondo verde
  console.log(`${fondoVerde} ¡Formateo completado con éxito! ${resetearColor}`);
} catch {
  // Imprime el mensaje de error con fondo rojo
  console.error(`${fondoRojo} Ocurrió un error al formatear los archivos. ${resetearColor}`);
  process.exit(1); 
}
