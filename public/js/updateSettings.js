/* eslint-disable */
import { showAlert } from './alerts';

//type = password or data
export const updateAccountData = async (userData, type) => {
  try {
    let url = '';
    if (type === 'password') {
      url = '/api/v1/users/updateMyPassword';
    } else {
      url = '/api/v1/users/updateAccountDetails';
    }
    // headers: {
    //   'Content-Type': ''
    // },
    console.log(url);
    console.log(userData);
    const response = await fetch(url, {
      method: 'PATCH',
      body: userData
    });
    const data = await response.json();
    console.log(data);
    if (data.status === 'Success') {
      showAlert('success', `${type} updated successfully`);
      window.setTimeout(() => {
        location.assign('/my_account');
      }, 1500);
    } else {
      showAlert('error', data.message);
    }
  } catch (error) {
    showAlert('error', error.message);
  }
};
