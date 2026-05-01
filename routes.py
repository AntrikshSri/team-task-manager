from flask import Blueprint, request, jsonify
from models import db, User, Project, Task
from flask_bcrypt import Bcrypt
from flask_jwt_extended import create_access_token, jwt_required, get_jwt_identity, get_jwt
from datetime import datetime

api_bp = Blueprint('api', __name__)
bcrypt = Bcrypt()

# --- Auth Routes ---
@api_bp.route('/auth/register', methods=['POST'])
def register():
    data = request.get_json()
    username = data.get('username')
    email = data.get('email')
    password = data.get('password')
    role = data.get('role', 'Member')

    if User.query.filter_by(email=email).first():
        return jsonify({'message': 'Email already registered'}), 400

    hashed_pw = bcrypt.generate_password_hash(password).decode('utf-8')
    new_user = User(username=username, email=email, password_hash=hashed_pw, role=role)
    db.session.add(new_user)
    db.session.commit()

    return jsonify({'message': 'User registered successfully'}), 201

@api_bp.route('/auth/login', methods=['POST'])
def login():
    data = request.get_json()
    email = data.get('email')
    password = data.get('password')

    user = User.query.filter_by(email=email).first()
    if user and bcrypt.check_password_hash(user.password_hash, password):
        access_token = create_access_token(identity=str(user.id), additional_claims={'role': user.role, 'username': user.username})
        return jsonify({'token': access_token, 'user': {'id': user.id, 'username': user.username, 'role': user.role}}), 200
    return jsonify({'message': 'Invalid credentials'}), 401

@api_bp.route('/users', methods=['GET'])
@jwt_required()
def get_users():
    users = User.query.all()
    return jsonify([{'id': u.id, 'username': u.username, 'role': u.role} for u in users])

# --- Project Routes ---
@api_bp.route('/projects', methods=['GET'])
@jwt_required()
def get_projects():
    from flask_jwt_extended import get_jwt
    current_user_id = int(get_jwt_identity())
    claims = get_jwt()
    role = claims.get('role')
    
    if role == 'Admin':
        projects = Project.query.filter_by(created_by=current_user_id).all()
    else:
        projects = Project.query.all()
    return jsonify([{
        'id': p.id,
        'name': p.name,
        'description': p.description,
        'created_by': p.created_by,
        'created_at': p.created_at.isoformat() if p.created_at else None
    } for p in projects])

@api_bp.route('/projects', methods=['POST'])
@jwt_required()
def create_project():
    current_user_id = int(get_jwt_identity())
    claims = get_jwt()
    if claims.get('role') != 'Admin':
        return jsonify({'message': 'Admin access required'}), 403

    data = request.get_json()
    new_project = Project(
        name=data.get('name'),
        description=data.get('description'),
        created_by=current_user_id
    )
    db.session.add(new_project)
    db.session.commit()
    return jsonify({'message': 'Project created successfully', 'id': new_project.id}), 201

@api_bp.route('/projects/<int:project_id>', methods=['PUT'])
@jwt_required()
def update_project(project_id):
    current_user_id = int(get_jwt_identity())
    claims = get_jwt()
    project = Project.query.get_or_404(project_id)
    
    if claims.get('role') != 'Admin' or project.created_by != current_user_id:
        return jsonify({'message': 'Unauthorized'}), 403

    data = request.get_json()
    if 'description' in data:
        project.description = data['description']
    if 'name' in data:
        project.name = data['name']

    db.session.commit()
    return jsonify({'message': 'Project updated successfully'})

