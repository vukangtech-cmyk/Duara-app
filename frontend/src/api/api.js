import axios from "axios";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost/duara";
const client = axios.create({ baseURL: API_URL, headers: { "Content-Type": "application/json" } });

export async function registerUser(name, phone, pin) { const res = await client.post("/register.php", { name, phone, pin }); return res.data; }
export async function loginUser(phone, pin) { const res = await client.post("/login.php", { phone, pin }); return res.data; }
export async function getFeed() { const res = await client.get("/feed.php"); return res.data; }
export async function createPost(userId, content) { const res = await client.post("/posts.php", { user_id: userId, content }); return res.data; }
