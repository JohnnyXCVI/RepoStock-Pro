<?php
/**
 * Punto de entrada para XAMPP / Apache.
 *
 * Apache no puede ejecutar archivos .tsx/.ts directamente en el navegador,
 * por eso la aplicacion React se compila con Vite y se sirve desde dist/.
 *
 * Uso:
 *   1. npm install
 *   2. npm run build
 *   3. Abrir http://localhost/RepoStock/
 */

declare(strict_types=1);

$distIndex = __DIR__ . '/dist/index.html';

header('Content-Type: text/html; charset=UTF-8');
header('Cache-Control: no-cache, no-store, must-revalidate');

if (!is_file($distIndex)) {
    http_response_code(503);
    ?>
<!doctype html>
<html lang="es">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>RepoStock Pro - Compilacion pendiente</title>
    <style>
      body { font-family: system-ui, sans-serif; background: #f8fafc; color: #1e293b; margin: 0; padding: 48px 24px; }
      .card { max-width: 640px; margin: 0 auto; background: #fff; border: 1px solid #e2e8f0; border-radius: 16px; padding: 32px; }
      h1 { font-size: 20px; margin: 0 0 12px; }
      p { line-height: 1.6; color: #475569; }
      pre { background: #0f172a; color: #e2e8f0; padding: 16px; border-radius: 10px; overflow-x: auto; }
      code { font-family: ui-monospace, SFMono-Regular, Consolas, monospace; }
    </style>
  </head>
  <body>
    <div class="card">
      <h1>La aplicacion todavia no esta compilada</h1>
      <p>Apache/XAMPP no ejecuta archivos <code>.ts</code> ni <code>.tsx</code>. Primero hay que generar el build web:</p>
      <pre><code>npm install
npm run build</code></pre>
      <p>Luego recarga <strong>http://localhost/RepoStock/</strong>.</p>
    </div>
  </body>
</html>
    <?php
    exit;
}

$html = file_get_contents($distIndex);

if ($html === false) {
    http_response_code(500);
    exit('No se pudo leer dist/index.html.');
}

/**
 * Los assets del build son relativos (./assets/...). El <base> hace que se
 * resuelvan contra dist/ aunque el index.php se sirva desde la raiz.
 */
$html = preg_replace(
    '/<head(\s[^>]*)?>/i',
    '$0' . "\n    <base href=\"./dist/\" />",
    $html,
    1
);

echo $html;
