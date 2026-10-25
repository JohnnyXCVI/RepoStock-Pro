# RepoStock Pro

Sistema de gestión de reposición, rutas, visitas, lotes y vencimientos.

## Acerca de esta version

RepoStock Pro es un sistema de gestión de reposición de productos, rutas, visitas, lotes y vencimientos.

Version: 2.4.0

Servidor de base de datos
- Servidor: 127.0.0.1 via TCP/IP
- Tipo de servidor: MariaDB
- Versión del servidor: 10.1.30-MariaDB - mariadb.org binary distribution
- Versión del protocolo: 10
- Usuario: root@localhost
- Conjunto de caracteres del servidor: UTF-8 Unicode (utf8)

Servidor web
- Apache/2.4.29 (Win32) OpenSSL/1.1.0g PHP/7.2.2
- Versión del cliente de base de datos: libmysql - mysqlnd 5.0.12-dev - 20150407 - $Id: 38fea24f2847fa7519001be390c98ae0acafe387 $
- Extensión PHP: mysqli, curl, mbstring
- Versión de PHP: 7.2.2

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

## login/autenticación

El sistema cuenta con una autenticacion para el usuario para mayor seguridad y protección de los datos
Usuario inicial para loguearse es:
- Usuario: admin
- Contraseña: [admin123]

## El problema
Para entender el problema cada repositor o un equipo de la misma, debe realizar una serie de tareas en los puntos de venta que visita, estas tareas pueden variar dependiendo del dia, la hora, la ruta de recorrido(intinerario), la cantidad de repositores asignados a cada ruta, etc. El objetivo del sistema es digitalizar y gestionar estas tareas, permitiendo a ellos realizar sus tareas de manera eficiente y a los gerentes tener una visión general del trabajo de los repositores.

## Cómo usar el sistema

En el primer menú se encontrará el resumen general de la aplicación. El mismo permite ver información en tiempo real sobre el sistema. al darle click en un botón o enlace, el usuario será redirigido a la sección correspondiente.

en Referenciales encontramos con los sigunentes submenus: 
* Tipo Punto de Venta: permite gestionar los tipos de puntos de venta
* Categoria productos: permite gestionar las categorias de productos
* Marca: permite gestionar las marcas de productos
* Unidad medida: permite gestionar las unidades de medida de los productos
* Estado general: permite gestionar los estados de los productos
* Prioridad: permite gestionar las prioridades de los productos
* Motivo incidencia: permite gestionar los motivos de los productos
* Tipo incidente: permite gestionar los tipos de incidentes de los productos

Al darle click en "Nuevo" se desplegara un formulario que permitira agregar un nuevo registro a la tabla correspondiente.

En Personal y puntos de ventas cuenta con los siguientes submenus: 
* Repositores: permite gestionar los repositores de la empresa
* Puntos de ventas: permite gestionar los puntos de ventas de la empresa

Productos y Precios esta compuesto por: 
* Productos: permite gestionar los productos de la empresa
* Productos puntos de venta: permite gestionar los productos de los puntos de ventas

Lotes y Vencimientos es donde se gestiona la informacion sobre los lotes y vencimientos de los productos. Con solo un click en "Nuevo" se desplegara un formulario que permitira agregar un nuevo registro a la tabla correspondiente.

Planificacion de Rutas muestra la informacion sobre las rutas y visitas de los repositores a los puntos de ventas. consta de tarjetas con la informacion de la ruta, fecha, hora y el funcionario asignado. Al hacer clic en una tarjeta se mostrara el detalle de la ruta unto con la informacion de las paradas que puede hacer el repositor en dicha ruta.

Visitas es donde se muestra la informacion sobre las visitas de los repositores a los puntos de ventas. consta de tarjetas con la informacion de la visita, fecha, hora y el funcionario asignado. Al hacer clic en una tarjeta se mostrara el detalle de la visita unto con la informacion del repositor y los productos que debe reponer o auditar.

Reposiciones es donde se muestra la informacion sobre las reposiciones que deben hacer los repositores a los puntos de ventas. consta de tarjetas con la informacion de la reposicion, fecha, hora y el funcionario asignado. Al hacer clic en una tarjeta se mostrara el detalle de la reposicion unto con la informacion del repositor y los productos que debe reponer.

Pedidos de Productos es donde se muestra la informacion sobre los pedidos de productos que deben hacer los repositores a los puntos de ventas. consta de tarjetas con la informacion de la pedido, fecha, hora y el funcionario asignado. Al hacer clic en una tarjeta se mostrara el detalle de la pedido unto con la informacion del repositor y detalle de productos con cantidades recibidas y solicitadas.

Incidencias es donde se muestra la informacion sobre las incidencias que deben hacer los repositores a los puntos de ventas. consta de tarjetas con la informacion de la incidencia, fecha, hora y el funcionario asignado. Al hacer clic en una tarjeta se mostrara el detalle de la incidencia unto con la informacion del repositor y el detalle de incidencia de los productos afectados.