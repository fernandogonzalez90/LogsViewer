Configurar el archivo user.txt con usuario y contraseña para el acceso.

sudo nano /etc/systemd/system/gunicorn.service

[Unit]
Description=Gunicorn instance para correr la aplicación de logs
# Se asegura de que la red esté disponible antes de iniciar el servicio
After=network.target

[Service]
# El usuario y grupo que ejecutará el servicio.
# Es una buena práctica no usar 'root'. Usa tu nombre de usuario.
User=tu_usuario
Group=tu_usuario_o_www-data

# El directorio de trabajo de tu proyecto.
# Reemplaza con la ruta absoluta a la carpeta de tu proyecto Flask.
WorkingDirectory=/ruta/absoluta/a/tu/proyecto

# El comando que ejecutará el servicio. Esta es la línea más importante.
# Reemplaza las rutas y el punto de entrada.
ExecStart=/ruta/absoluta/a/tu/proyecto/venv/bin/gunicorn --workers 3 --bind unix:gunicorn.sock -m 007 app:app

# Reiniciar el servicio si falla
Restart=always

[Install]
# Iniciar el servicio en el arranque del sistema
WantedBy=multi-user.target