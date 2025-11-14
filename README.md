# ACME University Student Enrollment System

A comprehensive web application for managing student enrollment, course management, and grade tracking built with Flask.

## Features

### Student Features
- Log in/out of the application
- View all enrolled courses with grades
- Browse all available courses
- See course capacity and enrollment numbers
- Enroll in new courses (if capacity allows)

### Teacher Features
- Log in/out of the application
- View all courses they teach
- See enrolled students for each course
- Edit student grades
- View course enrollment statistics

### Admin Features
- Full CRUD operations on all data
- Flask-Admin interface for database management
- User management (students, teachers, admins)
- Course management
- Enrollment and grade management

## Installation

1. **Clone or download the project files**

2. **Install Python dependencies:**
   ```bash
   pip install -r requirements.txt
   ```

3. **Run the application:**
   ```bash
   python app.py
   ```

4. **Access the application:**
   - Open your web browser and go to `http://localhost:5001`
   - The database will be automatically created with sample data

## Demo Accounts

### Student Account
- **Username:** `cnorris`
- **Password:** `student123`
- **Name:** Chuck Norris

### Teacher Account
- **Username:** `ahepworth`
- **Password:** `teacher123`
- **Name:** Dr. Ammon Hepworth

### Admin Account
- **Username:** `admin`
- **Password:** `admin123`
- **Name:** Admin User

## Sample Data

The application comes pre-loaded with sample data including:

### Courses
- **Math 101** - Ralph Jenkins (MWF 10:00-10:50 AM, Capacity: 8)
- **Physics 121** - Susan Walker (TR 11:00-11:50 AM, Capacity: 10)
- **CS 106** - Ammon Hepworth (MWF 2:00-2:50 PM, Capacity: 10)
- **CS 162** - Ammon Hepworth (TR 3:00-3:50 PM, Capacity: 4)

### Students
- Chuck Norris, Mindy Norris, Aditya Ranganath, Nancy Little, Yi Wen Chen, John Stuart, Jose Santos, Betty Brown, Li Cheng

### Teachers
- Ammon Hepworth, Susan Walker, Ralph Jenkins

## Project Structure

```
Lab 8/
├── app.py                 # Main Flask application
├── requirements.txt       # Python dependencies
├── README.md             # This file
├── templates/            # HTML templates
│   ├── base.html         # Base template
│   ├── login.html        # Login page
│   ├── student_dashboard.html  # Student interface
│   └── teacher_dashboard.html  # Teacher interface
└── static/               # Static files
    ├── css/
    │   └── style.css     # Main stylesheet
    └── js/
        └── main.js       # JavaScript functionality
```

## API Endpoints

### Authentication
- `GET /` - Redirects to login or dashboard
- `GET /login` - Login page
- `POST /login` - Process login
- `GET /logout` - Logout user

### Student Routes
- `GET /student` - Student dashboard
- `POST /api/enroll` - Enroll in a course

### Teacher Routes
- `GET /teacher` - Teacher dashboard
- `GET /api/course/<id>/students` - Get students for a course
- `POST /api/update_grade` - Update student grade

### Admin Routes
- `GET /admin` - Flask-Admin interface

## Database Schema

### Users Table
- `id` - Primary key
- `username` - Unique username
- `password_hash` - Hashed password
- `role` - User role (student, teacher, admin)
- `first_name` - User's first name
- `last_name` - User's last name

### Courses Table
- `id` - Primary key
- `name` - Course name
- `teacher_id` - Foreign key to Users table
- `time` - Course schedule
- `capacity` - Maximum enrollment

### Enrollments Table
- `id` - Primary key
- `student_id` - Foreign key to Users table
- `course_id` - Foreign key to Courses table
- `grade` - Student's grade (nullable)
- `enrolled_date` - Enrollment timestamp

## Technologies Used

- **Backend:** Flask, SQLAlchemy, Flask-Admin
- **Frontend:** HTML5, CSS3, JavaScript (ES6+)
- **Database:** SQLite
- **Styling:** Custom CSS with modern design patterns
- **Icons:** Font Awesome

## Features Implemented

- User authentication and authorization  
- Role-based access control  
- Student course enrollment  
- Teacher grade management  
- Admin panel with Flask-Admin  
- Responsive design  
- Real-time course capacity checking  
- Grade editing interface  
- Modern UI/UX design  
- Sample data population  

## Future Enhancements

- Email notifications for enrollment
- Course search and filtering
- Grade analytics and reports
- Bulk enrollment operations
- Course prerequisites
- Academic calendar integration
- Mobile app support

## Troubleshooting

### Common Issues

1. **Port already in use:**
   - Change the port in `app.py`: `app.run(debug=True, port=5001)`

2. **Database issues:**
   - Delete `enrollment.db` file and restart the application

3. **Dependencies not found:**
   - Make sure you're in the correct directory
   - Run `pip install -r requirements.txt` again

### Support

For issues or questions, please check the Flask documentation or contact the development team.
