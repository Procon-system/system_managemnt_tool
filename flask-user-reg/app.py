import asyncio, json, os, re
from dotenv import load_dotenv
from flask import Flask, render_template, request, flash, redirect, url_for
from models import db, Subscriber
import websockets
import threading

load_dotenv()

app = Flask(__name__)
app.config["SECRET_KEY"]      = "change-me"
app.config["SQLALCHEMY_DATABASE_URI"] = "sqlite:///subscribers.db"
app.config["SQLALCHEMY_TRACK_MODIFICATIONS"] = False

db.init_app(app)
# force table creation immediately at import time
with app.app_context():
    db.create_all()
    app.logger.info("Database tables created at import.")


# ---------- helpers --------------------------------------------------------- #

ID_RE          = re.compile(r"^\d{4}$")
TEL_RE         = re.compile(r"^\d{7,15}$")
ACCESS_SET     = {1,2,3,4,5}
PERMITTED_SET  = set(range(1,11))
SUBS_SET       = {"free","basic","pro","expert"}

def validate(form):
    """Very small server-side validation."""
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
    except KeyError as e:
        return f"Missing field: {e}"
    return None

async def websocket_push(message: dict):
    """Send JSON to the remote WebSocket server."""
    url = os.environ.get("WEBSOCKET_URL")
    print(url)
    if not url:
        app.logger.warning("WEBSOCKET_URL not set; skipping push")
        return
    try:
        async with websockets.connect(url) as ws:
            await ws.send(json.dumps(message))
    except Exception as exc:
        app.logger.error(f"WebSocket push failed: {exc}")

def push_in_background(data: dict):
    """Fire-and-forget helper for Flask routes."""
    def _send():
        # asyncio.run creates and tears down its own event loop
        try:
            asyncio.run(websocket_push(data))
        except Exception as e:
            app.logger.error(f"Background WS push failed: {e!r}")
    threading.Thread(target=_send, daemon=True).start()
    
# right after you call db.init_app(app):




# ---------- routes ---------------------------------------------------------- #

@app.route("/", methods=["GET", "POST"])
def register():
    if request.method == "POST":
        error = validate(request.form)
        if error:
            flash(error, "error")
            return redirect(url_for("register"))

        sub = Subscriber(
            id                          = int(request.form["id"]),
            name                        = request.form["name"],
            email                       = request.form["email"],
            address                     = request.form["address"],
            telephone                   = request.form["telephone"],
            access_level                = int(request.form["access_level"]),
            organization_name           = request.form["organization_name"],
            max_permitted_user_amount   = int(request.form["max_permitted_user_amount"]),
            max_permitted_resource_amount = int(request.form["max_permitted_resource_amount"]),
            subscription_type           = request.form["subscription_type"],
        )
        db.session.add(sub)
        db.session.commit()

        push_in_background(sub.to_dict())
        flash("Registration stored and sent!", "success")
        return redirect(url_for("register"))

    return render_template("register.html")

# ---------- CLI helper ------------------------------------------------------ #

@app.cli.command("db")
def init_db():
    """`flask db` – create tables if needed."""
    with app.app_context():
        db.create_all()
        print("Database initialized.")

if __name__ == "__main__":
    app.run(debug=True)
