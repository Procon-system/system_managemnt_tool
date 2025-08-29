
import os
import jwt
import json
import re
import time
import threading
from datetime import datetime, timedelta

from dotenv import load_dotenv
from flask import (
    Flask, render_template, request, flash,
    redirect, url_for, session
)
from models import db, Subscriber
from werkzeug.security import generate_password_hash, check_password_hash
import socketio
from socketio.exceptions import ConnectionError

MAX_CONNECTION_RETRIES = 10
CONNECTION_RETRY_DELAY_SECONDS = 5

# Load environment variables
load_dotenv()

# Secret for internal namespace authentication
INTERNAL_SECRET = os.getenv("INTERNAL_SOCKET_SECRET")
if not INTERNAL_SECRET:
    raise RuntimeError(
        "INTERNAL_SOCKET_SECRET is not set in your environment. "
        "Please add it to your .env file."
    )

# Flask service credentials
OWNER_EMAIL    = os.getenv("OWNER_EMAIL", "owner@example.com")
OWNER_PASSWORD = os.getenv("OWNER_PASSWORD", "ChangeMe123!")
JWT_SECRET     = os.getenv("JWT_TOKEN_KEY")
JWT_ALG        = "HS256"

# Socket.IO server details
SOCKETIO_URL       = os.getenv("SOCKETIO_URL", "http://app:5000")
INTERNAL_NAMESPACE = "/internal"
AUTH_PAYLOAD       = {"secret": INTERNAL_SECRET}

# Initialize Socket.IO client with reconnection
sio = socketio.Client(
    reconnection=True,
    reconnection_attempts=10,
    reconnection_delay=1,
    reconnection_delay_max=5,
)

def connect_to_socket_server():
    """
    Connect to the Socket.IO server with a retry mechanism.
    """
    if sio.connected:
        return True

    app.logger.info(f"Attempting to connect to Socket.IO server at {SOCKETIO_URL}...")
    
    for attempt in range(1, MAX_CONNECTION_RETRIES + 1):
        try:
            sio.connect(
                SOCKETIO_URL,
                namespaces=[INTERNAL_NAMESPACE],
                auth=AUTH_PAYLOAD,
                wait_timeout=10
            )
           
            return True
        except ConnectionError as e:
            app.logger.warning(
                f"Socket.IO connection attempt {attempt}/{MAX_CONNECTION_RETRIES} failed: {e}"
            )
            if attempt < MAX_CONNECTION_RETRIES:
                app.logger.info(f"Retrying in {CONNECTION_RETRY_DELAY_SECONDS} seconds...")
                time.sleep(CONNECTION_RETRY_DELAY_SECONDS)
            else:
                app.logger.error(
                    "All Socket.IO connection attempts failed. The application will continue "
                    "but real-time features will not work until a connection is made."
                )
    
    return False

# Event handlers on the internal namespace
@sio.on('connect', namespace=INTERNAL_NAMESPACE)
def on_connect():
    app.logger.info(f"Connected to Socket.IO (sid={sio.sid})")

@sio.on('disconnect', namespace=INTERNAL_NAMESPACE)
def on_disconnect():
    app.logger.warning("Disconnected -- automatic reconnection is active.")

@sio.on('ack', namespace=INTERNAL_NAMESPACE)
def on_ack(data):
    app.logger.info(f"Ack from server: {data!r}")

# Flask application setup
app = Flask(__name__)
app.config.update({
    "SECRET_KEY": os.getenv("FLASK_SECRET_KEY", "change-me"),
    "SQLALCHEMY_DATABASE_URI": "sqlite:///subscribers.db",
    "SQLALCHEMY_TRACK_MODIFICATIONS": False,
    "MERN_LOGIN_URL": os.getenv(
        'MERN_LOGIN_URL',
        'http://localhost:3000/auth/handoff'
    )
})

db.init_app(app)
with app.app_context():
    db.create_all()

# Ensure initial socket connection
connect_to_socket_server()

# Token generation for external service
def make_service_token():
    now = datetime.utcnow()
    payload = {
        "sub": "flask-service",
        "iat": now,
        "exp": now + timedelta(days=3650),
    }
    return jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALG)

