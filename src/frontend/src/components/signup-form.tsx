"use client";

import Image from "next/image";

import React, { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { cn } from "@frontend/lib/utils"; 
import { Button } from "@frontend/components/ui/button";
import { Card, CardContent } from "@frontend/components/ui/card";
import {
  Field,
  FieldDescription,
  FieldGroup,
  FieldLabel,
  FieldSeparator,
} from "@frontend/components/ui/field";
import { Input } from "@frontend/components/ui/input";
import { useRegister } from "@frontend/hooks/use-auth";
import { getAxiosErrorMessage } from "@frontend/lib/utils";
import { Gender } from "@frontend/lib/types/auth";

export default function SignupForm({ className, ...props }: React.ComponentProps<"div">) {
  const router = useRouter();
  const register = useRegister();

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [gender, setGender] = useState<Gender | number>();
  const [birthDay, setBirthDay] = useState<number>(1);
  const [birthMonth, setBirthMonth] = useState<number>(1);
  const [birthYear, setBirthYear] = useState<number>(1995);
  const [localError, setLocalError] = useState<string | null>(null);

  const days = useMemo(() => Array.from({ length: 31 }, (_, i) => i + 1), []);
  const months = useMemo(() => Array.from({ length: 12 }, (_, i) => i + 1), []);
  const years = useMemo(() => {
    const currentYear = new Date().getFullYear();
    const start = 1900;
    return Array.from({ length: currentYear - start + 1 }, (_, i) => currentYear - i);
  }, []);

  function validateForm() {
    if (!firstName || !lastName || !username || !email || !password) {
      setLocalError("Please fill all required fields.");
      return false;
    }
    if (password.length < 8) {
      setLocalError("Password must be at least 8 characters long.");
      return false;
    }
    if (password !== confirmPassword) {
      setLocalError("Passwords do not match.");
      return false;
    }
    try {
      const dob = new Date(Number(birthYear), Number(birthMonth) - 1, Number(birthDay));
      const age = new Date().getFullYear() - dob.getFullYear() - (new Date() < new Date(dob.getFullYear() + (new Date().getFullYear() - dob.getFullYear()), dob.getMonth(), dob.getDate()) ? 1 : 0);
      if (age < 14) {
        setLocalError("You must be at least 14 years old.");
        return false;
      }
    } catch {
      setLocalError("Invalid date of birth.");
      return false;
    }
    setLocalError(null);
    return true;
  }

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (!validateForm()) return;

    const payload = {
     FirstName: firstName,
     LastName: lastName,
     BirthDay: birthDay,
     BirthMonth: birthMonth,
     BirthYear: birthYear,
     Sex: gender,       
     UserName: username,
     Email: email,
     Password: password,
     };

    
    register.mutate(payload, {
      onSuccess: (data: any) => {
        localStorage.setItem("pendingConfirmationEmail", email);
        router.push("/auth/confirmation-sent"); 
      },
      onError: (err: any) => {
        const msg = getAxiosErrorMessage(err);
        setLocalError(msg);
      },
    });
  }

  return (
    <div className={cn("flex flex-col gap-6", className)} {...props}>
      <Card className="overflow-hidden p-0">
        <CardContent className="grid p-0 md:grid-cols-2">
          <form className="p-6 md:p-8" onSubmit={onSubmit}>
            <FieldGroup>
              <div className="flex flex-col items-center gap-2 text-center">
                <h1 className="text-2xl font-bold">Create your account</h1>
                <p className="text-muted-foreground text-sm text-balance">
                  Enter your details below to create your account
                </p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <Field>
                  <FieldLabel htmlFor="firstName">First name</FieldLabel>
                  <Input id="firstName" value={firstName} onChange={(e) => setFirstName(e.target.value)} required />
                </Field>
                <Field>
                  <FieldLabel htmlFor="lastName">Last name</FieldLabel>
                  <Input id="lastName" value={lastName} onChange={(e) => setLastName(e.target.value)} required />
                </Field>
              </div>

              <Field>
                <FieldLabel>Username</FieldLabel>
                <Input value={username} onChange={(e) => setUsername(e.target.value)} required />
              </Field>

              <Field>
                <FieldLabel htmlFor="email">Email</FieldLabel>
                <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
                <FieldDescription>We'll use this to contact you.</FieldDescription>
              </Field>

              <Field>
                <FieldLabel>Date of birth</FieldLabel>
                <div className="flex gap-2">
                  <select value={birthDay} onChange={(e) => setBirthDay(Number(e.target.value))} className="border rounded p-2">
                    {days.map((d) => <option key={d} value={d}>{d}</option>)}
                  </select>
                  <select value={birthMonth} onChange={(e) => setBirthMonth(Number(e.target.value))} className="border rounded p-2">
                    {months.map((m) => <option key={m} value={m}>{m}</option>)}
                  </select>
                  <select value={birthYear} onChange={(e) => setBirthYear(Number(e.target.value))} className="border rounded p-2">
                    {years.map((y) => <option key={y} value={y}>{y}</option>)}
                  </select>
                </div>
                <FieldDescription>We use this to verify your age.</FieldDescription>
              </Field>

              <Field>
                <FieldLabel>Gender</FieldLabel>
                <div className="flex gap-3">
                  <label className="inline-flex items-center gap-2">
                    <input type="radio" name="gender" checked={gender === Gender.Female} onChange={() => setGender(Gender.Female)} />
                    <span>Female</span>
                  </label>
                  <label className="inline-flex items-center gap-2">
                    <input type="radio" name="gender" checked={gender === Gender.Male} onChange={() => setGender(Gender.Male)} />
                    <span>Male</span>
                  </label>
                  <label className="inline-flex items-center gap-2">
                    <input type="radio" name="gender" checked={gender === Gender.Other} onChange={() => setGender(Gender.Other)} />
                    <span>Other</span>
                  </label>
                </div>
              </Field>

              <Field>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <FieldLabel htmlFor="password">Password</FieldLabel>
                    <Input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
                  </div>
                  <div>
                    <FieldLabel htmlFor="confirmPassword">Confirm Password</FieldLabel>
                    <Input id="confirmPassword" type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} required />
                  </div>
                </div>
                <FieldDescription>Must be at least 8 characters long.</FieldDescription>
              </Field>

              {localError && <div className="text-sm text-red-600">{localError}</div>}

            <Button
              type="submit"
              disabled={register.isPending}
              className="bg-primary hover:underline text-primary-foreground"
            >
              {register.isPending ? "Creating..." : "Create Account"}
            </Button>


              <FieldSeparator className="*:data-[slot=field-separator-content]:bg-card">Or continue with</FieldSeparator>

              <FieldDescription className="text-center">
                Already have an account? <a href="/auth/login" className="text-primary hover:underline">Login</a>
              </FieldDescription>

            </FieldGroup>
          </form>

          <div className="bg-muted relative hidden md:block w-100% h-full">
            <Image
              src="/TU-images/tu-icon.png"
              alt="Image"
              fill
             className="object-contain object-center bg-white"
              priority
            />
       </div>

        </CardContent>
      </Card>

     <FieldDescription className="px-6 text-center">
       By clicking continue, you agree to our <a href="#" className="text-primary hover:text-primary-hover">Terms of Service</a> and <a href="#" className="text-primary hover:text-primary-hover">Privacy Policy</a>.
    </FieldDescription>

    </div>
  );
}
