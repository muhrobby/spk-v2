import { LoginForm } from "../_components/login-form";

export default function LoginPage() {
  return (
    <div className="mx-auto flex w-full flex-col justify-center space-y-8 sm:w-[350px]">
      <div className="space-y-2 text-center">
        <h1 className="font-medium text-3xl">Login to your account</h1>
        <p className="text-muted-foreground text-sm">Please enter your details to login.</p>
      </div>

      <LoginForm />
    </div>
  );
}
