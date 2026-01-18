import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import { AxiosError } from "axios";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function getAxiosErrorMessage(err: unknown): string {
  if (!err) return "An unknown error occurred";

  if ((err as AxiosError).isAxiosError) {
    const axiosErr = err as AxiosError<any>;
    const data = axiosErr.response?.data;
    if (!data) return axiosErr.message;

    if (data.errors && typeof data.errors === "object") {
      const allErrors = Object.values(data.errors)
        .flat()
        .join("; ");
      return allErrors;
    }

    if (data.message) return data.message;

    return JSON.stringify(data);
  }

  return (err as Error).message ?? String(err);
}


export function getUserDisplayName(profile: any): string {
  if (!profile) return "Потребител";
  
  if (profile.displayFullName) return profile.displayFullName;
  
  if (profile.firstName || profile.lastName) {
    return [profile.firstName, profile.lastName].filter(Boolean).join(" ").trim();
  }

  return "Потребител";
}


export function getInitials(name: string = ""): string {
  const parts = name?.trim().split(/\s+/).filter(Boolean);

  if (!parts || parts.length === 0) return "??";

  const firstInitial = parts[0][0];

  if (parts.length === 1) {
    return firstInitial.toUpperCase();
  }
  const lastInitial = parts[parts.length - 1][0];

  return (firstInitial + lastInitial).toUpperCase();
}

export function getUserUsername(profile: any): string {
  if (profile && profile.username) {
    return `@${profile.username}`;
  }
  return "";
}

/*
export function getAxiosErrorMessage(err: unknown): string {
  if (!err) return "An unknown error occurred";
  if ((err as AxiosError).isAxiosError) {
    const axiosErr = err as AxiosError<any>;
    const data = axiosErr.response?.data;
    if (!data) return axiosErr.message;
    // If your API returns { message, errors: [...] }
    if (typeof data === "object") {
      if (data.message) return data.message;
      if (Array.isArray(data.errors)) return data.errors.join("; ");
    }
    return JSON.stringify(data);
  }
  return (err as Error).message ?? String(err);
}*/