# Broadcast helper using the internal namespace
def broadcast_subscriber(data: dict):
    payload = data.copy()
    payload["max_permitted_user_amount"]     = payload.pop("max_users", None)
    payload["max_permitted_resource_amount"] = payload.pop("max_resources", None)
    payload["name"] = f"{payload.get('first_name','')} {payload.get('last_name','')}".strip()

    if not sio.connected and not connect_to_socket_server():
        app.logger.error("Failed to connect -- skipping emit.")
        return

    app.logger.info(f"Emitting 'subscriber_created' -> {payload!r}")
    try:
        sio.emit(
            "subscriber_created",
            payload,
            namespace=INTERNAL_NAMESPACE
        )
    except Exception as e:
        app.logger.error(f"Emit failed: {e}")

# Fire-and-forget background push
def push_in_bg(data: dict):
    threading.Thread(
        target=broadcast_subscriber,
        args=(data,),
        daemon=True
    ).start()

# ——— NEW: Login‐emit helper ——————————————————————————————
def broadcast_login(data: dict):
    login_payload = {
        "type": "login",
        "data": {
            **data,
            "name": f"{data.get('first_name','')} {data.get('last_name','')}".strip()
        }
    }

    if not sio.connected and not connect_to_socket_server():
        app.logger.error("Skipping login emit—no connection")
        return

    app.logger.info(f"Emitting 'subscriber_login' -> {login_payload!r}")
    try:
        sio.emit(
            "subscriber_login",
            login_payload,
            namespace=INTERNAL_NAMESPACE
        )
    except Exception as e:
        app.logger.error(f"Login emit failed: {e}")

# Helpers & Validation:
def is_owner():
    return session.get("is_owner", False)

def get_current_subscriber():
    sid = session.get("subscriber_id")
    return Subscriber.query.get(sid) if sid else None

PASSWORD_RE = re.compile(
    r"""
    (?=.{8,})           # at least 8 chars
    (?=.*[a-z])         # at least one lowercase
    (?=.*[A-Z])         # at least one uppercase
    (?=.*\d)            # at least one digit
    (?=.*\W)            # at least one symbol
    """, re.VERBOSE
)

def validate_registration(form):
    acct = form.get("account_type")
    if acct not in ("personal", "organization"):
        return "Invalid account type."
    for f in ("first_name","last_name","email","telephone","address","password"):
        if not form.get(f):
            return f"{f.replace('_',' ').title()} is required."
    if not PASSWORD_RE.match(form["password"]):
        return (
            "Password must be at least 8 chars long and include one uppercase, "
            "one lowercase, one number, and one symbol."
        )
    if acct == "organization" and not form.get("organization_name"):
        return "Organization Name is required for organization accounts."
    return None
@app.route("/")
def landing():
    return render_template("landing.html", subscriber=get_current_subscriber())


@app.route("/register", methods=["GET","POST"])
def register():
    if request.method == "POST":
        if Subscriber.query.filter_by(email=request.form["email"]).first():
            flash("Email already registered. Please log in.", "error")
            return redirect(url_for("login"))

        error = validate_registration(request.form)
        if error:
            flash(error, "error")
            return redirect(url_for("register"))

        acct_type = request.form["account_type"]
        org_name = (
            request.form.get("organization_name")
            if acct_type == "organization"
            else "personal"
        )

        sub = Subscriber(
            account_type      = acct_type,
            first_name        = request.form["first_name"],
            last_name         = request.form["last_name"],
            email             = request.form["email"],
            telephone         = request.form["telephone"],
            address           = request.form["address"],
            organization_name = org_name,
        )
        sub.set_password(request.form["password"])
        db.session.add(sub)
        db.session.commit()

        session["raw_password"]  = request.form["password"]
        session["subscriber_id"] = sub.id
        flash("Registered successfully!", "success")
        return redirect(url_for("subscriptions"))

    return render_template("register.html", subscriber=get_current_subscriber())


@app.route("/login", methods=["GET","POST"])
def login():
    if request.method == "POST":
        email, pwd = request.form["email"], request.form["password"]

        if email == OWNER_EMAIL and pwd == OWNER_PASSWORD:
            session.clear()
            session["is_owner"] = True
            flash("Owner logged in.", "success")
            return redirect(url_for("owner_dashboard"))

        sub = Subscriber.query.filter_by(email=email).first()
        if sub and sub.check_password(pwd):
            session["subscriber_id"] = sub.id
            flash("Logged in!", "success")
            return redirect(url_for("dashboard"))

        flash("Invalid email or password.", "error")
        return redirect(url_for("login"))

    return render_template("login.html", subscriber=get_current_subscriber())


