document.addEventListener('DOMContentLoaded', function() {
    loadCurrentUserInformation();
    loadTeacherCoursesList();
    setupModalCloseButtonHandler();
    setupClickOutsideModalHandler();
});

function loadCurrentUserInformation() {
    fetch('/api/current-user')
        .then(function(response) {
            return response.json();
        })
        .then(function(data) {
            if (data.success) {
                var userNameElement = document.getElementById('displayedUserFullName');
                userNameElement.textContent = data.user.name;
                var userRoleElement = document.getElementById('displayedUserRoleLabel');
                var capitalizedRole = capitalizeFirstLetter(data.user.role);
                userRoleElement.textContent = '(' + capitalizedRole + ')';
            }
        })
        .catch(function(error) {
            console.error('Error loading user info:', error);
        });
}

function capitalizeFirstLetter(word) {
    var firstLetter = word.charAt(0).toUpperCase();
    var restOfWord = word.slice(1);
    return firstLetter + restOfWord;
}

function loadTeacherCoursesList() {
    fetch('/api/teacher/courses')
        .then(function(response) {
            return response.json();
        })
        .then(function(data) {
            var gotCourses = data.success && data.courses && data.courses.length > 0;
            if (gotCourses) {
                displayCoursesOnPage(data.courses);
            } else {
                var noCoursesMessage = document.getElementById('noCoursesFoundMessage');
                noCoursesMessage.classList.remove('hidden');
            }
        })
        .catch(function(error) {
            console.error('Error loading courses:', error);
            var noCoursesMessage = document.getElementById('noCoursesFoundMessage');
            noCoursesMessage.classList.remove('hidden');
        });
}

function displayCoursesOnPage(coursesList) {
    var coursesContainer = document.getElementById('teacherCoursesDisplayGrid');
    coursesContainer.innerHTML = '';
    for (var i = 0; i < coursesList.length; i++) {
        var currentCourse = coursesList[i];
        var courseCard = createSingleCourseCard(currentCourse);
        coursesContainer.appendChild(courseCard);
    }
    setupViewStudentButtonsHandlers();
}

function createSingleCourseCard(courseData) {
    var cardElement = document.createElement('div');
    cardElement.className = 'individual-course-card teacher';
    var enrollmentCount = courseData.enrolled || 0;
    var cardHTML = '';
    cardHTML += '<div class="course-card-header-section">';
    cardHTML += '<h4>' + courseData.name + '</h4>';
    cardHTML += '<span class="course-capacity-display">' + enrollmentCount + '/' + courseData.capacity + '</span>';
    cardHTML += '</div>';
    cardHTML += '<div class="course-details-section">';
    cardHTML += '<p><i class="fas fa-clock"></i> ' + courseData.time + '</p>';
    cardHTML += '<p><i class="fas fa-users"></i> ' + enrollmentCount + '/' + courseData.capacity + '</p>';
    cardHTML += '</div>';
    cardHTML += '<div class="course-action-buttons-section">';
    cardHTML += '<button class="btn btn-primary view-students-list-button" data-course-id="' + courseData.id + '">';
    cardHTML += '<i class="fas fa-eye"></i> View Students';
    cardHTML += '</button>';
    cardHTML += '</div>';
    cardElement.innerHTML = cardHTML;
    return cardElement;
}

function setupViewStudentButtonsHandlers() {
    var allViewButtons = document.querySelectorAll('.view-students-list-button');
    for (var i = 0; i < allViewButtons.length; i++) {
        var button = allViewButtons[i];
        button.addEventListener('click', function() {
            var courseId = this.dataset.courseId;
            var courseCard = this.closest('.individual-course-card');
            var courseName = courseCard.querySelector('h4').textContent;
            openStudentListPopup(courseId, courseName);
        });
    }
}

function setupModalCloseButtonHandler() {
    var popup = document.getElementById('studentListPopupModal');
    var closeButton = document.querySelector('.close-popup-button');
    closeButton.addEventListener('click', function() {
        popup.classList.add('hidden');
    });
}

function setupClickOutsideModalHandler() {
    var popup = document.getElementById('studentListPopupModal');
    window.addEventListener('click', function(event) {
        if (event.target === popup) {
            popup.classList.add('hidden');
        }
    });
}

function openStudentListPopup(courseId, courseName) {
    var popup = document.getElementById('studentListPopupModal');
    var popupTitle = document.getElementById('studentListPopupTitle');
    var studentContainer = document.getElementById('studentListContainer');
    popupTitle.textContent = courseName + ' - Students';
    popup.classList.remove('hidden');
    var loadingHTML = '<div class="loading-spinner-display">';
    loadingHTML += '<div class="animated-spinner"></div>';
    loadingHTML += '<p>Loading students...</p>';
    loadingHTML += '</div>';
    studentContainer.innerHTML = loadingHTML;
    fetch('/api/course/' + courseId + '/students')
        .then(function(response) {
            return response.json();
        })
        .then(function(data) {
            if (data.success) {
                createStudentListTable(data.students);
            } else {
                studentContainer.innerHTML = '<p class="error-message">Error: ' + data.message + '</p>';
            }
        })
        .catch(function(error) {
            studentContainer.innerHTML = '<p class="error-message">Could not load students. Please try again.</p>';
            console.error('Error:', error);
        });
}

