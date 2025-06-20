
import os
import time
import re
from dotenv import load_dotenv
from flask import Flask, render_template, request, flash, redirect, url_for
from models import db, Subscriber
import socketio
from socketio.exceptions import ConnectionError

# Load environment variables from .env file
load_dotenv()

# Get Node.js server details from environment
NODE_SERVER_URL = os.getenv("SOCKETIO_URL", "http://app:5000")
INTERNAL_SECRET = os.getenv("INTERNAL_SOCKET_SECRET")

if not INTERNAL_SECRET:
    raise ValueError("INTERNAL_SOCKET_SECRET is not set in the environment. Please add it to your .env file.")

# --- Socket.IO Client Setup ------------------------------------------------

# The auth dictionary is sent during the connection handshake
AUTH_PAYLOAD = {"secret": INTERNAL_SECRET}
INTERNAL_NAMESPACE = "/internal"

# Initialize the client with robust reconnection settings
sio = socketio.Client(reconnection=True, reconnection_attempts=10, reconnection_delay=5)

def connect_to_socket_server():
    """Attempt to connect to the Node.js server's internal namespace."""
    try:
        if sio.connected:
            return True
        
        print(f"Attempting to connect to Node.js at {NODE_SERVER_URL} on namespace '{INTERNAL_NAMESPACE}'...")
        sio.connect(
            NODE_SERVER_URL,
            namespaces=[INTERNAL_NAMESPACE],
            auth=AUTH_PAYLOAD
        )
        return True
    except ConnectionError as e:
        print(f"❌ Connection failed: {e}")
        return False

# --- Socket.IO Event Handlers (for the /internal namespace) ----------------

@sio.on('connect', namespace=INTERNAL_NAMESPACE)
def on_connect():
    """Handles successful connection to the internal namespace."""
    print(f"✅ Successfully connected to Node.js server. SID: {sio.sid}")

@sio.on('disconnect', namespace=INTERNAL_NAMESPACE)
def on_disconnect():
    """Handles disconnection from the server."""
    # The client will automatically try to reconnect due to `reconnection=True`
    print("🔌 Disconnected from Node.js server. Auto-reconnection is active.")

@sio.on('ack', namespace=INTERNAL_NAMESPACE)
def on_ack(data):
    """Listens for acknowledgement from the Node.js server."""
    print(f"📨 Acknowledgement received from Node.js: {data}")


# --- Flask Application Setup ----------------------------------------------

app = Flask(__name__)
app.config["SECRET_KEY"] = os.getenv("FLASK_SECRET_KEY", "a-secure-default-secret-key")
app.config["SQLALCHEMY_DATABASE_URI"] = "sqlite:///subscribers.db"
app.config["SQLALCHEMY_TRACK_MODIFICATIONS"] = False

db.init_app(app)

with app.app_context():
    db.create_all()



# --- Helpers & Business Logic ---------------------------------------------

def validate(form):
    # Your validation logic remains the same...
    ID_RE = re.compile(r"^\d{4}$")
    TEL_RE = re.compile(r"^\d{7,15}$")
    PWD_RE = re.compile(r"^(?=.*[A-Za-z])(?=.*\d).{8,}$")
    if not ID_RE.fullmatch(form["id"]): return "ID must be a 4-digit number"
    if not PWD_RE.fullmatch(form["password"]): return "Password must be at least 8 chars and include letters & numbers"
    # ...add other validation rules as needed
    return None

def broadcast_subscriber(data: dict):
    """
    Ensures connection and emits the 'subscriber_created' event to the internal namespace.
    """
    try:
        # If not connected, try to connect before emitting
        if not sio.connected and not connect_to_socket_server():
             print("❌ CRITICAL: Failed to connect to Socket.IO. Event not sent.")
             # Optionally, queue the message for later delivery
             return

        print(f"📤 Emitting 'subscriber_created' to namespace '{INTERNAL_NAMESPACE}'...")
        sio.emit("subscriber_created", data, namespace=INTERNAL_NAMESPACE)

    except Exception as e:
        print(f"❌ An unexpected error occurred while emitting to Socket.IO: {e}")

# --- Routes ----------------------------------------------------------------

@app.route("/", methods=["GET", "POST"])
def register():
    if request.method == "POST":
        error = validate(request.form)
        if error:
            flash(error, "error")
            return redirect(url_for("register"))

        sub = Subscriber(
            id=int(request.form["id"]),
            name=request.form["name"],
            email=request.form["email"],
            address=request.form["address"],
            telephone=request.form["telephone"],
            access_level=int(request.form["access_level"]),
            organization_name=request.form["organization_name"],
            max_permitted_user_amount=int(request.form["max_permitted_user_amount"]),
            max_permitted_resource_amount=int(request.form["max_permitted_resource_amount"]),
            subscription_type=request.form["subscription_type"],
        )

        sub.set_password(request.form["password"])
        db.session.add(sub)
        db.session.commit()

        payload = sub.to_dict()
        payload["password"] = request.form["password"]

        broadcast_subscriber(payload)

        flash("Registration stored and event sent to Node.js!", "success")
        return redirect(url_for("register"))

    return render_template("register.html")

# --- Main Execution --------------------------------------------------------

if __name__ == "__main__":
    # Use 0.0.0.0 to make it accessible within a Docker network
    app.run(host='0.0.0.0', debug=True, port=8500)