import json, os, re
import time
from dotenv import load_dotenv
from flask import Flask, render_template, request, flash, redirect, url_for
from models import db, Subscriber
import socketio
from socketio.exceptions import ConnectionError

# Load environment variables
load_dotenv()
SOCKETIO_URL = os.getenv("SOCKETIO_URL", "http://app:5000")

# Setup Socket.IO client
sio = socketio.Client(reconnection=True, reconnection_attempts=5, reconnection_delay=1, reconnection_delay_max=5)

# Setup Flask
app = Flask(__name__)
app.config["SECRET_KEY"] = "change-me"
app.config["SQLALCHEMY_DATABASE_URI"] = "sqlite:///subscribers.db"
app.config["SQLALCHEMY_TRACK_MODIFICATIONS"] = False

db.init_app(app)

with app.app_context():
    db.create_all()
    app.logger.info("Database tables created.")

def connect_with_retry(max_retries=5, initial_delay=1):
    """
    Attempt to connect to Socket.IO server with exponential backoff
    """
    retry_count = 0
    delay = initial_delay
    
    while retry_count < max_retries:
        try:
            if not sio.connected:
                print(f"Attempting to connect to Socket.IO server (attempt {retry_count + 1}/{max_retries})...")
                sio.connect(SOCKETIO_URL)
                print(f"✅ Connected to Socket.IO at {SOCKETIO_URL}")
                return True
            return True
        except ConnectionError as e:
            retry_count += 1
            if retry_count < max_retries:
                print(f"Connection failed, retrying in {delay} seconds...")
                time.sleep(delay)
                delay *= 2  # Exponential backoff
            else:
                print(f"❌ Failed to connect to Socket.IO after {max_retries} attempts: {e}")
                return False

# Establish connection when app starts
connect_with_retry()

# Setup event handlers for connection management
@sio.event
def connect():
    print("Successfully connected to Socket.IO server")

@sio.event
def disconnect():
    print("Disconnected from Socket.IO server, attempting to reconnect...")
    connect_with_retry()

# ---------- Helpers ----------------------------------------------------------

ID_RE = re.compile(r"^\d{4}$")
TEL_RE = re.compile(r"^\d{7,15}$")
ACCESS_SET = {1, 2, 3, 4, 5}
PERMITTED_SET = set(range(1, 11))
SUBS_SET = {"free", "basic", "pro", "expert"}
PWD_RE = re.compile(r"^(?=.*[A-Za-z])(?=.*\d).{8,}$")

def validate(form):
    try:
        if not ID_RE.fullmatch(form["id"]):
            return "ID must be a 4-digit number"
        if form["access_level"] not in map(str, ACCESS_SET):
            return "Access level must be 1-5"
        if form["max_permitted_user_amount"] not in map(str, PERMITTED_SET):
            return "Max users must be 1-10"
        if form["max_permitted_resource_amount"] not in map(str, PERMITTED_SET):
            return "Max resources must be 1-10"
        if form["subscription_type"] not in SUBS_SET:
            return "Subscription must be free/basic/pro/expert"
        if not TEL_RE.fullmatch(form["telephone"]):
            return "Telephone must be 7-15 digits"
        if not PWD_RE.fullmatch(form["password"]):
            return "Password must be at least 8 chars and include letters & numbers"
    except KeyError as e:
        return f"Missing field: {e}"
    return None

def broadcast_subscriber(data: dict):
    try:
        if not sio.connected:
            if not connect_with_retry():
                raise ConnectionError("Could not establish Socket.IO connection")
        
        sio.emit("subscriber_created", data)
        print("📤 Emitted subscriber_created event:", data)
    except Exception as e:
        print("❌ Failed to emit to Socket.IO:", e)
        # Optionally queue the data for later emission when connection is restored

# ---------- Routes ----------------------------------------------------------

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
        payload["password"] = request.form["password"]  # Only if needed, consider security

        broadcast_subscriber(payload)

        flash("Registration stored and sent!", "success")
        return redirect(url_for("register"))

    return render_template("register.html")

# ---------- CLI helper ------------------------------------------------------

@app.cli.command("db")
def init_db():
    with app.app_context():
        db.create_all()
        print("Database initialized.")

if __name__ == "__main__":
    app.run(debug=True, port=8500)