# --- Task Routes ---
@api_bp.route('/tasks', methods=['GET'])
@jwt_required()
def get_tasks():
    from flask_jwt_extended import get_jwt
    current_user_id = int(get_jwt_identity())
    claims = get_jwt()
    role = claims.get('role')

    if role == 'Admin':
        admin_projects = Project.query.filter_by(created_by=current_user_id).all()
        admin_project_ids = [p.id for p in admin_projects]
        if admin_project_ids:
            tasks = Task.query.filter(Task.project_id.in_(admin_project_ids)).all()
        else:
            tasks = []
    else:
        tasks = Task.query.filter_by(assigned_to=claims.get('username')).all()
    result = []
    for t in tasks:
        result.append({
            'id': t.id,
            'title': t.title,
            'description': t.description,
            'status': t.status,
            'due_date': t.due_date.isoformat() if t.due_date else None,
            'project_id': t.project_id,
            'assigned_to': t.assigned_to,
            'created_at': t.created_at.isoformat() if t.created_at else None
        })
    return jsonify(result)

@api_bp.route('/tasks', methods=['POST'])
@jwt_required()
def create_task():
    current_user_id = int(get_jwt_identity())
    claims = get_jwt()
    if claims.get('role') != 'Admin':
        return jsonify({'message': 'Admin access required'}), 403

    data = request.get_json()
    due_date = None
    if data.get('due_date'):
        try:
            due_date = datetime.fromisoformat(data.get('due_date').replace('Z', '+00:00'))
        except ValueError:
            pass

    new_task = Task(
        title=data.get('title'),
        description=data.get('description'),
        status=data.get('status', 'To Do'),
        project_id=data.get('project_id'),
        assigned_to=data.get('assigned_to'),
        due_date=due_date
    )
    db.session.add(new_task)
    db.session.commit()
    return jsonify({'message': 'Task created successfully', 'id': new_task.id}), 201

@api_bp.route('/tasks/<int:task_id>', methods=['PUT'])
@jwt_required()
def update_task(task_id):
    current_user_id = int(get_jwt_identity())
    claims = get_jwt()
    task = Task.query.get_or_404(task_id)
    
    if claims.get('role') != 'Admin' and task.assigned_to != claims.get('username'):
        return jsonify({'message': 'Unauthorized'}), 403

    data = request.get_json()
    if 'status' in data:
        task.status = data['status']
    if 'title' in data and claims.get('role') == 'Admin':
        task.title = data['title']
    if 'description' in data and claims.get('role') == 'Admin':
        task.description = data['description']
    if 'assigned_to' in data and claims.get('role') == 'Admin':
        task.assigned_to = data['assigned_to']

    db.session.commit()
    return jsonify({'message': 'Task updated successfully'})

@api_bp.route('/dashboard', methods=['GET'])
@jwt_required()
def dashboard_stats():
    from flask_jwt_extended import get_jwt
    current_user_id = int(get_jwt_identity())
    claims = get_jwt()
    role = claims.get('role')
    
    tasks = Task.query.all()
    now = datetime.utcnow()
    
    if role == 'Admin':
        admin_projects = Project.query.filter_by(created_by=current_user_id).all()
        admin_project_ids = [p.id for p in admin_projects]
        my_tasks = [t for t in tasks if t.project_id in admin_project_ids]
        
        completed_tasks = [t for t in my_tasks if t.status == 'Done' and t.assigned_to]
        completed_by_users = {}
        for t in completed_tasks:
            if t.assigned_to not in completed_by_users:
                completed_by_users[t.assigned_to] = {'username': t.assigned_to, 'count': 0}
            completed_by_users[t.assigned_to]['count'] += 1
                
        member_completions = list(completed_by_users.values())
    else:
        my_tasks = [t for t in tasks if t.assigned_to == claims.get('username')]
        member_completions = []

    total_tasks = len(my_tasks)
    to_do = len([t for t in my_tasks if t.status == 'To Do'])
    in_progress = len([t for t in my_tasks if t.status == 'In Progress'])
    done = len([t for t in my_tasks if t.status == 'Done'])
    overdue = len([t for t in my_tasks if t.status != 'Done' and t.due_date and t.due_date < now])
    
    return jsonify({
        'total': total_tasks,
        'to_do': to_do,
        'in_progress': in_progress,
        'done': done,
        'overdue': overdue,
        'member_completions': member_completions
    })
