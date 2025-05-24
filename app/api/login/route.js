// pages/login.jsx or any login handler
const handleLogin = async (email, password) => {
  try {
    const response = await fetch("http://localhost:5000/api/users/login", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ email, password })
    });

    const data = await response.json();

    if (response.ok) {
      localStorage.setItem("token", data.token);
      // redirect to dashboard or do something
    } else {
      console.error("Login failed:", data.error);
    }
  } catch (error) {
    console.error("Network error:", error);
  }
};
