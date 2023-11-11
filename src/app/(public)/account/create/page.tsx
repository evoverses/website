import { UserAuthForm } from "@/app/(public)/account/user-auth-form";
import Logo from "@/app/icon.png";
import GameScreenshot1 from "@/assets/images/game-screenshot-1.png";
import { buttonVariants } from "@/components/ui/button";

import { cn } from "@/lib/utils";
import { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Create Account",
};

const CreateAccountPage = () => {
  return (
    <main className="container relative h-full min-h-screen flex-col items-center justify-center grid lg:max-w-none lg:grid-cols-2 lg:px-0">
      <Link
        href="/"
        className="absolute left-4 top-4 z-10 md:left-8 md:top-8 flex items-center space-x-2 text-lg font-medium"
      >
        <Image src={Logo} alt="EvoVerses" width={48} height={48} className="w-8 h-8 md:w-12 md:h-12" />
        <span>EvoVerses</span>
      </Link>
      <Link
        href="/account/login"
        className={cn(
          buttonVariants({ variant: "ghost" }),
          "absolute right-4 top-4 md:right-8 md:top-8",
        )}
      >
        Login
      </Link>
      <div className="relative hidden h-full flex-col bg-muted p-10 text-white dark:border-r lg:flex">
        <div className="absolute inset-0 bg-zinc-900" />
        <Image
          src={GameScreenshot1}
          alt="Game Screenshot 1"
          className="object-cover object-left h-full absolute inset-0 brightness-50"
        />
        <div className="relative z-20 mt-auto">
          <blockquote className="space-y-2">
            <p className="text-lg">
              &ldquo;I must say, very nice work of the team. We had bumps but look at the current state atm. Its sick,
              cant wait to PVP with them.&rdquo;
            </p>
            <footer className="text-sm">Discord User</footer>
          </blockquote>
        </div>
      </div>
      <div className="lg:p-8">
        <div className="mx-auto flex w-full flex-col justify-center space-y-6 sm:w-[350px]">
          <div className="flex flex-col space-y-2 text-center">
            <h1 className="text-2xl font-semibold tracking-tight">
              Create an account
            </h1>
            <p className="text-sm text-muted-foreground">
              Enter your email below to create your account
            </p>
          </div>
          <UserAuthForm />
          <p className="px-8 text-center text-sm text-muted-foreground">
            By clicking continue, you agree to our{" "}
            <Link
              href="/terms"
              className="underline underline-offset-4 hover:text-primary"
            >
              Terms of Service
            </Link>{" "}
            and{" "}
            <Link
              href="/privacy"
              className="underline underline-offset-4 hover:text-primary"
            >
              Privacy Policy
            </Link>
            .
          </p>
        </div>
      </div>
    </main>
  );
};

export default CreateAccountPage;
