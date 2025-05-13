import os
import json
import asyncio
import threading

from flask import (
    Flask, render_template, request, flash,
    redirect, url_for, session
)
from dotenv import load_dotenv
from models import db, Subscriber
import websockets  # pip install websockets

load_dotenv()

app = Flask(__name__)
app.config.update({
    "SECRET_KEY": os.getenv("SECRET_KEY", "change-me"),
    "SQLALCHEMY_DATABASE_URI": "sqlite:///subscribers.db",
    "SQLALCHEMY_TRACK_MODIFICATIONS": False,
})
db.init_app(app)

with app.app_context():
    db.create_all()


def get_current_subscriber():
    sid = session.get("subscriber_id")
    return Subscriber.query.get(sid) if sid else None


def validate_registration(form):
    acct = form.get("account_type")
    if acct not in ("personal", "organization"):
        return "Invalid account type."
    for f in ("first_name","last_name","email","telephone","address","password"):
        if not form.get(f):
            return f"{f.replace('_',' ').title()} is required."
    if acct == "organization" and not form.get("organization_name"):
        return "Organization Name is required for organization accounts."
    return None


async def websocket_push(msg: dict):
    url = os.getenv("WEBSOCKET_URL")
    if not url:
        return
    try:
        async with websockets.connect(url) as ws:
            await ws.send(json.dumps(msg))
    except:
        pass


def push_in_bg(data: dict):
    def _send():
        asyncio.run(websocket_push(data))
    threading.Thread(target=_send, daemon=True).start()


@app.route("/")
def landing():
    return render_template("landing.html", subscriber=get_current_subscriber())


@app.route("/register", methods=["GET", "POST"])
def register():
    if request.method == "POST":
        
        # ——— Prevent duplicate emails ————————————————————————————— #
        if Subscriber.query.filter_by(email=request.form["email"]).first():
            flash("That email is already registered. Please log in instead.", "error")
            return redirect(url_for("login"))

        error = validate_registration(request.form)        
        
        if error:
            flash(error, "error")
            return redirect(url_for("register"))

        acct_type = request.form["account_type"]
        # force "personal" org name on personal accounts
        org_name = (
            request.form.get("organization_name")
            if acct_type == "organization"
            else "personal"
        )

        sub = Subscriber(
            account_type      = request.form["account_type"],
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

        session["subscriber_id"] = sub.id
        flash("Registered successfully!", "success")
        return redirect(url_for("subscriptions"))

    return render_template("register.html", subscriber=get_current_subscriber())


@app.route("/login", methods=["GET", "POST"])
def login():
    if request.method == "POST":
        email = request.form["email"]
        pwd   = request.form["password"]
        sub = Subscriber.query.filter_by(email=email).first()
        if sub and sub.check_password(pwd):
            session["subscriber_id"] = sub.id
            flash("Logged in!", "success")
            return redirect(url_for("dashboard"))
        flash("Invalid email or password.", "error")
        return redirect(url_for("login"))

    return render_template("login.html", subscriber=get_current_subscriber())


@app.route("/subscriptions", methods=["GET", "POST"])
def subscriptions():
    sub = get_current_subscriber()
    if not sub:
        flash("Please register or log in first.", "error")
        return redirect(url_for("register"))

    plans_map = {
        "personal":    ["free", "basic", "pro"],
        "organization":["free", "basic", "pro", "enterprise"]
    }
    available = plans_map[sub.account_type]

    if request.method == "POST":
        plan = request.form["plan"]
        if plan not in available:
            flash("Invalid plan selected.", "error")
            return redirect(url_for("subscriptions"))

        return redirect(url_for("purchase", plan=plan))

    return render_template(
        "subscriptions.html",
        subscriber=sub,
        plans=available
    )


@app.route("/purchase/<plan>", methods=["GET", "POST"])
def purchase(plan):
    sub = get_current_subscriber()
    if not sub:
        flash("Please register or log in first.", "error")
        return redirect(url_for("register"))

    plan_limits = {
        "free":       {"max_users": 1,      "max_resources": 5},
        "basic":      {"max_users": 5,      "max_resources": 5},
        "pro":        {"max_users": 50,     "max_resources": 30},
        "enterprise": {"max_users": 10000,  "max_resources": 1000},
    }
    if plan not in plan_limits:
        flash("Unknown plan.", "error")
        return redirect(url_for("subscriptions"))

    if request.method == "POST":
        # dummy CC processing → in reality integrate Stripe/etc.
        sub.subscription_type = plan
        sub.max_users         = plan_limits[plan]["max_users"]
        sub.max_resources     = plan_limits[plan]["max_resources"]
        db.session.commit()

        # Now push to MERN
        push_in_bg(sub.to_dict())

        flash(f"Purchased the {plan.title()} plan!", "success")
        return redirect(url_for("dashboard"))

    return render_template("purchase.html", plan=plan, subscriber=sub)


@app.route("/dashboard")
def dashboard():
    sub = get_current_subscriber()
    if not sub or not sub.subscription_type:
        flash("Please choose and purchase a plan first.", "error")
        return redirect(url_for("subscriptions"))
    return render_template("dashboard.html", subscriber=sub)


@app.route("/logout")
def logout():
    session.clear()
    flash("Logged out.", "success")
    return redirect(url_for("landing"))


if __name__ == "__main__":
    # runs on port 8080 as requested
    app.run(host="0.0.0.0", port=8080, debug=True)
