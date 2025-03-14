import {jwtDecode} from 'jwt-decode';

const checkTokenExpiration = (token) => {
  if (!token) return true; // No token means it's effectively "expired"
  const { exp } = jwtDecode(token);
  return Date.now() >= exp * 1000; // Token is expired if current time is past expiration
};
export default checkTokenExpiration;