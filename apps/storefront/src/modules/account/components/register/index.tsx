"use client"

import { useActionState } from "react"
import Input from "@modules/common/components/input"
import { LOGIN_VIEW } from "@modules/account/templates/login-template"
import ErrorMessage from "@modules/checkout/components/error-message"
import { SubmitButton } from "@modules/checkout/components/submit-button"
import LocalizedClientLink from "@modules/common/components/localized-client-link"
import { signup } from "@lib/data/customer"

type Props = {
  setCurrentView: (view: LOGIN_VIEW) => void
}

const Register = ({ setCurrentView }: Props) => {
  const [message, formAction] = useActionState(signup, null)

  return (
    <div
      className="flex w-full max-w-md flex-col items-center"
      data-testid="register-page"
    >
      <h1 className="mb-4 text-center text-3xl font-semibold uppercase tracking-[0.08em] text-black">
        Join Glabee
      </h1>
      <p className="mb-5 text-center text-base leading-7 text-black/65">
        Create your profile to save addresses, track orders, and check out
        faster when new drops arrive.
      </p>
      {message?.state === "verification_required" && (
        <div
          className="mb-4 w-full border border-black/10 bg-[#f8fafc] p-4 text-center text-base text-black/75"
          data-testid="register-verification-message"
        >
          We sent a verification link to <strong>{message.email}</strong>.
          Please check your inbox to verify your email, then sign in.
        </div>
      )}
      <form className="w-full flex flex-col" action={formAction}>
        <div className="flex w-full flex-col gap-y-3">
          <Input
            label="First name"
            name="first_name"
            required
            autoComplete="given-name"
            data-testid="first-name-input"
          />
          <Input
            label="Last name"
            name="last_name"
            required
            autoComplete="family-name"
            data-testid="last-name-input"
          />
          <Input
            label="Email"
            name="email"
            required
            type="email"
            autoComplete="email"
            data-testid="email-input"
          />
          <Input
            label="Phone"
            name="phone"
            type="tel"
            autoComplete="tel"
            data-testid="phone-input"
          />
          <Input
            label="Password"
            name="password"
            required
            type="password"
            autoComplete="new-password"
            data-testid="password-input"
          />
        </div>
        <ErrorMessage
          error={message?.state === "error" ? message.error : null}
          data-testid="register-error"
        />
        <span className="mt-6 text-center text-sm leading-6 text-black/65">
          By creating an account, you agree to Glabee&apos;s{" "}
          <LocalizedClientLink
            href="/content/privacy-policy"
            className="font-medium underline underline-offset-4"
          >
            Privacy Policy
          </LocalizedClientLink>{" "}
          and{" "}
          <LocalizedClientLink
            href="/content/terms-of-use"
            className="font-medium underline underline-offset-4"
          >
            Terms of Use
          </LocalizedClientLink>
          .
        </span>
        <SubmitButton className="w-full mt-6" data-testid="register-button">
          Join
        </SubmitButton>
      </form>
      <span className="mt-6 text-center text-sm text-black/70">
        Already a member?{" "}
        <button
          onClick={() => setCurrentView(LOGIN_VIEW.SIGN_IN)}
          className="font-medium underline underline-offset-4"
        >
          Sign in
        </button>
        .
      </span>
    </div>
  )
}

export default Register
