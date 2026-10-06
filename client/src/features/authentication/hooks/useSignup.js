


import { useState } from 'react';
// import axios from 'axios'; 
import userService from '../../../services/userService';

export const useSignup = () => {
  const [error, setError] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  // 1. Updated to accept 'role' as the 5th argument
  const signup = async (firstName, lastName, email, password, role) => {
    setIsLoading(true);
    setError(null);

    try {
      // 2. Construct the payload matching backend Serializer fields
      // Backend expects: first_name, last_name, email, password, role
      const payload = {
        first_name: firstName,
        last_name: lastName,
        email: email,
        password: password,
        role: role // <--- Passing the role (client/freelancer)
      };

      // 3. Send POST request (Update URL if your backend port is different)
      // 3. Delegate to userService based on role
      let response;
      if (role === 'client') {
        response = await userService.registerClient(payload);
      } else {
        // Default to freelancer
        response = await userService.registerFreelancer(payload);
      }

      // userService returns response.data directly, so we check if response exists
      if (response) {
        setIsSuccess(true);
        setIsLoading(false);
      }
    } catch (err) {
      setIsLoading(false);

      // Handle errors (checks if backend sent a specific error message)
      if (err.response && err.response.data) {
        setError(err.response.data);
      } else {
        setError({ detail: "Something went wrong during registration." });
      }
    }
  };

  return { signup, isLoading, error, isSuccess };
};