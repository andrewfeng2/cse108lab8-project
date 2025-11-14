# UCM University Enrollment System - API Documentation

## Overview
This document describes the REST API endpoints available in the UCM University Enrollment System.

## Base URL
```
http://localhost:5001
```

## Authentication
The application uses session-based authentication. Users must log in through the web interface before accessing protected endpoints.

## API Endpoints

### Authentication Endpoints

#### Login
- **URL:** `/login`
- **Method:** `POST`
- **Content-Type:** `application/x-www-form-urlencoded`
- **Parameters:**
  - `username` (string, required): User's username
  - `password` (string, required): User's password
- **Response:** Redirects to appropriate dashboard on success

#### Logout
- **URL:** `/logout`
- **Method:** `GET`
- **Response:** Clears session and redirects to login

### Student Endpoints

#### Student Dashboard
- **URL:** `/student`
- **Method:** `GET`
- **Authentication:** Required (student role)
- **Response:** HTML page showing student's enrolled courses and available courses

#### Enroll in Course
- **URL:** `/api/enroll`
- **Method:** `POST`
- **Content-Type:** `application/json`
- **Authentication:** Required (student role)
- **Request Body:**
  ```json
  {
    "course_id": 1
  }
  ```
- **Response:**
  ```json
  {
    "success": true,
    "message": "Successfully enrolled"
  }
  ```
- **Error Response:**
  ```json
  {
    "success": false,
    "message": "Course is at capacity"
  }
  ```

#### Unenroll from Course
- **URL:** `/api/unenroll`
- **Method:** `POST`
- **Content-Type:** `application/json`
- **Authentication:** Required (student role)
- **Request Body:**
  ```json
  {
    "course_id": 1
  }
  ```
- **Response:**
  ```json
  {
    "success": true,
    "message": "Successfully removed from course"
  }
  ```
- **Error Response:**
  ```json
  {
    "success": false,
    "message": "Not enrolled in this course"
  }
  ```

### Teacher Endpoints

#### Teacher Dashboard
- **URL:** `/teacher`
- **Method:** `GET`
- **Authentication:** Required (teacher role)
- **Response:** HTML page showing teacher's courses

#### Get Course Students
- **URL:** `/api/course/<course_id>/students`
- **Method:** `GET`
- **Authentication:** Required (teacher role)
- **Parameters:**
  - `course_id` (integer): ID of the course
- **Response:**
  ```json
  {
    "success": true,
    "students": [
      {
        "id": 1,
        "name": "John Doe",
        "grade": 85
      }
    ]
  }
  ```

#### Update Student Grade
- **URL:** `/api/update_grade`
- **Method:** `POST`
- **Content-Type:** `application/json`
- **Authentication:** Required (teacher role)
- **Request Body:**
  ```json
  {
    "enrollment_id": 1,
    "grade": 92
  }
  ```
- **Response:**
  ```json
  {
    "success": true,
    "message": "Grade updated"
  }
  ```

### Admin Endpoints

#### Admin Panel
- **URL:** `/admin`
- **Method:** `GET`
- **Authentication:** Required (admin role)
- **Response:** Flask-Admin interface for database management

## Data Models

### User
```json
{
  "id": 1,
  "username": "cnorris",
  "role": "student",
  "first_name": "Chuck",
  "last_name": "Norris"
}
```

### Course
```json
{
  "id": 1,
  "name": "CS 106",
  "teacher_id": 1,
  "time": "MWF 2:00-2:50 PM",
  "capacity": 10
}
```

### Enrollment
```json
{
  "id": 1,
  "student_id": 1,
  "course_id": 1,
  "grade": 85,
  "enrolled_date": "2024-01-15T10:30:00"
}
```

## Error Handling

All API endpoints return appropriate HTTP status codes:
- `200 OK`: Successful request
- `400 Bad Request`: Invalid request data
- `401 Unauthorized`: Authentication required
- `403 Forbidden`: Insufficient permissions
- `404 Not Found`: Resource not found
- `500 Internal Server Error`: Server error

Error responses include a JSON object with error details:
```json
{
  "success": false,
  "message": "Error description"
}
```

## Demo Data

The application comes with pre-loaded demo data:

### Demo Users
- **Student:** `cnorris` / `student123` (Chuck Norris)
- **Teacher:** `ahepworth` / `teacher123` (Dr. Ammon Hepworth)
- **Admin:** `admin` / `admin123` (Admin User)

### Sample Courses
- Math 101 (Ralph Jenkins, MWF 10:00-10:50 AM, Capacity: 8)
- Physics 121 (Susan Walker, TR 11:00-11:50 AM, Capacity: 10)
- CS 106 (Ammon Hepworth, MWF 2:00-2:50 PM, Capacity: 10)
- CS 162 (Ammon Hepworth, TR 3:00-3:50 PM, Capacity: 4)

## Usage Examples

### Enrolling a Student in a Course
```javascript
fetch('/api/enroll', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({ course_id: 1 })
})
.then(response => response.json())
.then(data => {
  if (data.success) {
    console.log('Enrolled successfully');
  } else {
    console.error('Error:', data.message);
  }
});
```

### Updating a Student's Grade
```javascript
fetch('/api/update_grade', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({ 
    enrollment_id: 1,
    grade: 92
  })
})
.then(response => response.json())
.then(data => {
  if (data.success) {
    console.log('Grade updated successfully');
  } else {
    console.error('Error:', data.message);
  }
});
```

## Security Notes

- All passwords are hashed using Werkzeug's security utilities
- Session-based authentication is used for web interface
- Role-based access control is implemented for all endpoints
- Input validation is performed on all API endpoints
- SQL injection protection is provided by SQLAlchemy ORM
