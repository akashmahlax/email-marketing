import SignIn from "@/components/auth/sign-in";

export default function SignInPage() {
  return (
    <div className="flex items-center bg-background justify-center min-h-screen">
      <div className="text-center">
        <h1 className="text-2xl font-bold ">Create Account With Google to access email marketing features</h1>
       <SignIn/>
      </div>
    </div>
  );
}