function createStudentListTable(studentsList) {
    var container = document.getElementById('studentListContainer');
    if (studentsList.length === 0) {
        container.innerHTML = '<p class="no-students-enrolled-message">No students enrolled in this course.</p>';
        return;
    }
    var table = document.createElement('table');
    table.className = 'students-data-table';
    var tableHeader = document.createElement('thead');
    tableHeader.innerHTML = '<tr><th>Student Name</th><th>Grade</th><th>Actions</th><th>Remove</th></tr>';
    table.appendChild(tableHeader);
    var tableBody = document.createElement('tbody');
    for (var i = 0; i < studentsList.length; i++) {
        var student = studentsList[i];
        var studentRow = createSingleStudentRow(student);
        tableBody.appendChild(studentRow);
    }
    table.appendChild(tableBody);
    container.innerHTML = '';
    container.appendChild(table);
    setupAllTableButtonHandlers();
}

function createSingleStudentRow(student) {
    var row = document.createElement('tr');
    var gradeText = 'No grade';
    var gradeValue = '';
    if (student.grade) {
        gradeText = student.grade;
        gradeValue = student.grade;
    }
    var rowHTML = '';
    rowHTML += '<td>' + student.name + '</td>';
    rowHTML += '<td>';
    rowHTML += '<div class="grade-display-container">';
    rowHTML += '<span class="grade-display-text" data-enrollment-id="' + student.id + '">';
    rowHTML += gradeText;
    rowHTML += '</span>';
    rowHTML += '<div class="grade-editing-form hidden" data-enrollment-id="' + student.id + '">';
    rowHTML += '<input type="number" class="grade-number-input" min="0" max="100" value="' + gradeValue + '" placeholder="Enter grade">';
    rowHTML += '<button class="btn btn-sm btn-success save-grade-changes-button" data-enrollment-id="' + student.id + '">';
    rowHTML += '<i class="fas fa-check"></i>';
    rowHTML += '</button>';
    rowHTML += '<button class="btn btn-sm btn-secondary cancel-grade-edit-button" data-enrollment-id="' + student.id + '">';
    rowHTML += '<i class="fas fa-times"></i>';
    rowHTML += '</button>';
    rowHTML += '</div>';
    rowHTML += '</div>';
    rowHTML += '</td>';
    rowHTML += '<td>';
    rowHTML += '<button class="btn btn-sm btn-outline edit-student-grade-button" data-enrollment-id="' + student.id + '">';
    rowHTML += '<i class="fas fa-edit"></i> Edit';
    rowHTML += '</button>';
    rowHTML += '</td>';
    rowHTML += '<td>';
    rowHTML += '<button class="btn btn-sm btn-danger remove-student-from-course-button" data-enrollment-id="' + student.id + '">';
    rowHTML += '<i class="fas fa-user-minus"></i> Remove';
    rowHTML += '</button>';
    rowHTML += '</td>';
    row.innerHTML = rowHTML;
    return row;
}

function setupAllTableButtonHandlers() {
    setupEditGradeButtonsHandlers();
    setupSaveGradeButtonsHandlers();
    setupCancelGradeButtonsHandlers();
    setupRemoveStudentButtonsHandlers();
    setupKeyboardShortcutsHandlers();
}

function setupEditGradeButtonsHandlers() {
    var allEditButtons = document.querySelectorAll('.edit-student-grade-button');
    for (var i = 0; i < allEditButtons.length; i++) {
        allEditButtons[i].addEventListener('click', function() {
            var enrollmentId = this.dataset.enrollmentId;
            showGradeEditingForm(enrollmentId);
        });
    }
}

function setupSaveGradeButtonsHandlers() {
    var allSaveButtons = document.querySelectorAll('.save-grade-changes-button');
    for (var i = 0; i < allSaveButtons.length; i++) {
        allSaveButtons[i].addEventListener('click', function() {
            var enrollmentId = this.dataset.enrollmentId;
            saveStudentGradeToDatabase(enrollmentId);
        });
    }
}

function setupCancelGradeButtonsHandlers() {
    var allCancelButtons = document.querySelectorAll('.cancel-grade-edit-button');
    for (var i = 0; i < allCancelButtons.length; i++) {
        allCancelButtons[i].addEventListener('click', function() {
            var enrollmentId = this.dataset.enrollmentId;
            hideGradeEditingForm(enrollmentId);
        });
    }
}

