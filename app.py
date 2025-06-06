import os
from flask import Flask, render_template, request, abort, redirect, url_for, flash
# --- NUEVO ---
from flask_login import LoginManager, UserMixin, login_user, logout_user, login_required, current_user

app = Flask(__name__)
BASE_LOG_DIR = "/logs" # Asegúrate de que esta ruta exista y tenga permisos

# --- NUEVO: Clave secreta para sesiones seguras ---
# ¡Cámbiala por una cadena de caracteres aleatoria y segura!
app.secret_key = 'tu-clave-secreta-aqui'

# --- NUEVO: Configuración de Flask-Login ---
login_manager = LoginManager()
login_manager.init_app(app)
# Si un usuario no autenticado intenta acceder, será redirigido a 'login'.
login_manager.login_view = 'login'
login_manager.login_message = "Debes iniciar sesión para ver esta página de logs."
login_manager.login_message_category = "info"

# --- NUEVO: Modelo de Usuario simple ---
class User(UserMixin):
    def __init__(self, id):
        self.id = id

    @staticmethod
    def get(user_id):
        # Para este caso, el único usuario válido es 'admin'
        if user_id == get_credentials()[0]:
            return User(user_id)
        return None

# --- NUEVO: Carga de usuario para Flask-Login ---
@login_manager.user_loader
def load_user(user_id):
    return User.get(user_id)

# --- NUEVO: Función para leer credenciales ---
def get_credentials():
    """Lee el usuario y la contraseña desde el archivo user.txt."""
    try:
        with open('user.txt', 'r') as f:
            username, password = f.read().strip().split(':', 1)
            return username, password
    except (FileNotFoundError, ValueError):
        # Si el archivo no existe o está mal formateado, la app no funcionará.
        # En un caso real, manejarías este error de forma más robusta.
        print("Error: 'user.txt' no encontrado o con formato incorrecto. Debe ser 'usuario:contraseña'")
        return None, None

def safe_join(base, *paths):
    final_path = os.path.abspath(os.path.join(base, *paths))
    # os.path.commonpath es más seguro para prevenir ataques de Directory Traversal
    if os.path.commonpath([final_path, os.path.abspath(base)]) != os.path.abspath(base):
        abort(403)
    return final_path

# --- NUEVO: Ruta de Login ---
@app.route('/login', methods=['GET', 'POST'])
def login():
    if current_user.is_authenticated:
        return redirect(url_for('browse'))

    if request.method == 'POST':
        username_form = request.form['username']
        password_form = request.form['password']
        stored_username, stored_password = get_credentials()

        if stored_username and username_form == stored_username and password_form == stored_password:
            user = User.get(username_form)
            login_user(user)
            return redirect(url_for('browse'))
        else:
            flash('Usuario o contraseña incorrectos.', 'danger')

    return render_template('login.html')

# --- NUEVO: Ruta de Logout ---
@app.route('/logout')
@login_required
def logout():
    logout_user()
    flash('Has cerrado sesión correctamente.', 'success')
    return redirect(url_for('login'))

# --- NUEVO: Redirección desde la raíz ---
@app.route('/')
def index():
    return redirect(url_for('browse'))

# --- MODIFICADO: Ruta protegida ---
@app.route("/logs/", defaults={"req_path": ""})
@app.route("/logs/<path:req_path>")
@login_required # <-- ¡AQUÍ SE PROTEGE LA RUTA!
def browse(req_path):
    abs_path = safe_join(BASE_LOG_DIR, req_path)
    if not os.path.exists(abs_path):
        return abort(404)
    if os.path.isfile(abs_path):
        return view_log(req_path)
    files = sorted(os.listdir(abs_path))
    # Pasamos el usuario actual a la plantilla para mostrar su nombre
    return render_template("index.html", files=files, current_path=req_path, user=current_user)

# --- MODIFICADO: Ruta protegida ---
@app.route("/view_log/<path:file_path>")
@login_required # <-- ¡AQUÍ SE PROTEGE LA RUTA!
def view_log(file_path):
    abs_path = safe_join(BASE_LOG_DIR, file_path)
    query = request.args.get("q", "")

    if not os.path.isfile(abs_path):
        return abort(404)

    with open(abs_path, "r", errors="ignore") as f:
        all_lines = f.readlines()

    recent_lines = all_lines[-500:]
    highlight_lines = []
    if query:
        query_words = query.lower().split()
        for i, line in enumerate(recent_lines):
            line_lower = line.lower()
            if all(word in line_lower for word in query_words):
                highlight_lines.append(i)
    
    highlighted_lines = []
    match_index = 0
    for idx, line in enumerate(recent_lines):
        if idx in highlight_lines:
            highlighted_lines.append((match_index, line))
            match_index += 1
        else:
            highlighted_lines.append((None, line))

    return render_template(
        "view_log.html",
        highlighted_lines=highlighted_lines,
        file_path=file_path,
        query=query,
        user=current_user # Pasamos el usuario a la plantilla
    )

if __name__ == "__main__":
    app.run(debug=True, host='0.0.0.0')