@app.route("/subscriptions", methods=["GET","POST"])
def subscriptions():
    sub = get_current_subscriber()
    if not sub:
        flash("Please register or log in first.", "error")
        return redirect(url_for("register"))

    plans_map = {
        "personal":    ["free","basic","pro"],
        "organization":["free","basic","pro","enterprise"]
    }
    available = plans_map[sub.account_type]

    if request.method == "POST":
        plan = request.form["plan"]
        if plan not in available:
            flash("Invalid plan.", "error")
            return redirect(url_for("subscriptions"))
        return redirect(url_for("purchase", plan=plan))

    return render_template(
        "subscriptions.html",
        subscriber=sub,
        plans=available
    )


@app.route("/purchase/<plan>", methods=["GET","POST"])
def purchase(plan):
    sub = get_current_subscriber()
    if not sub:
        flash("Please register or log in first.", "error")
        return redirect(url_for("register"))

    plan_limits = {
        "free":       {"max_users":1,     "max_resources":5},
        "basic":      {"max_users":5,     "max_resources":5},
        "pro":        {"max_users":50,    "max_resources":30},
        "enterprise": {"max_users":10000, "max_resources":1000},
    }
    if plan not in plan_limits:
        flash("Unknown plan.", "error")
        return redirect(url_for("subscriptions"))

    if request.method == "POST":
        sub.subscription_type = plan
        sub.max_users         = plan_limits[plan]["max_users"]
        sub.max_resources     = plan_limits[plan]["max_resources"]
        db.session.commit()

        # build and push the transformed payload
        payload = sub.to_dict()
        payload["password"] = session.get("raw_password", "")
        push_in_bg(payload)

        flash(f"Purchased the {plan.title()} plan!", "success")
        return redirect(url_for("dashboard"))

    return render_template("purchase.html", plan=plan, subscriber=sub)


# ——— NEW: Dashboard → external service route —————————————————————
@app.route("/go-tasknitter")
def go_tasknitter():
    sub = get_current_subscriber()
    if not sub:
        flash("Please log in first.", "error")
        return redirect(url_for("login"))

    # Build the raw payload
    payload = sub.to_dict()
    payload["flask_subscriber_id"] = sub.id 
    payload["password"] = session.get("raw_password", "")

    # Fire-and-forget login emit
    threading.Thread(
        target=broadcast_login,
        args=(payload,),
        daemon=True
    ).start()

    handoff_url = f"{app.config['MERN_LOGIN_URL']}?flaskId={sub.id}"
    return redirect(handoff_url)
@app.route("/dashboard")
def dashboard():
    sub = get_current_subscriber()
    if not sub or not sub.subscription_type:
        flash("Please choose and purchase a plan first.", "error")
        return redirect(url_for("subscriptions"))

    return render_template(
        "dashboard.html",
        subscriber=sub,
        # we’ll now use go_tasknitter instead of direct URL:
        go_tasknitter_url=url_for("go_tasknitter")
    )
@app.route("/owner")
def owner_dashboard():
    if not is_owner():
        flash("You must be the owner to access that page.", "error")
        return redirect(url_for("login"))

    all_subs = Subscriber.query.order_by(Subscriber.created_at.desc()).all()
    stats = {
        "personal_total": 0,
        "org_total":      0,
        "personal":       {"free":0,"basic":0,"pro":0,"none":0},
        "organization":   {"free":0,"basic":0,"pro":0,"enterprise":0,"none":0},
    }
    for s in all_subs:
        acct = (s.account_type or "").lower()
        plan = (s.subscription_type or "none").lower()
        if acct == "personal":
            stats["personal_total"] += 1
            stats["personal"][plan] += 1
        else:
            stats["org_total"] += 1
            stats["organization"][plan] += 1

    return render_template(
        "owner_dashboard.html",
        subscribers=all_subs,
        stats=stats
    )

@app.route("/logout")
def logout():
    session.clear()
    flash("Logged out.", "success")
    return redirect(url_for("landing"))


if __name__ == "__main__":
    # ensure connection before serving requests
    connect_to_socket_server()
    app.run(host="0.0.0.0", port=8500, debug=True)
