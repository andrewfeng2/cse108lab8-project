from flask import Flask, render_template, request, jsonify, session, redirect, url_for, flash
from flask_sqlalchemy import SQLAlchemy
from flask_admin import Admin, AdminIndexView, expose
from flask_admin.contrib.sqla import ModelView
from werkzeug.security import generate_password_hash, check_password_hash
from datetime import datetime
app = Flask(__name__)
app.config['SECRET_KEY'] = 'your-secret-key-here'
app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///enrollment.db'
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
db = SQLAlchemy(app)

class User(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(80), unique=True, nullable=False)
    password_hash = db.Column(db.String(120), nullable=False)
    plain_password = db.Column(db.String(120), nullable=True)
    role = db.Column(db.String(20), nullable=False)
    first_name = db.Column(db.String(50), nullable=False)
    last_name = db.Column(db.String(50), nullable=False)
    def set_password(self, password):
        self.password_hash = generate_password_hash(password)
        self.plain_password = password
    def check_password(self, password):
        return check_password_hash(self.password_hash, password)
    def get_full_name(self):
        return f"{self.first_name} {self.last_name}"

class Course(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), nullable=False)
    teacher_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    time = db.Column(db.String(50), nullable=False)
    capacity = db.Column(db.Integer, nullable=False)
    teacher = db.relationship('User', backref='courses_taught')

