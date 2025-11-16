window.onload = function() {
    loadMyCourses();
    loadAllCourses();
};

function switchTab(tab) {
    var allTabs = document.getElementsByClassName('tab-content');
    var i;
    for (i = 0; i < allTabs.length; i++) {
        allTabs[i].classList.remove('active');
    }
    
    var allBtns = document.getElementsByClassName('tab-btn');
    for (i = 0; i < allBtns.length; i++) {
        allBtns[i].classList.remove('active');
    }
    
    document.getElementById(tab).classList.add('active');
    event.target.classList.add('active');
}

function loadMyCourses() {
    fetch('/api/student/enrolled-courses').then(function(response) {
        return response.json();
    }).then(function(data) {
        if (data.success) {
            var table = document.getElementById('my-courses');
            table.innerHTML = '';
            
            if (data.courses.length == 0) {
                table.innerHTML = '<tr><td colspan="7" style="text-align: center;">You are not enrolled in any courses.</td></tr>';
            } else {
                for (var i = 0; i < data.courses.length; i++) {
                    var c = data.courses[i];
                    var tr = document.createElement('tr');
                    var grade = c.grade != null ? c.grade : 'Not graded';
                    var btn = '';
                    
                    if (c.grade != null) {
                        btn = '<span class="enrolled-indicator" title="Cannot drop course after grade is assigned">Graded</span>';
                    } else {
                        btn = '<button class="action-btn remove-btn" onclick="removeCourse(' + c.id + ')"><i class="fas fa-minus"></i></button>';
                    }
                    
                    tr.innerHTML = '<td>' + c.name + '</td><td>' + c.teacher_name + '</td><td>' + c.time + '</td><td>' + c.enrolled + '/' + c.capacity + '</td><td><strong>' + grade + '</strong></td><td>Enrolled</td><td>' + btn + '</td>';
                    table.appendChild(tr);
                }
            }
        }
    }).catch(function(err) {
        console.error('Error:', err);
    });
}

function loadAllCourses() {
    fetch('/api/student/available-courses').then(function(resp) {
        return resp.json();
    }).then(function(result) {
        if (result.success) {
            var tbody = document.getElementById('all-courses');
            tbody.innerHTML = '';
            var courses = result.courses;
            
            for (var i = 0; i < courses.length; i++) {
                var course = courses[i];
                var row = document.createElement('tr');
                var isFull = course.enrolled >= course.capacity;
                var actionBtn = '';
                
                if (course.is_enrolled) {
                    actionBtn = '<span class="enrolled-indicator">Enrolled</span>';
                } else if (isFull) {
                    actionBtn = '<span class="full-indicator">Full</span>';
                } else {
                    actionBtn = '<button class="action-btn add-btn" onclick="enrollCourse(' + course.id + ')"><i class="fas fa-plus"></i></button>';
                }
                
                row.innerHTML = '<td>' + course.name + '</td><td>' + course.teacher_name + '</td><td>' + course.time + '</td><td>' + course.enrolled + '/' + course.capacity + '</td><td>' + actionBtn + '</td>';
                tbody.appendChild(row);
            }
        }
    }).catch(function(error) {
        console.error('Error:', error);
    });
}

function enrollCourse(id) {
    document.getElementById('loading').classList.remove('hidden');
    
    fetch('/api/enroll', {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({ course_id: id })
    })
    .then(function(response) {
        return response.json();
    })
    .then(function(data) {
        document.getElementById('loading').classList.add('hidden');
        if (data.success) {
            loadMyCourses();
            loadAllCourses();
        } else {
            alert('Error: ' + data.message);
        }
    })
    .catch(function(err) {
        document.getElementById('loading').classList.add('hidden');
        alert('Something went wrong');
        console.error('Error:', err);
    });
}

function removeCourse(id) {
    document.getElementById('loading').classList.remove('hidden');
    
    fetch('/api/unenroll', {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({ course_id: id })
    })
    .then(function(response) {
        return response.json();
    })
    .then(function(data) {
        document.getElementById('loading').classList.add('hidden');
        if (data.success) {
            loadMyCourses();
            loadAllCourses();
        } else {
            alert('Error: ' + data.message);
        }
    })
    .catch(function(err) {
        document.getElementById('loading').classList.add('hidden');
        alert('Something went wrong');
        console.error('Error:', err);
    });
}
