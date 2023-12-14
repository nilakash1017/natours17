/* eslint-disable */
import { showAlert } from './alerts';

export const login = async (email, password) => {
  try {
    const response = await fetch('/api/v1/users/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ email, password })
    });
    const data = await response.json();
    if (data.status === 'Success') {
      showAlert('success', 'You have logged in successfully');
      window.setTimeout(() => {
        location.assign('/');
      }, 1500);
    } else {
      showAlert('error', data.message);
    }
  } catch (error) {
    showAlert('error', error.message);
  }
};

export const logOut = async () => {
  try {
    const response = await fetch('/api/v1/users/logout', {
      method: 'GET'
    });
    const data = await response.json();
    if ((data.status = 'Success')) {
      location.reload(true);
    }
  } catch (error) {
    showAlert('error', error.message);
  }
};
