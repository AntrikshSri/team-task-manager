import requests
import uuid

email = f"test_{uuid.uuid4().hex[:6]}@g.com"
requests.post('http://127.0.0.1:5000/api/auth/register', json={
    'username': email, 'email': email, 'password': '123', 'role': 'Admin'
})

resp = requests.post('http://127.0.0.1:5000/api/auth/login', json={
    'email': email, 'password': '123'
})
print("Login:", resp.status_code, resp.text)
token = resp.json().get('token')

resp2 = requests.get('http://127.0.0.1:5000/api/dashboard', headers={'Authorization': f'Bearer {token}'})
print("Dashboard:", resp2.status_code, resp2.text)

resp3 = requests.get('http://127.0.0.1:5000/api/projects', headers={'Authorization': f'Bearer {token}'})
print("Projects:", resp3.status_code, resp3.text)

resp4 = requests.get('http://127.0.0.1:5000/api/tasks', headers={'Authorization': f'Bearer {token}'})
print("Tasks:", resp4.status_code, resp4.text)

resp5 = requests.get('http://127.0.0.1:5000/api/users', headers={'Authorization': f'Bearer {token}'})
print("Users:", resp5.status_code, resp5.text)
