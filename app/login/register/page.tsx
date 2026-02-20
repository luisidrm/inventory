"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Icon } from "@/components/ui/Icon";
import { registerWithOrganization } from "@/lib/auth-api";

export default function RegisterPage() {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(0);
  const [errorMessage, setErrorMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [hidePassword, setHidePassword] = useState(true);
  const [hideConfirm, setHideConfirm] = useState(true);

  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [gender, setGender] = useState(0);
  const [birthday, setBirthday] = useState("");
  const [password, setPassword] = useState("");
  const [confirmationPassword, setConfirmationPassword] = useState("");
  const [orgName, setOrgName] = useState("");
  const [orgCode, setOrgCode] = useState("");
  const [codeDirty, setCodeDirty] = useState(false);

  const [touchedPersonal, setTouchedPersonal] = useState<Record<string, boolean>>({});
  const [touchedOrg, setTouchedOrg] = useState<Record<string, boolean>>({});

  const passwordMismatch = !!password && !!confirmationPassword && password !== confirmationPassword;

  const personalValid =
    fullName.length >= 3 &&
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) &&
    birthday &&
    password.length >= 6 &&
    !passwordMismatch;

  const orgValid = orgName.length >= 2 && orgCode.length >= 2;

  const generateCode = () => {
    if (orgName && !codeDirty) {
      setOrgCode(
        orgName
          .toUpperCase()
          .replace(/[^A-Z0-9]/g, "")
          .substring(0, 10)
      );
    }
  };

  const handleNextStep = (e: React.FormEvent) => {
    e.preventDefault();
    setTouchedPersonal({
      fullName: true,
      email: true,
      birthday: true,
      password: true,
      confirmationPassword: true,
    });
    if (!personalValid) {
      if (passwordMismatch) setErrorMessage("Las contraseñas no coinciden.");
      return;
    }
    setErrorMessage("");
    setCurrentStep(1);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setTouchedOrg({ name: true, code: true });
    if (!orgValid) return;

    setIsLoading(true);
    setErrorMessage("");
    try {
      await registerWithOrganization(
        {
          fullName,
          email,
          password,
          confirmationPassword,
          birthday: new Date(birthday).toISOString(),
          gender: Number(gender),
          phone: phone || undefined,
        },
        { name: orgName, code: orgCode }
      );
      router.push("/dashboard");
      router.refresh();
    } catch (err) {
      setIsLoading(false);
      setErrorMessage(
        err instanceof Error ? err.message : "Ocurrió un error. Intenta de nuevo."
      );
    }
  };

  return (
    <div className="auth-page auth-page--register">
      <div className="auth-page__bg-dashboard" />

      <header className="auth-header">
        <Link className="auth-header__logo" href="/">
          <img
            src="/assets/strova-claro-nobg.png"
            alt="Strova"
            className="auth-header__logo-img"
            height={32}
          />
        </Link>
      </header>

      <div className={`auth-card ${currentStep === 0 ? "auth-card--wide" : ""}`}>
        <div className="steps-indicator">
          <div
            className={`step-dot ${currentStep === 0 ? "active" : ""} ${currentStep > 0 ? "done" : ""}`}
          >
            {currentStep > 0 ? <Icon name="check" /> : <span>1</span>}
          </div>
          <div className={`step-line ${currentStep > 0 ? "active" : ""}`} />
          <div className={`step-dot ${currentStep === 1 ? "active" : ""}`}>
            <span>2</span>
          </div>
        </div>

        {errorMessage ? (
          <div className="auth-alert auth-alert--error">
            <Icon name="error_outline" />
            <span>{errorMessage}</span>
          </div>
        ) : null}

        {currentStep === 0 ? (
          <>
            <h1 className="auth-card__title">Crea tu cuenta de Strova</h1>
            <p className="auth-card__subtitle">Paso 1 de 2 — Tus datos de administrador</p>

            <form className="auth-card__form" onSubmit={handleNextStep}>
              <div className="form-group">
                <label>Nombre completo</label>
                <div
                  className={`input-wrapper ${touchedPersonal.fullName && fullName.length < 3 ? "error" : ""}`}
                >
                  <span className="input-icon"><Icon name="person_outline" /></span>
                  <input
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    onBlur={() => setTouchedPersonal((t) => ({ ...t, fullName: true }))}
                    placeholder="Ej: Juan Pérez"
                  />
                </div>
                {touchedPersonal.fullName && fullName.length < 3 ? (
                  <span className="form-error">El nombre es requerido</span>
                ) : null}
              </div>

              <div className="form-group">
                <label>Email</label>
                <div
                  className={`input-wrapper ${touchedPersonal.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) ? "error" : ""}`}
                >
                  <span className="input-icon"><Icon name="mail_outline" /></span>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    onBlur={() => setTouchedPersonal((t) => ({ ...t, email: true }))}
                    placeholder="tu@email.com"
                  />
                </div>
                {touchedPersonal.email && !email ? (
                  <span className="form-error">El email es requerido</span>
                ) : null}
                {touchedPersonal.email && email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) ? (
                  <span className="form-error">Email inválido</span>
                ) : null}
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Teléfono <span className="optional">(opcional)</span></label>
                  <div className="input-wrapper">
                    <span className="input-icon"><Icon name="phone" /></span>
                    <input
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="+1 234 567"
                    />
                  </div>
                </div>
                <div className="form-group">
                  <label>Género</label>
                  <div className="input-wrapper select-wrapper">
                    <span className="input-icon"><Icon name="wc" /></span>
                    <select
                      value={gender}
                      onChange={(e) => setGender(Number(e.target.value))}
                    >
                      <option value={0}>Masculino</option>
                      <option value={1}>Femenino</option>
                    </select>
                  </div>
                </div>
              </div>

              <div className="form-group">
                <label>Fecha de nacimiento</label>
                <div
                  className={`input-wrapper ${touchedPersonal.birthday && !birthday ? "error" : ""}`}
                >
                  <span className="input-icon"><Icon name="calendar_today" /></span>
                  <input
                    type="date"
                    value={birthday}
                    onChange={(e) => setBirthday(e.target.value)}
                    onBlur={() => setTouchedPersonal((t) => ({ ...t, birthday: true }))}
                  />
                </div>
                {touchedPersonal.birthday && !birthday ? (
                  <span className="form-error">La fecha es requerida</span>
                ) : null}
              </div>

              <div className="form-group">
                <label>Contraseña</label>
                <div
                  className={`input-wrapper ${touchedPersonal.password && password.length < 6 ? "error" : ""}`}
                >
                  <span className="input-icon"><Icon name="lock_outline" /></span>
                  <input
                    type={hidePassword ? "password" : "text"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    onBlur={() => setTouchedPersonal((t) => ({ ...t, password: true }))}
                    placeholder="Mínimo 6 caracteres"
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
                {touchedPersonal.password && password.length > 0 && password.length < 6 ? (
                  <span className="form-error">Mínimo 6 caracteres</span>
                ) : null}
              </div>

              <div className="form-group">
                <label>Confirmar contraseña</label>
                <div
                  className={`input-wrapper ${passwordMismatch && touchedPersonal.confirmationPassword ? "error" : ""}`}
                >
                  <span className="input-icon"><Icon name="lock_outline" /></span>
                  <input
                    type={hideConfirm ? "password" : "text"}
                    value={confirmationPassword}
                    onChange={(e) => setConfirmationPassword(e.target.value)}
                    onBlur={() => setTouchedPersonal((t) => ({ ...t, confirmationPassword: true }))}
                    placeholder="Repite tu contraseña"
                  />
                  <button
                    type="button"
                    className="input-toggle"
                    onClick={() => setHideConfirm((v) => !v)}
                    aria-label={hideConfirm ? "Mostrar contraseña" : "Ocultar contraseña"}
                  >
                    <Icon name={hideConfirm ? "visibility_off" : "visibility"} />
                  </button>
                </div>
                {passwordMismatch && touchedPersonal.confirmationPassword ? (
                  <span className="form-error">Las contraseñas no coinciden</span>
                ) : null}
              </div>

              <button type="submit" className="auth-btn">
                <span>Siguiente</span>
                <Icon name="arrow_forward" />
              </button>
            </form>
          </>
        ) : (
          <>
            <h1 className="auth-card__title">Tu organización</h1>
            <p className="auth-card__subtitle">Paso 2 de 2 — Datos de tu empresa o negocio</p>

            <form className="auth-card__form" onSubmit={handleSubmit}>
              <div className="form-group">
                <label>Nombre de la empresa</label>
                <div className="input-wrapper">
                  <span className="input-icon"><Icon name="business" /></span>
                  <input
                    value={orgName}
                    onChange={(e) => setOrgName(e.target.value)}
                    onBlur={() => { setTouchedOrg((t) => ({ ...t, name: true })); generateCode(); }}
                    placeholder="Ej: Mi Empresa S.A."
                  />
                </div>
                {touchedOrg.name && orgName.length < 2 ? (
                  <span className="form-error">El nombre es requerido</span>
                ) : null}
              </div>

              <div className="form-group">
                <label>Código único</label>
                <div className="input-wrapper">
                  <span className="input-icon"><Icon name="tag" /></span>
                  <input
                    value={orgCode}
                    onChange={(e) => { setOrgCode(e.target.value); setCodeDirty(true); setTouchedOrg((t) => ({ ...t, code: true })); }}
                    placeholder="MIEMPRESA"
                    style={{ textTransform: "uppercase" }}
                  />
                </div>
                <span className="form-hint">Identificador único de tu organización (se genera automáticamente)</span>
                {touchedOrg.code && orgCode.length < 2 ? (
                  <span className="form-error">El código es requerido</span>
                ) : null}
              </div>

              <div className="auth-card__info">
                <Icon name="info_outline" />
                <span>Como administrador, luego podrás agregar empleados y asignarles roles desde el dashboard.</span>
              </div>

              <div className="btn-row">
                <button
                  type="button"
                  className="auth-btn auth-btn--outline"
                  onClick={() => { setCurrentStep(0); setErrorMessage(""); }}
                >
                  <Icon name="arrow_back" />
                  <span>Atrás</span>
                </button>
                <button type="submit" className="auth-btn" disabled={isLoading}>
                  {isLoading ? (
                    <div className="spinner" />
                  ) : (
                    <>
                      <span>Crear cuenta</span>
                      <Icon name="rocket_launch" />
                    </>
                  )}
                </button>
              </div>
            </form>
          </>
        )}

        <p className="auth-card__footer">
          ¿Ya tienes cuenta? <Link href="/login">Iniciar sesión</Link>
        </p>
      </div>
    </div>
  );
}
