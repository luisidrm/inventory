"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Icon } from "@/components/ui/Icon";
import { useLoginMutation } from "./_service/authApi";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [hidePassword, setHidePassword] = useState(true);
  const [emailFocused, setEmailFocused] = useState(false);
  const [passwordFocused, setPasswordFocused] = useState(false);
  const [touched, setTouched] = useState<{ email?: boolean; password?: boolean }>({});
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const emailError = touched.email && !email;
  const emailInvalid = touched.email && email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  const passwordError = touched.password && !password;

    const [login] = useLoginMutation();
  

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setTouched({ email: true, password: true });
    if (!email || !password) return;
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return;

    setIsLoading(true);
    setErrorMessage("");
    try {
      await login({ email, password }).unwrap().then(res=>{
        if(res.statusCode===200){
          router.push("/dashboard");
          router.refresh();
        }
      });
    } catch (err) {
      setIsLoading(false);
      setErrorMessage(err instanceof Error ? err.message : "Ocurrió un error. Intenta de nuevo.");
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-page__bg">
        <div className="auth-page__circle auth-page__circle--1" />
        <div className="auth-page__circle auth-page__circle--2" />
        <div className="auth-page__circle auth-page__circle--3" />
      </div>

      <header className="auth-header">
        <Link className="auth-header__logo" href="/">
          <div className="auth-header__logo-icon">
            <Icon name="inventory_2" />
          </div>
          <span>Inventory<span className="accent">Pro</span></span>
        </Link>
      </header>

      <div className="auth-card">
        <h1 className="auth-card__title">Bienvenido de vuelta</h1>
        <p className="auth-card__subtitle">Ingresa a tu cuenta para continuar</p>

        {errorMessage ? (
          <div className="auth-alert auth-alert--error">
            <Icon name="error_outline" />
            <span>{errorMessage}</span>
          </div>
        ) : null}

        <form className="auth-card__form" onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="email">Email</label>
            <div
              className={`input-wrapper ${emailFocused ? "focused" : ""} ${(emailError || emailInvalid) ? "error" : ""}`}
            >
              <span className="input-icon"><Icon name="mail_outline" /></span>
              <input
                id="email"
                type="email"
                placeholder="tu@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                onFocus={() => setEmailFocused(true)}
                onBlur={() => { setEmailFocused(false); setTouched((t) => ({ ...t, email: true })); }}
              />
            </div>
            {emailError ? <span className="form-error">El email es requerido</span> : null}
            {emailInvalid && !emailError ? <span className="form-error">Ingresa un email válido</span> : null}
          </div>

          <div className="form-group">
            <div className="form-group__header">
              <label htmlFor="password">Contraseña</label>
              <Link className="form-link" href="/login/forgot-password">¿Olvidaste tu contraseña?</Link>
            </div>
            <div
              className={`input-wrapper ${passwordFocused ? "focused" : ""} ${passwordError ? "error" : ""}`}
            >
              <span className="input-icon"><Icon name="lock_outline" /></span>
              <input
                id="password"
                type={hidePassword ? "password" : "text"}
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onFocus={() => setPasswordFocused(true)}
                onBlur={() => { setPasswordFocused(false); setTouched((t) => ({ ...t, password: true })); }}
              />
              <button
                type="button"
                className="input-toggle"
                onClick={() => setHidePassword((v) => !v)}
                aria-label={hidePassword ? "Mostrar contraseña" : "Ocultar contraseña"}
              >
                <Icon name={hidePassword ? "visibility_off" : "visibility"} />
              </button>
            </div>
            {passwordError ? <span className="form-error">La contraseña es requerida</span> : null}
          </div>

          <button type="submit" className="auth-btn" disabled={isLoading}>
            {isLoading ? (
              <div className="spinner" />
            ) : (
              <>
                <span>Iniciar Sesión</span>
                <Icon name="arrow_forward" />
              </>
            )}
          </button>
        </form>

        <div className="auth-card__divider">
          <span>o</span>
        </div>

        <button type="button" className="auth-btn auth-btn--google">
          <svg width="18" height="18" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
            <path d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844a4.14 4.14 0 0 1-1.796 2.716v2.259h2.908c1.702-1.567 2.684-3.875 2.684-6.615Z" fill="#4285F4"/>
            <path d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18Z" fill="#34A853"/>
            <path d="M3.964 10.71A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.997 8.997 0 0 0 0 9c0 1.452.348 2.827.957 4.042l3.007-2.332Z" fill="#FBBC05"/>
            <path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.958L3.964 7.29C4.672 5.163 6.656 3.58 9 3.58Z" fill="#EA4335"/>
          </svg>
          <span>Continuar con Google</span>
        </button>

        <p className="auth-card__footer">
          ¿No tienes cuenta? <Link href="/login/register">Crear cuenta gratis</Link>
        </p>
      </div>
    </div>
  );
}
