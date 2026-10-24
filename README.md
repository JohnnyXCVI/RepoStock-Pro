# RepoStock Pro

Sistema de gestión de reposición, rutas, visitas, lotes y vencimientos.

## Ejecutar con XAMPP (Apache + PHP)

Apache/XAMPP no puede ejecutar directamente archivos `.ts` / `.tsx` en el
navegador. La aplicación React debe compilarse a JavaScript antes de servirla.

1. Tener Node.js instalado y Apache/PHP activos en XAMPP.
2. Instalar dependencias:

   ```bash
   npm install
   ```

3. Generar el build:

   ```bash
   npm run build
   ```

4. Abrir:

   ```text
   http://localhost/RepoStock/
   ```

`index.php` sirve `dist/index.html` y resuelve los assets compilados de
`dist/assets/`. El `.htaccess` hace que `index.php` sea la entrada principal,
aunque también se solicite `index.html`.

> Cada vez que modifiques archivos dentro de `src/`, vuelve a ejecutar
> `npm run build` para actualizar la versión que sirve Apache.

Si `dist/` no existe, `index.php` mostrará una guía con los comandos a ejecutar.

## Modo desarrollo (opcional)

Con Vite y recarga en caliente:

```bash
npm run dev
```

Disponible en `http://localhost:3000/`.

## Backend PHP / MySQL

El backend de referencia está en `backend-php/`:

```bash
mysql -u root -p < backend-php/schema.sql
```

Los endpoints quedan disponibles bajo `backend-php/api/`.