function setupRemoveStudentButtonsHandlers() {
    var allRemoveButtons = document.querySelectorAll('.remove-student-from-course-button');
    for (var i = 0; i < allRemoveButtons.length; i++) {
        allRemoveButtons[i].addEventListener('click', function() {
            var enrollmentId = this.dataset.enrollmentId;
            removeStudentFromCourse(enrollmentId);
        });
    }
}

function setupKeyboardShortcutsHandlers() {
    var allGradeInputs = document.querySelectorAll('.grade-number-input');
    for (var i = 0; i < allGradeInputs.length; i++) {
        allGradeInputs[i].addEventListener('keydown', function(event) {
            var editForm = this.closest('.grade-editing-form');
            var enrollmentId = editForm.dataset.enrollmentId;
            if (event.key === 'Enter') {
                saveStudentGradeToDatabase(enrollmentId);
            } else if (event.key === 'Escape') {
                hideGradeEditingForm(enrollmentId);
            }
        });
    }
}

function showGradeEditingForm(enrollmentId) {
    var gradeDisplay = document.querySelector('.grade-display-text[data-enrollment-id="' + enrollmentId + '"]');
    var editForm = document.querySelector('.grade-editing-form[data-enrollment-id="' + enrollmentId + '"]');
    var editButton = document.querySelector('.edit-student-grade-button[data-enrollment-id="' + enrollmentId + '"]');
    if (gradeDisplay && editForm && editButton) {
        gradeDisplay.classList.add('hidden');
        editButton.classList.add('hidden');
        editForm.classList.remove('hidden');
        var inputField = editForm.querySelector('.grade-number-input');
        inputField.focus();
        inputField.select();
    }
}

function hideGradeEditingForm(enrollmentId) {
    var gradeDisplay = document.querySelector('.grade-display-text[data-enrollment-id="' + enrollmentId + '"]');
    var editForm = document.querySelector('.grade-editing-form[data-enrollment-id="' + enrollmentId + '"]');
    var editButton = document.querySelector('.edit-student-grade-button[data-enrollment-id="' + enrollmentId + '"]');
    if (gradeDisplay && editForm && editButton) {
        gradeDisplay.classList.remove('hidden');
        editButton.classList.remove('hidden');
        editForm.classList.add('hidden');
    }
}

function saveStudentGradeToDatabase(enrollmentId) {
    var editForm = document.querySelector('.grade-editing-form[data-enrollment-id="' + enrollmentId + '"]');
    var inputField = editForm.querySelector('.grade-number-input');
    var gradeNumber = parseInt(inputField.value);
    var gradeIsValid = !isNaN(gradeNumber) && gradeNumber >= 0 && gradeNumber <= 100;
    if (!gradeIsValid) {
        alert('Please enter a grade between 0 and 100.');
        return;
    }
    var loadingOverlay = document.getElementById('generalLoadingOverlay');
    loadingOverlay.classList.remove('hidden');
    var dataToSend = {
        enrollment_id: enrollmentId,
        grade: gradeNumber
    };
    fetch('/api/update_grade', {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify(dataToSend)
    })
    .then(function(response) {
        return response.json();
    })
    .then(function(result) {
        if (result.success) {
            var gradeDisplay = document.querySelector('.grade-display-text[data-enrollment-id="' + enrollmentId + '"]');
            gradeDisplay.textContent = gradeNumber;
            hideGradeEditingForm(enrollmentId);
            var messageElement = loadingOverlay.querySelector('p');
            messageElement.textContent = 'Grade saved successfully!';
            setTimeout(function() {
                messageElement.textContent = 'Processing...';
            }, 2000);
        } else {
            alert('Error: ' + result.message);
        }
        loadingOverlay.classList.add('hidden');
    })
    .catch(function(error) {
        alert('Could not save the grade. Please try again.');
        console.error('Error:', error);
        loadingOverlay.classList.add('hidden');
    });
}

function removeStudentFromCourse(enrollmentId) {
    var userConfirmed = confirm('Are you sure you want to remove this student from the course? This cannot be undone.');
    if (!userConfirmed) {
        return;
    }
    var loadingOverlay = document.getElementById('generalLoadingOverlay');
    loadingOverlay.classList.remove('hidden');
    var dataToSend = {
        enrollment_id: enrollmentId
    };
    fetch('/api/teacher/remove-student', {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify(dataToSend)
    })
    .then(function(response) {
        return response.json();
    })
    .then(function(result) {
        if (result.success) {
            loadTeacherCoursesList();
            var popup = document.getElementById('studentListPopupModal');
            popup.classList.add('hidden');
        } else {
            alert('Error: ' + result.message);
        }
        loadingOverlay.classList.add('hidden');
    })
    .catch(function(error) {
        alert('Could not remove the student. Please try again.');
        console.error('Error:', error);
        loadingOverlay.classList.add('hidden');
    });
}
