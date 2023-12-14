/* eslint-disable */
import '@babel/polyfill';
import { login, logOut } from './login';
import { updateAccountData } from './updateSettings';
import { bookTour } from './stripe';

const loginForm = document.querySelector('.form__login');
const logOutBtn = document.querySelector('.nav__el--logout');
const userForm = document.querySelector('.form-user-data');
const userPasswordForm = document.querySelector('.form-user-settings');
const bookBtn = document.getElementById('book-tour');

if (loginForm) {
  loginForm.addEventListener('submit', function(event) {
    event.preventDefault();
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    if (!email || !password) {
      console.log('Please enter the details');
    }
    login(email, password);
  });
}

if (logOutBtn) {
  logOutBtn.addEventListener('click', logOut);
}

if (userForm) {
  userForm.addEventListener('submit', function(event) {
    event.preventDefault();
    const formData = new FormData(userForm);
    formData.append('name', document.getElementById('name').value);
    formData.append('email', document.getElementById('email').value);
    formData.append('photo', document.getElementById('photo').files[0]);
    const data = Object.fromEntries(formData);
    updateAccountData(data, 'data');
  });
}

if (userPasswordForm) {
  userPasswordForm.addEventListener('submit', async event => {
    event.preventDefault();
    document.querySelector('.btn--save-password').textContent = 'Updating...';
    const passwordCurrent = document.getElementById('password-current').value;
    const password = document.getElementById('password').value;
    const passwordConfirm = document.getElementById('password-confirm').value;
    await updateAccountData(
      { passwordCurrent, password, passwordConfirm },
      'password'
    );
    document.querySelector('.btn--save-password').textContent = 'Save Password';
    document.getElementById('password-current').value = '';
    document.getElementById('password').value = '';
    document.getElementById('password-confirm').value = '';
  });
}

if (bookBtn) {
  console.log('coming here');
  bookBtn.addEventListener('click', async e => {
    console.log('coming here');
    e.target.textContent = 'Processing...';
    const { tourId } = e.target.dataset;
    await bookTour(tourId);
  });
}
