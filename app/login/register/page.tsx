"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Icon } from "@/components/ui/Icon";
import { useRegiterWithOrganizationMutation } from "../_service/authApi";
// import { registerWithOrganization } from "@/lib/auth-api";
import Image from "next/image";
import { DatePickerSimple } from "@/components/DatePickerSimple";
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export default function RegisterPage() {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(0);
  const [errorMessage, setErrorMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [hidePassword, setHidePassword] = useState(true);
  const [hideConfirm, setHideConfirm] = useState(true);

  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phonePrefix, setPhonePrefix] = useState("+53");
  const [phoneDigits, setPhoneDigits] = useState("");
  const [birthday, setBirthday] = useState("");
  const [password, setPassword] = useState("");
  const [confirmationPassword, setConfirmationPassword] = useState("");
  const [orgName, setOrgName] = useState("");
  const [orgCode, setOrgCode] = useState("");
  const [codeDirty, setCodeDirty] = useState(false);

  const [touchedPersonal, setTouchedPersonal] = useState<Record<string, boolean>>({});
  const [touchedOrg, setTouchedOrg] = useState<Record<string, boolean>>({});

  const [registerWithOrganization] = useRegiterWithOrganizationMutation()

  const passwordMismatch = !!password && !!confirmationPassword && password !== confirmationPassword;

  const hasMinLength = password.length >= 6;
  const hasUpperCase = /[A-Z]/.test(password);
  const hasSpecialChar = /[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]/.test(password);
  const passwordValid = hasMinLength && hasUpperCase && hasSpecialChar;

  const phoneDigitsOnly = phoneDigits.replace(/\D/g, "");
  const phoneValidByPrefix =
    !phoneDigitsOnly ||
    (phonePrefix === "+53" && /^\d{7,8}$/.test(phoneDigitsOnly)) ||
    (phonePrefix === "+1" && /^\d{10}$/.test(phoneDigitsOnly));
  const phoneFull = phoneDigitsOnly ? `${phonePrefix}${phoneDigitsOnly}` : "";

  const personalValid =
    fullName.length >= 3 &&
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) &&
    birthday &&
    passwordValid &&
    !passwordMismatch &&
    phoneValidByPrefix;

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
      phone: true,
    });
    if (!personalValid) {
      if (passwordMismatch) setErrorMessage("Las contraseñas no coinciden.");
      else if (password.length > 0 && !passwordValid)
        setErrorMessage("La contraseña requiere 6 caracteres, incluyendo al menos 1 letra en mayúsculas y 1 carácter especial.");
      else if (phoneDigitsOnly && !phoneValidByPrefix)
        setErrorMessage(phonePrefix === "+53" ? "Teléfono Cuba: 7 u 8 dígitos." : "Teléfono EE.UU./Canadá: 10 dígitos.");
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
      await registerWithOrganization({
        organizationName: orgName,
        organizationCode: orgCode,
        fullName,
        email,
        password,
        confirmationPassword,
        birthday: new Date(birthday).toISOString(),
        phone: phoneFull || "",
        gender: null,
      });
      router.push("/login");
    } catch (err: any) {
      setIsLoading(false);
      setErrorMessage(
        err?.data?.message ?? err?.message ?? "Ocurrió un error. Intenta de nuevo."
      );
    }
  };

  return (
    <div className="auth-page auth-page--register">
      <div className="auth-page__bg-dashboard" />

      <header className="auth-header">
        <Link className="auth-header__logo" href="/">
          <Image
            src="/assets/strova-claro-nobg.png"
            alt="Strova"
            className="auth-header__logo-img"
            height={32}
            width={32}
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

              <div className="form-group">
                <label>Teléfono <span className="optional">(opcional)</span></label>
                <div className="input-wrapper input-wrapper--phone">
                  <Select
                    value={phonePrefix}
                    onValueChange={(val: string) => {
                      setPhonePrefix(val);
                      if (val === "+53" && phoneDigits.replace(/\D/g, "").length > 8)
                        setPhoneDigits((d) => d.replace(/\D/g, "").slice(0, 8));
                    }}
                  >
                    <SelectTrigger className="phone-prefix-trigger">
                      <SelectValue>
                        {phonePrefix === "+53" ? (
                          <span className="phone-option">
                            <img src="https://flagcdn.com/w20/cu.png" alt="CU" width={20} height={14} className="phone-flag" />
                            +53
                          </span>
                        ) : (
                          <span className="phone-option">
                            <img src="https://flagcdn.com/w20/us.png" alt="US" width={20} height={14} className="phone-flag" />
                            +1
                          </span>
                        )}
                      </SelectValue>
                    </SelectTrigger>
                      <SelectContent>
                        <SelectGroup>
                          <SelectItem value="+53">
                            <span className="phone-option">
                              <img src="https://flagcdn.com/w20/cu.png" alt="CU" width={20} height={14} className="phone-flag" />
                              +53
                            </span>
                          </SelectItem>
                          <SelectItem value="+1">
                            <span className="phone-option">
                              <img src="https://flagcdn.com/w20/us.png" alt="US" width={20} height={14} className="phone-flag" />
                              +1
                            </span>
                          </SelectItem>
                        </SelectGroup>
                      </SelectContent>
                  </Select>
                  <input
                    type="tel"
                    inputMode="numeric"
                    value={phoneDigits}
                    onChange={(e) => setPhoneDigits(e.target.value.replace(/\D/g, "").slice(0, phonePrefix === "+1" ? 10 : 8))}
                    onBlur={() => setTouchedPersonal((t) => ({ ...t, phone: true }))}
                    placeholder="+1 234 567"
                    className="phone-number-input"
                  />
                </div>
                {touchedPersonal.phone && phoneDigitsOnly && !phoneValidByPrefix ? (
                  <span className="form-error">
                    {phonePrefix === "+53" ? "Introduce 7 u 8 dígitos (ej. 51234567)." : "Introduce 10 dígitos (ej. 2345678901)."}
                  </span>
                ) : null}
              </div>

              <div className="form-group">
                <label>Fecha de nacimiento</label>
                {/* <div
                  className={`input-wrapper ${touchedPersonal.birthday && !birthday ? "error" : ""}`}
                >
                  <span className="input-icon"><Icon name="calendar_today" /></span> */}
                <DatePickerSimple
                  date={birthday}
                  setDate={(date) => setBirthday(date ? date : "")}
                />
                {/* <input
                    type="date"
                    value={birthday}
                    onChange={(e) => setBirthday(e.target.value)}
                    onBlur={() => setTouchedPersonal((t) => ({ ...t, birthday: true }))}
                  /> */}
                {/* </div> */}
                {touchedPersonal.birthday && !birthday ? (
                  <span className="form-error">La fecha es requerida</span>
                ) : null}
              </div>

              <div className="form-group">
                <label>Contraseña</label>
                <div
                  className={`input-wrapper ${touchedPersonal.password && password.length > 0 && !passwordValid ? "error" : ""}`}
                >
                  <span className="input-icon"><Icon name="lock_outline" /></span>
                  <input
                    type={hidePassword ? "password" : "text"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    onBlur={() => setTouchedPersonal((t) => ({ ...t, password: true }))}
                    placeholder="Escriba su contraseña"
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
                <span className="form-hint">Mínimo 6 caracteres, al menos 1 mayúscula y 1 carácter especial.</span>
                {touchedPersonal.password && password.length > 0 && !passwordValid ? (
                  <span className="form-error">La contraseña requiere 6 caracteres, incluyendo al menos 1 letra en mayúsculas y 1 carácter especial.</span>
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

              <button type="submit" className="auth-btn" disabled={!personalValid}>
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
