import React, { useState } from "react";
import { Car } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { signInWithEmailAndPassword } from "firebase/auth";
import { auth } from "../firebase";
import "./login.css";

const Login = ({ onLoginSuccess }) => {
  const [form, setForm] = useState({ email: "", password: "" });
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async () => {
    const { email, password } = form;

    if (!email || !password) {
      alert("Veuillez entrer l'email et le mot de passe !");
      return;
    }

    setLoading(true);
    try {
      const userCredential = await signInWithEmailAndPassword(
        auth,
        email,
        password
      );
      const user = userCredential.user;

      const formattedUser = {
        email: user.email,
        name: user.displayName || user.email.split("@")[0],
        id: user.uid,
      };

      onLoginSuccess(formattedUser);
      navigate("/booking");
    } catch (error) {
      alert("Échec de la connexion : " + error.message);
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-container">
      <div className="login-header">
        <Car
          style={{
            width: 48,
            height: 48,
            color: "#2563eb",
            marginBottom: "1rem",
          }}
        />
        <h2>Connexion QuickTaxi</h2>
        <p>Connectez-vous pour réserver votre taxi</p>
      </div>

      <div>
        <div className="input-group">
          <label>Email</label>
          <input
            type="email"
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
            placeholder="Entrez votre adresse email"
          />
        </div>

        <div className="input-group">
          <label>Mot de passe</label>
          <input
            type="password"
            value={form.password}
            onChange={(e) => setForm({ ...form, password: e.target.value })}
            placeholder="Entrez votre mot de passe"
          />
        </div>

        <button
          onClick={handleLogin}
          disabled={loading}
          className="login-button"
        >
          {loading ? "Connexion en cours..." : "Se connecter"}
        </button>
      </div>
    </div>
  );
};

export default Login;
