from flask import Flask, render_template, request, jsonify, session, redirect, url_for, flash
from flask_sqlalchemy import SQLAlchemy
from flask_admin import Admin, AdminIndexView, expose
from flask_admin.contrib.sqla import ModelView
from flask_admin.form import Select2Widget
from werkzeug.security import generate_password_hash, check_password_hash
from datetime import datetime
from wtforms import Form, StringField, SelectField, PasswordField
from wtforms.fields import SelectField as WTFSelectField
from sqlalchemy import text
import os

app = Flask(__name__)
app.config['SECRET_KEY'] = 'your-secret-key-here'
app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///enrollment.db'
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False

db = SQLAlchemy(app)

class User(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(80), unique=True, nullable=False)
    password_hash = db.Column(db.String(120), nullable=False)
    role = db.Column(db.String(20), nullable=False) 
    first_name = db.Column(db.String(50), nullable=False)
    last_name = db.Column(db.String(50), nullable=False)
    
    def set_password(self, password):
        self.password_hash = generate_password_hash(password)
    
    def check_password(self, password):
        return check_password_hash(self.password_hash, password)
    
    def get_full_name(self):
        return f"{self.first_name} {self.last_name}"

class Course(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), nullable=False)
    teacher_id = db.Column(db.Integer, db.ForeignKey('user.id', ondelete='CASCADE'), nullable=False)
    time = db.Column(db.String(50), nullable=False)
    capacity = db.Column(db.Integer, nullable=False)
    
    teacher = db.relationship('User', backref=db.backref('courses_taught', cascade='all, delete-orphan'))
    enrollments = db.relationship('Enrollment', backref='course', cascade='all, delete-orphan')

