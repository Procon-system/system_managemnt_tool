from flask_sqlalchemy import SQLAlchemy

db = SQLAlchemy()

class Subscriber(db.Model):
    id                          = db.Column(db.Integer, primary_key=True)  # 4-digit ID
    name                        = db.Column(db.String(80),  nullable=False)
    email                       = db.Column(db.String(120), nullable=False)
    address                     = db.Column(db.String(120), nullable=False)
    telephone                   = db.Column(db.String(20),  nullable=False)
    access_level                = db.Column(db.Integer,               nullable=False)
    organization_name           = db.Column(db.String(120), nullable=False)
    max_permitted_user_amount   = db.Column(db.Integer,               nullable=False)
    max_permitted_resource_amount = db.Column(db.Integer,             nullable=False)
    subscription_type           = db.Column(db.String(20),  nullable=False)

    def to_dict(self):
        return {
            "id":                           self.id,
            "name":                         self.name,
            "email":                        self.email,
            "address":                      self.address,
            "telephone":                    self.telephone,
            "access_level":                 self.access_level,
            "organization_name":            self.organization_name,
            "max_permitted_user_amount":    self.max_permitted_user_amount,
            "max_permitted_resource_amount":self.max_permitted_resource_amount,
            "subscription_type":            self.subscription_type,
        }