class Enrollment(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    student_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    course_id = db.Column(db.Integer, db.ForeignKey('course.id'), nullable=False)
    grade = db.Column(db.Integer, nullable=True)
    enrolled_date = db.Column(db.DateTime, default=datetime.utcnow)
    student = db.relationship('User', backref='enrollments')
    course = db.relationship('Course', backref='enrollments')

class SecureAdminIndexView(AdminIndexView):
    def is_accessible(self):
        return session.get('user_role') == 'admin'
    def inaccessible_callback(self, name, **kwargs):
        return redirect(url_for('login'))

    @expose('/')
    def index(self):
        users_count = User.query.count()
        courses_count = Course.query.count()
        enrollments_count = Enrollment.query.count()
        return self.render('admin/index.html', admin_view=self, users_count=users_count, courses_count=courses_count, enrollments_count=enrollments_count)

class UserModelView(ModelView):
    def is_accessible(self):
        return session.get('user_role') == 'admin'
    column_list = ['username', 'first_name', 'last_name', 'role']
    page_size = 5
    def on_model_change(self, form, model, is_created):
        if form.password.data:
            model.set_password(form.password.data)
        elif is_created:
            model.set_password('defaultpassword123')

class CourseModelView(ModelView):
    def is_accessible(self):
        return session.get('user_role') == 'admin'
    column_list = ['name', 'teacher.first_name', 'teacher.last_name', 'time', 'capacity']

class EnrollmentModelView(ModelView):
    def is_accessible(self):
        return session.get('user_role') == 'admin'
    column_list = ['student.first_name', 'student.last_name', 'course.name', 'grade', 'enrolled_date']
admin = Admin(app, name='ACME University Admin', index_view=SecureAdminIndexView())
admin.add_view(UserModelView(User, db.session))
admin.add_view(CourseModelView(Course, db.session))
admin.add_view(EnrollmentModelView(Enrollment, db.session))

@app.route('/')

def index():
    if 'user_id' in session:
        return redirect(url_for('dashboard'))
    return redirect(url_for('login'))

@app.route('/login', methods=['GET', 'POST'])

def login():
    if request.method == 'POST':
        username = request.form['username']
        password = request.form['password']
        user = User.query.filter_by(username=username).first()
        if user and user.check_password(password):
            session['user_id'] = user.id
            session['username'] = user.username
            session['user_role'] = user.role
            session['user_name'] = user.get_full_name()
            return redirect(url_for('dashboard'))
        else:
            flash('Invalid username or password', 'error')
    admins = User.query.filter_by(role='admin').all()
    teachers = User.query.filter_by(role='teacher').all()
    students = User.query.filter_by(role='student').all()
    return render_template('login.html', admins=admins, teachers=teachers, students=students)

@app.route('/logout')

def logout():
    session.clear()
    return redirect(url_for('login'))

@app.route('/dashboard')

def dashboard():
    if 'user_id' not in session:
        return redirect(url_for('login'))
    user = User.query.get(session['user_id'])
    if user.role == 'student':
        return redirect(url_for('student_dashboard'))
    elif user.role == 'teacher':
        return redirect(url_for('teacher_dashboard'))
    elif user.role == 'admin':
        return redirect('/admin')
    return redirect(url_for('login'))

@app.route('/student')

def student_dashboard():
    if session.get('user_role') != 'student':
        return redirect(url_for('login'))
    return render_template('student_dashboard.html')

@app.route('/teacher')

def teacher_dashboard():
    if session.get('user_role') != 'teacher':
        return redirect(url_for('login'))
    user = User.query.get(session['user_id'])
    courses = Course.query.filter_by(teacher_id=user.id).all()
    return render_template('teacher_dashboard.html', courses=courses)

@app.route('/api/current-user')

def get_current_user():
    if 'user_id' not in session:
        return jsonify({'success': False, 'message': 'Not logged in'})
    return jsonify({'success': True, 'user': {'id': session.get('user_id'), 'username': session.get('username'), 'name': session.get('user_name'), 'role': session.get('user_role')}})

@app.route('/api/enroll', methods=['POST'])

def enroll_course():
    if session.get('user_role') != 'student':
        return jsonify({'success': False, 'message': 'Unauthorized'})
    course_id = int(request.json.get('course_id'))
    student_id = session['user_id']
    existing = Enrollment.query.filter_by(student_id=student_id, course_id=course_id).first()
    if existing:
        return jsonify({'success': False, 'message': 'Already enrolled in this course'})
    course = Course.query.get(course_id)
    current_enrollments = Enrollment.query.filter_by(course_id=course_id).count()
    if current_enrollments >= course.capacity:
        return jsonify({'success': False, 'message': 'Course is at capacity'})
    enrollment = Enrollment(student_id=student_id, course_id=course_id)
    db.session.add(enrollment)
    db.session.commit()
    return jsonify({'success': True, 'message': 'Successfully enrolled'})

@app.route('/api/unenroll', methods=['POST'])

def unenroll_course():
    if session.get('user_role') != 'student':
        return jsonify({'success': False, 'message': 'Unauthorized'})
    course_id = int(request.json.get('course_id'))
    student_id = session['user_id']
    enrollment = Enrollment.query.filter_by(student_id=student_id, course_id=course_id).first()
    if not enrollment:
        return jsonify({'success': False, 'message': 'Not enrolled in this course'})
    if enrollment.grade is not None:
        return jsonify({'success': False, 'message': 'Cannot unenroll from a course after a grade has been assigned'})
    db.session.delete(enrollment)
    db.session.commit()
    return jsonify({'success': True, 'message': 'Successfully removed from course'})

@app.route('/api/update_grade', methods=['POST'])

def update_grade():
    if session.get('user_role') != 'teacher':
        return jsonify({'success': False, 'message': 'Unauthorized'})
    enrollment_id = request.json.get('enrollment_id')
    grade = request.json.get('grade')
    enrollment = Enrollment.query.get(enrollment_id)
    if not enrollment:
        return jsonify({'success': False, 'message': 'Enrollment not found'})
    course = Course.query.get(enrollment.course_id)
    if course.teacher_id != session['user_id']:
        return jsonify({'success': False, 'message': 'Unauthorized'})
    enrollment.grade = grade
    db.session.commit()
    return jsonify({'success': True, 'message': 'Grade updated'})

@app.route('/api/student/enrolled-courses')

def get_enrolled_courses():
    if session.get('user_role') != 'student':
        return jsonify({'success': False, 'message': 'Unauthorized'})
    student_id = session['user_id']
    enrollments = Enrollment.query.filter_by(student_id=student_id).all()
    courses_data = []
    for enrollment in enrollments:
        course = Course.query.get(enrollment.course_id)
        teacher = User.query.get(course.teacher_id)
        enrolled_count = Enrollment.query.filter_by(course_id=course.id).count()
        courses_data.append({'id': course.id, 'name': course.name, 'teacher_name': f"{teacher.first_name} {teacher.last_name}", 'time': course.time, 'enrolled': enrolled_count, 'capacity': course.capacity, 'grade': enrollment.grade})
    return jsonify({'success': True, 'courses': courses_data})

@app.route('/api/student/available-courses')

def get_available_courses():
    if session.get('user_role') != 'student':
        return jsonify({'success': False, 'message': 'Unauthorized'})
    student_id = session['user_id']
    all_courses = Course.query.all()
    courses_data = []
    for course in all_courses:
        teacher = User.query.get(course.teacher_id)
        enrolled_count = Enrollment.query.filter_by(course_id=course.id).count()
        is_enrolled = Enrollment.query.filter_by(student_id=student_id, course_id=course.id).first() is not None
        courses_data.append({'id': course.id, 'name': course.name, 'teacher_name': f"{teacher.first_name} {teacher.last_name}", 'time': course.time, 'enrolled': enrolled_count, 'capacity': course.capacity, 'is_enrolled': is_enrolled})
    return jsonify({'success': True, 'courses': courses_data})

@app.route('/api/teacher/remove-student', methods=['POST'])

def remove_student():
    if session.get('user_role') != 'teacher':
        return jsonify({'success': False, 'message': 'Unauthorized'})
    enrollment_id = request.json.get('enrollment_id')
    enrollment = Enrollment.query.get(enrollment_id)
    if not enrollment:
        return jsonify({'success': False, 'message': 'Enrollment not found'})
    course = Course.query.get(enrollment.course_id)
    if course.teacher_id != session['user_id']:
        return jsonify({'success': False, 'message': 'Unauthorized'})
    db.session.delete(enrollment)
    db.session.commit()
    return jsonify({'success': True, 'message': 'Student removed from course'})

@app.route('/api/teacher/courses')

def get_teacher_courses():
    if session.get('user_role') != 'teacher':
        return jsonify({'success': False, 'message': 'Unauthorized'})
    user = User.query.get(session['user_id'])
    courses = Course.query.filter_by(teacher_id=user.id).all()
    courses_data = []
    for course in courses:
        enrolled_count = Enrollment.query.filter_by(course_id=course.id).count()
        courses_data.append({'id': course.id, 'name': course.name, 'time': course.time, 'capacity': course.capacity, 'enrolled': enrolled_count, 'teacher_name': user.get_full_name()})
    return jsonify({'success': True, 'courses': courses_data})

@app.route('/api/course/<int:course_id>/students')

def get_course_students(course_id):
    if session.get('user_role') != 'teacher':
        return jsonify({'success': False, 'message': 'Unauthorized'})
    course = Course.query.get(course_id)
    if not course or course.teacher_id != session['user_id']:
        return jsonify({'success': False, 'message': 'Unauthorized'})
    enrollments = Enrollment.query.filter_by(course_id=course_id).all()
    students = []
    for enrollment in enrollments:
        user = User.query.get(enrollment.student_id)
        students.append({'id': enrollment.id, 'name': user.get_full_name(), 'grade': enrollment.grade})
    return jsonify({'success': True, 'students': students})
if __name__ == '__main__':
    with app.app_context():
        db.create_all()
    app.run(debug=True, port=5001)