class Enrollment(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    student_id = db.Column(db.Integer, db.ForeignKey('user.id', ondelete='CASCADE'), nullable=False)
    course_id = db.Column(db.Integer, db.ForeignKey('course.id', ondelete='CASCADE'), nullable=False)
    grade = db.Column(db.Integer, nullable=True)
    enrolled_date = db.Column(db.DateTime, default=datetime.utcnow)
    
    student = db.relationship('User', backref=db.backref('enrollments', cascade='all, delete-orphan'))
    
    __table_args__ = (db.UniqueConstraint('student_id', 'course_id', name='unique_enrollment'),)

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
        
        return self.render('admin/index.html', 
                         admin_view=self,
                         users_count=users_count,
                         courses_count=courses_count,
                         enrollments_count=enrollments_count)

class UserForm(Form):
    username = StringField('Username')
    first_name = StringField('First Name')
    last_name = StringField('Last Name')
    role = SelectField('Role', choices=[('student', 'Student'), ('teacher', 'Teacher'), ('admin', 'Admin')])
    password = PasswordField('Password', description='Leave blank to keep current password when editing')

class UserModelView(ModelView):
    def is_accessible(self):
        return session.get('user_role') == 'admin'
    
    column_list = ['username', 'first_name', 'last_name', 'role']
    form = UserForm
    can_delete = True
    page_size = 1000
    action_disallowed_list = ['delete']  
    
    def on_model_change(self, form, model, is_created):
        if hasattr(form, 'password') and form.password.data:
            model.set_password(form.password.data)
        elif is_created:
            model.set_password('defaultpassword123')
        
        super(UserModelView, self).on_model_change(form, model, is_created)
    
    def delete_model(self, model):
        try:
            username = model.username
            user_id = model.id
            
            courses_count = Course.query.filter_by(teacher_id=user_id).count()
            enrollments_count = Enrollment.query.filter_by(student_id=user_id).count()
            
            db.session.execute(text("DELETE FROM enrollment WHERE student_id = :user_id"), {"user_id": user_id})
            
            db.session.execute(text("DELETE FROM enrollment WHERE course_id IN (SELECT id FROM course WHERE teacher_id = :user_id)"), {"user_id": user_id})
            
            db.session.execute(text("DELETE FROM course WHERE teacher_id = :user_id"), {"user_id": user_id})
            
            db.session.execute(text("DELETE FROM user WHERE id = :user_id"), {"user_id": user_id})
            
            db.session.commit()
            
            try:
                if courses_count > 0 or enrollments_count > 0:
                    flash(f'User "{username}" had {courses_count} courses and {enrollments_count} enrollments. These were also deleted.', 'warning')
                flash(f'User "{username}" has been successfully deleted.', 'success')
            except RuntimeError:
                pass
                
            return True
        except Exception as e:
            db.session.rollback()
            try:
                flash(f'Error deleting user "{username}": {str(e)}', 'error')
            except RuntimeError:
                pass
            return False

class CourseModelView(ModelView):
    def is_accessible(self):
        return session.get('user_role') == 'admin'
    
    column_list = ['name', 'teacher', 'time', 'capacity']
    form_columns = ['name', 'teacher_id', 'time', 'capacity']
    action_disallowed_list = ['delete']
    
    column_formatters = {
        'teacher': lambda v, c, m, p: f"{m.teacher.first_name} {m.teacher.last_name}" if m.teacher else 'N/A'
    }
    
    form_overrides = {
        'teacher_id': WTFSelectField
    }
    
    def create_form(self):
        form = super(CourseModelView, self).create_form()
        teachers = User.query.filter_by(role='teacher').all()
        form.teacher_id.choices = [(t.id, f"{t.first_name} {t.last_name} ({t.username})") for t in teachers]
        return form
    
    def edit_form(self, obj):
        form = super(CourseModelView, self).edit_form(obj)
        teachers = User.query.filter_by(role='teacher').all()
        form.teacher_id.choices = [(t.id, f"{t.first_name} {t.last_name} ({t.username})") for t in teachers]
        return form

class EnrollmentModelView(ModelView):
    def is_accessible(self):
        return session.get('user_role') == 'admin'
    
    column_list = ['student', 'course', 'grade', 'enrolled_date']
    form_columns = ['student_id', 'course_id', 'grade']
    action_disallowed_list = ['delete']
    page_size = 1000
    
    column_formatters = {
        'student': lambda v, c, m, p: f"{m.student.first_name} {m.student.last_name}" if m.student else 'N/A',
        'course': lambda v, c, m, p: m.course.name if m.course else 'N/A',
        'enrolled_date': lambda v, c, m, p: m.enrolled_date.strftime('%Y-%m-%d') if m.enrolled_date else 'N/A'
    }
    
    form_overrides = {
        'student_id': WTFSelectField,
        'course_id': WTFSelectField
    }
    
    def create_form(self):
        form = super(EnrollmentModelView, self).create_form()
        students = User.query.filter_by(role='student').all()
        form.student_id.choices = [(s.id, f"{s.first_name} {s.last_name} ({s.username})") for s in students]
        
        courses = Course.query.all()
        form.course_id.choices = [(c.id, f"{c.name} - {c.teacher.first_name} {c.teacher.last_name}") for c in courses]
        
        return form
    
    def edit_form(self, obj):
        form = super(EnrollmentModelView, self).edit_form(obj)
        students = User.query.filter_by(role='student').all()
        form.student_id.choices = [(s.id, f"{s.first_name} {s.last_name} ({s.username})") for s in students]
        
        courses = Course.query.all()
        form.course_id.choices = [(c.id, f"{c.name} - {c.teacher.first_name} {c.teacher.last_name}") for c in courses]
        
        return form

admin = Admin(app, name='UC Merced Admin', index_view=SecureAdminIndexView())
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
    
    return render_template('login.html')

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
    
    user = User.query.get(session['user_id'])
    enrolled_courses = db.session.query(Course, Enrollment).join(Enrollment).filter(
        Enrollment.student_id == user.id
    ).all()
    
    all_courses = Course.query.all()
    
    return render_template('student_dashboard.html', 
                         enrolled_courses=enrolled_courses, 
                         all_courses=all_courses)

@app.route('/teacher')
def teacher_dashboard():
    if session.get('user_role') != 'teacher':
        return redirect(url_for('login'))
    
    user = User.query.get(session['user_id'])
    courses = Course.query.filter_by(teacher_id=user.id).all()
    
    return render_template('teacher_dashboard.html', courses=courses)

@app.route('/api/enroll', methods=['POST'])
def enroll_course():
    if session.get('user_role') != 'student':
        return jsonify({'success': False, 'message': 'Unauthorized'})
    
    course_id = request.json.get('course_id')
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
    
    course_id = request.json.get('course_id')
    student_id = session['user_id']
    
    enrollment = Enrollment.query.filter_by(student_id=student_id, course_id=course_id).first()
    if not enrollment:
        return jsonify({'success': False, 'message': 'Not enrolled in this course'})
    
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

@app.route('/api/course/<int:course_id>/students')
def get_course_students(course_id):
    if session.get('user_role') != 'teacher':
        return jsonify({'success': False, 'message': 'Unauthorized'})
    
    course = Course.query.get(course_id)
    if not course or course.teacher_id != session['user_id']:
        return jsonify({'success': False, 'message': 'Unauthorized'})
    
    enrollments = db.session.query(Enrollment, User).join(User).filter(
        Enrollment.course_id == course_id
    ).all()
    
    students = []
    for enrollment, user in enrollments:
        students.append({
            'id': enrollment.id,
            'name': user.get_full_name(),
            'grade': enrollment.grade
        })
    
    return jsonify({'success': True, 'students': students})

if __name__ == '__main__':
    with app.app_context():
        db.create_all()
        
        if User.query.count() == 0:
            admin = User(username='admin', role='admin', first_name='Admin', last_name='User')
            admin.set_password('admin123')
            db.session.add(admin)
            
            teachers_data = [
                ('ahepworth', 'Ammon', 'Hepworth', 'teacher123'),
                ('swalker', 'Susan', 'Walker', 'teacher123'),
                ('rjenkins', 'Ralph', 'Jenkins', 'teacher123')
            ]
            
            for username, first, last, password in teachers_data:
                teacher = User(username=username, role='teacher', first_name=first, last_name=last)
                teacher.set_password(password)
                db.session.add(teacher)
            
            students_data = [
                ('cnorris', 'Chuck', 'Norris', 'student123'),
                ('mnorris', 'Mindy', 'Norris', 'student123'),
                ('aranganath', 'Aditya', 'Ranganath', 'student123'),
                ('nlittle', 'Nancy', 'Little', 'student123'),
                ('ychen', 'Yi Wen', 'Chen', 'student123'),
                ('jstuart', 'John', 'Stuart', 'student123'),
                ('jsantos', 'Jose', 'Santos', 'student123'),
                ('bbrown', 'Betty', 'Brown', 'student123'),
                ('lcheng', 'Li', 'Cheng', 'student123'),
                ('mgarcia', 'Michael', 'Garcia', 'student123'),
                ('ewhite', 'Emily', 'White', 'student123'),
                ('rjohnson', 'Robert', 'Johnson', 'student123'),
                ('amartinez', 'Anna', 'Martinez', 'student123'),
                ('tkim', 'Thomas', 'Kim', 'student123'),
                ('jwilson', 'Jessica', 'Wilson', 'student123'),
                ('dclark', 'Daniel', 'Clark', 'student123'),
                ('smoore', 'Sophia', 'Moore', 'student123'),
                ('ataylor', 'Alex', 'Taylor', 'student123'),
                ('mhughes', 'Maya', 'Hughes', 'student123'),
                ('cwright', 'Chris', 'Wright', 'student123')
            ]
            
            for username, first, last, password in students_data:
                student = User(username=username, role='student', first_name=first, last_name=last)
                student.set_password(password)
                db.session.add(student)
            
            db.session.commit()
            
            courses_data = [
                ('Math 101', 4, 'MWF 10:00-10:50 AM', 8),  # Ralph Jenkins (ID 4)
                ('Physics 121', 3, 'TR 11:00-11:50 AM', 10),  # Susan Walker (ID 3)
                ('CS 106', 2, 'MWF 2:00-2:50 PM', 10),  # Ammon Hepworth (ID 2)
                ('CS 162', 2, 'TR 3:00-3:50 PM', 4)  # Ammon Hepworth (ID 2)
            ]
            
            for name, teacher_id, time, capacity in courses_data:
                course = Course(name=name, teacher_id=teacher_id, time=time, capacity=capacity)
                db.session.add(course)
            
            db.session.commit()
            
            enrollments_data = [
                # Math 101 (ID 1) - Ralph Jenkins
                (7, 1, 92), (8, 1, 65), (6, 1, 86), (9, 1, 77),
                # Physics 121 (ID 2) - Susan Walker
                (4, 2, 53), (9, 2, 85), (2, 2, 94), (6, 2, 91), (8, 2, 88),
                # CS 106 (ID 3) - Ammon Hepworth
                (3, 3, 93), (5, 3, 85), (4, 3, 57), (2, 3, 68),
                # CS 162 (ID 4) - Ammon Hepworth
                (3, 4, 99), (4, 4, 87), (5, 4, 92), (6, 4, 67)
            ]
            
            for student_id, course_id, grade in enrollments_data:
                enrollment = Enrollment(student_id=student_id, course_id=course_id, grade=grade)
                db.session.add(enrollment)
            
            db.session.commit()
    
    app.run(debug=True, port=5001)
