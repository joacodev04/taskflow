import { startTransition, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import AuthCard from "../components/auth/AuthCard";
import AuthHero from "../components/auth/AuthHero";
import { useAuth } from "../contexts/AuthContext";

function AuthPage() {
  const navigate = useNavigate();
  const { isAuthenticated, authenticate, createAccount } = useAuth();
  const [mode, setMode] = useState("login");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [feedback, setFeedback] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    document.title = "Taskflow | Acceso";
  }, []);

  useEffect(() => {
    if (isAuthenticated) {
      startTransition(() => {
        navigate("/admin.html", { replace: true });
      });
    }
  }, [isAuthenticated, navigate]);

  function handleModeChange(nextMode) {
    setMode(nextMode);
    setFeedback(null);
    setPassword("");
    setConfirmPassword("");
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setFeedback(null);

    const cleanUsername = username.trim();

    if (!cleanUsername || !password) {
      setFeedback({ type: "danger", text: "Completa usuario y contrasena." });
      return;
    }

    if (mode === "register" && password !== confirmPassword) {
      setFeedback({ type: "danger", text: "Las contrasenas no coinciden." });
      return;
    }

    setIsSubmitting(true);

    try {
      if (mode === "register") {
        await createAccount(cleanUsername, password);
        setFeedback({ type: "success", text: "Cuenta creada. Iniciando sesion..." });
      }

      await authenticate(cleanUsername, password);
      startTransition(() => {
        navigate("/admin.html", { replace: true });
      });
    } catch (error) {
      setFeedback({
        type: "danger",
        text: error instanceof Error ? error.message : "No se pudo conectar con el servidor."
      });
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <main className="auth-layout">
      <div className="row g-4 align-items-stretch">
        <AuthHero />
        <AuthCard
          mode={mode}
          username={username}
          password={password}
          confirmPassword={confirmPassword}
          feedback={feedback}
          isSubmitting={isSubmitting}
          onModeChange={handleModeChange}
          onUsernameChange={setUsername}
          onPasswordChange={setPassword}
          onConfirmPasswordChange={setConfirmPassword}
          onSubmit={handleSubmit}
        />
      </div>
    </main>
  );
}

export default AuthPage;
