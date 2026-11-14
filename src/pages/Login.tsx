import { useState } from "react";
import { useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import { useLocation } from "react-router";
import { useAuth } from "../app/auth-context";
import { loginSchema } from "../services/validation";
import { Button } from "../components/ui";
import { Icon } from "../components/Icon";
import styles from "./login.module.css";
import ui from "../components/ui.module.css";

export function Login() {
  const { login } = useAuth();
  const { state } = useLocation();
  const [visible, setVisible] = useState(false);
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    setError,
  } = useForm({ resolver: yupResolver(loginSchema), defaultValues: { email: "", password: "" } });
  return (
    <main className={styles.login}>
      <header className={styles.brand}>
        <img src="/images/logo.svg" width={44} height={44} alt="" />
        <p>E-Pharmacy</p>
      </header>
      <section className={styles.content} aria-labelledby="login-title">
        <picture>
          <source media="(min-width: 768px)" srcSet="/images/pill-tablet@2x.png" />
          <img
            src="/images/pill@2x.png"
            width={95}
            height={93}
            alt=""
            fetchPriority="high"
            className={styles.pill}
          />
        </picture>
        <h1 id="login-title">
          Your medication, delivered Say goodbye to all <span>your healthcare </span>worries with us
        </h1>
        <form
          noValidate
          onSubmit={handleSubmit(async (values) => {
            try {
              await login(values.email, values.password);
            } catch (error) {
              setError("root", {
                message: error instanceof Error ? error.message : "Login failed. Please try again.",
              });
            }
          })}
          className={styles.form}
          aria-busy={isSubmitting}
        >
          <div>
            <label htmlFor="login-email" className="srOnly">
              Email address
            </label>
            <input
              className={ui.input}
              id="login-email"
              type="email"
              autoComplete="username"
              placeholder="Email address"
              {...register("email")}
              aria-invalid={!!errors.email || undefined}
              aria-describedby={errors.email ? "login-email-error" : undefined}
              disabled={isSubmitting}
            />
            {errors.email && (
              <p className={ui.fieldError} id="login-email-error" role="alert">
                {errors.email.message}
              </p>
            )}
          </div>
          <div>
            <label htmlFor="login-password" className="srOnly">
              Password
            </label>
            <div className={styles.password}>
              <input
                className={ui.input}
                id="login-password"
                type={visible ? "text" : "password"}
                autoComplete="current-password"
                placeholder="Password"
                {...register("password")}
                aria-invalid={!!errors.password || undefined}
                aria-describedby={errors.password ? "login-password-error" : undefined}
                disabled={isSubmitting}
              />
              <button
                type="button"
                aria-label={visible ? "Hide password" : "Show password"}
                aria-pressed={visible}
                disabled={isSubmitting}
                onClick={() => setVisible(!visible)}
              >
                <Icon name={visible ? "eye" : "eye-off"} />
              </button>
            </div>
            {errors.password && (
              <p className={ui.fieldError} id="login-password-error" role="alert">
                {errors.password.message}
              </p>
            )}
          </div>
          {errors.root && (
            <p className={ui.fieldError} role="alert">
              {errors.root.message}
            </p>
          )}
          {state?.notice && (
            <p className={ui.fieldError} role="status">
              {String(state.notice)}
            </p>
          )}
          <Button type="submit" pending={isSubmitting} className={styles.submit}>
            Log in
          </Button>
        </form>
      </section>
      <picture>
        <source media="(min-width: 768px)" srcSet="/images/elements-tablet.png" />
        <img
          src="/images/elements@2x.png"
          width={258}
          height={146}
          alt=""
          className={styles.decoration}
        />
      </picture>
    </main>
  );
}
