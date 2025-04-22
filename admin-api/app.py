from flask import Flask, jsonify

app = Flask(__name__)

# Sample users data
users_data = {
    "users": [
        {
            "id": 3190,
            "name": "halo ako",
            "email": "beti123@admin.com",
            "address": "hk",
            "telephone": "123456789",
            "access_level": "5",
            "user_container_id": "4e745112c1f1",
            "backend_port": 5100,
            "couchdb_port": 6000,
            "redis_port": 6400,
            "organization_name":"haen",
            "max_permitted_user_amount": 5,
            "max_permitted_resource_amount": 5,
            "subscription_type": "free"
        },
        {
            "id": 3101,
            "name": "admin2@admin.com admin2@admin.com",
            "email": "admin2@admin.com",
            "address": "admin2@admin.com",
            "telephone": "12345678",
            "access_level": "5",
            "unique_id": "fcafb5cd",
            "backend_port": 5101,
            "couchdb_port": 6001,
            "redis_port": 6401,
            "max_permitted_user_amount": 1,
            "max_permitted_resource_amount": 5,
            "subscription_type": "free"
        },
        {
            "id": 3102,
            "name": "admin admin",
            "email": "admin4@admin.com",
            "address": "admin",
            "telephone": "12345678",
            "access_level": "5",
            "unique_id": "416ddf12",
            "backend_port": 5100,
            "couchdb_port": 6000,
            "redis_port": 6400,
            "max_permitted_user_amount": 1,
            "max_permitted_resource_amount": 5,
            "subscription_type": "free"
        },
        {
            "id": 3103,
            "name": "admin admin",
            "email": "admin5@admin.com",
            "address": "admin",
            "telephone": "12345678",
            "access_level": "5",
            "unique_id": "207eae30",
            "backend_port": 5101,
            "couchdb_port": 6001,
            "redis_port": 6401,
            "max_permitted_user_amount": 1,
            "max_permitted_resource_amount": 5,
            "subscription_type": "free"
        },
        {
            "id": 3104,
            "name": "admin admin",
            "email": "admin5@admin.com",
            "address": "admin",
            "telephone": "091100000",
            "access_level": "5",
            "unique_id": "f091cd91",
            "backend_port": 5100,
            "couchdb_port": 6000,
            "redis_port": 6400,
            "max_permitted_user_amount": 1,
            "max_permitted_resource_amount": 5,
            "subscription_type": "free"
        },
        {
            "id": 3105,
            "name": "admin8@admin.com admin8@admin.com",
            "email": "admin8@admin.com",
            "address": "admin8@admin.com",
            "telephone": "12345678",
            "access_level": "5",
            "unique_id": "9aa0517d",
            "backend_port": 5100,
            "couchdb_port": 6000,
            "redis_port": 6400,
            "max_permitted_user_amount": 1,
            "max_permitted_resource_amount": 5,
            "subscription_type": "free"
        },
        {
            "id": 3106,
            "name": "admin9@admin.com admin9@admin.com",
            "email": "admin9@admin.com",
            "address": "admin9@admin.com",
            "telephone": "123",
            "access_level": "5",
            "unique_id": "b8c69429",
            "backend_port": 5100,
            "couchdb_port": 6000,
            "redis_port": 6400,
            "max_permitted_user_amount": 1,
            "max_permitted_resource_amount": 5,
            "subscription_type": "free"
        },
        {
            "id": 3107,
            "name": "admin16@admin.com admin16@admin.com",
            "email": "admin16@admin.com",
            "address": "admin16@admin.com",
            "telephone": "34",
            "access_level": "5",
            "unique_id": "cf945e78",
            "backend_port": 5100,
            "couchdb_port": 6000,
            "redis_port": 6400,
            "max_permitted_user_amount": 50,
            "max_permitted_resource_amount": 30,
            "subscription_type": "pro"
        },
        {
            "id": 3108,
            "name": "admin15@admin.com admin15@admin.com",
            "email": "admin15@admin.com",
            "address": "admin15@admin.com",
            "telephone": "23",
            "access_level": "5",
            "unique_id": "ac136c4b",
            "backend_port": 5102,
            "couchdb_port": 6002,
            "redis_port": 6402,
            "max_permitted_user_amount": 1,
            "max_permitted_resource_amount": 5,
            "subscription_type": "free"
        }
    ]
}

@app.route('/api/users', methods=['GET'])
def get_users():
    return jsonify(users_data)
@app.route('/health')
def health_check():
    return jsonify({"status": "healthy"}), 200

@app.route('/ready')
def readiness_check():
    return jsonify({"status": "ready"}), 200
if __name__ == '__main__':
    app.run(host='0.0.0.0', port=8000, debug=True)