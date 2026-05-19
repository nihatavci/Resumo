import { ResetPasswordForm } from "@/components/auth/reset-password-form";


export default function ResetPasswordPage() {
  return (
    <div className="min-h-screen bg-dia-canvas">
      <div className="container relative flex pt-20 flex-col items-center justify-center lg:px-0">
        <div className="mx-auto flex w-full flex-col justify-center space-y-6 sm:w-[350px]">
          <div className="flex flex-col space-y-2 text-center">
            <h1 className="text-2xl font-light tracking-tight">
              Reset your password
            </h1>
            <p className="text-sm text-muted-foreground">
              Enter your email address and we&apos;ll send you a link to reset your password.
            </p>
          </div>
          <ResetPasswordForm/>
        </div>
      </div>
    </div>
  )
} 