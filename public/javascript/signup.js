document.addEventListener("DOMContentLoaded", function () {
    // toggle password logic
    window.togglePassword = function (fieldId, iconElement) {
        const input = document.getElementById(fieldId);
        const icon = iconElement.querySelector('i');

        if (input.type === 'password') {
            input.type = 'text';
            icon.classList.remove('fa-eye');
            icon.classList.add('fa-eye-slash');
        } else {
            input.type = 'password';
            icon.classList.remove('fa-eye-slash');
            icon.classList.add('fa-eye');
        }
    };

    const password = document.getElementById('password');
    const confirmPassword = document.getElementById('confirmPassword');
    const form = document.querySelector('form');
    const submitBtn = form.querySelector('button[type="submit"]');

    const lengthMsg = document.createElement('p');
    lengthMsg.classList.add('mt-1', 'text-xs');
    password.parentNode.appendChild(lengthMsg);

    const matchMsg = document.createElement('p');
    matchMsg.classList.add('mt-1', 'text-xs');
    confirmPassword.parentNode.appendChild(matchMsg);

    function validatePasswords() {
        const passwordValue = password.value;
        const confirmPasswordValue = confirmPassword.value;

        if (passwordValue.length >= 8) {
            lengthMsg.textContent = '✅ Password length is good';
            lengthMsg.classList.remove('text-red-500');
            lengthMsg.classList.add('text-green-500');
        } else {
            lengthMsg.textContent = '❌ Password must be at least 8 characters';
            lengthMsg.classList.remove('text-green-500');
            lengthMsg.classList.add('text-red-500');
        }

        if (confirmPasswordValue === '') {
            matchMsg.textContent = '';
            submitBtn.disabled = false;
            return;
        }

        if (passwordValue === confirmPasswordValue) {
            matchMsg.textContent = '✅ Passwords match';
            matchMsg.classList.remove('text-red-500');
            matchMsg.classList.add('text-green-500');
            submitBtn.disabled = false;
        } else {
            matchMsg.textContent = '❌ Passwords do not match';
            matchMsg.classList.remove('text-green-500');
            matchMsg.classList.add('text-red-500');
            submitBtn.disabled = true;
        }
    }

    password.addEventListener('input', validatePasswords);
    confirmPassword.addEventListener('input', validatePasswords);
});
