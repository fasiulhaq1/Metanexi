document.addEventListener('DOMContentLoaded', function () {
    var form = document.getElementById('signupForm');

    form.addEventListener('submit', function (event) {
        event.preventDefault();
        event.stopPropagation();

        var name = document.getElementById('name');
        var email = document.getElementById('email');
        var password = document.getElementById('password');
        var confirmPassword = document.getElementById('confirmPassword');

        var isValid = true;

        // Validate name
        if (!name.value) {
            name.classList.add('is-invalid');
            isValid = false;
        } else {
            name.classList.remove('is-invalid');
        }

        // Validate email
        if (!email.value || !validateEmail(email.value)) {
            email.classList.add('is-invalid');
            isValid = false;
        } else {
            email.classList.remove('is-invalid');
        }

        // Validate password
        if (!password.value) {
            password.classList.add('is-invalid');
            isValid = false;
        } else {
            password.classList.remove('is-invalid');
        }

        // Validate confirm password
        if (!confirmPassword.value || password.value !== confirmPassword.value) {
            confirmPassword.classList.add('is-invalid');
            isValid = false;
        } else {
            confirmPassword.classList.remove('is-invalid');
        }

        if (isValid) {
            // Form submission logic
            console.log('Form submitted');
            // Example: window.location.href = "success.html";
        }
    }, false);
});

function validateEmail(email) {
    var re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
}
