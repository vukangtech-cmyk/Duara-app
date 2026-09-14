import axios from "axios";

const API_URL = "http://localhost/duara"; // folder ya PHP kwenye XAMPP htdocs

export async function registerUser(name, phone, pin) {
  const res = await axios.post(`${API_URL}/register.php`, { name, phone, pin });
  return res.data;
}

export async function loginUser(phone, pin) {
  const res = await axios.post(`${API_URL}/login.php`, { phone, pin });
  return res.data;
}