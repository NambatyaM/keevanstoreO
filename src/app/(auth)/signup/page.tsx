// ============================================================
// Signup Page
// ============================================================
"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Eye,
  EyeOff,
  Mail,
  Lock,
  Loader2,
  User,
  AtSign,
  Check,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/hooks/use-auth";
import { USERNAME_RULES } from "@/lib/constants";
import { toast } from "sonner";

export default function SignupPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [username, setUsername] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [agreeTerms, setAgreeTerms] = useState(false);
  const [usernameStatus, setUsernameStatus] = useState<
    "idle" | "checking" | "available" | "taken" | "invalid"
  >("idle");
  const { signup, isLoading } = useAuth();
  const router = useRouter();

  // Debounced username check
  const checkUsernameRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const checkUsername = useCallback(
    (value: string) => {
      // Clear any pending check
      if (checkUsernameRef.current) {
        clearTimeout(checkUsernameRef.current);
      }

      if (!value) {
        setUsernameStatus("idle");
        return;
      }

      // Validate format
      if (!USERNAME_RULES.PATTERN.test(value)) {
        setUsernameStatus("invalid");
        return;
      }

      if (value.length < USERNAME_RULES.MIN_LENGTH) {
        setUsernameStatus("invalid");
        return;
      }

      setUsernameStatus("checking");
      checkUsernameRef.current = setTimeout(async () => {
        try {
          const res = await fetch(
            `/api/auth/signup?check_username=${encodeURIComponent(value)}`
          );
          const data = await res.json();
          setUsernameStatus(data.available ? "available" : "taken");
        } catch {
          setUsernameStatus("idle");
        }
      }, 500);
    },
    []
  );

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (checkUsernameRef.current) {
        clearTimeout(checkUsernameRef.current);
      }
    };
  }, []);

  const handleUsernameChange = (value: string) => {
    const sanitized = value.toLowerCase().replace(/[^a-z0-9-]/g, "");
    setUsername(sanitized);
    checkUsername(sanitized);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!email || !password || !username || !displayName) {
      toast.error("Please fill in all fields");
      return;
    }

    if (usernameStatus === "taken" || usernameStatus === "invalid") {
      toast.error("Please choose a valid, available username");
      return;
    }

    if (password.length < 6) {
      toast.error("Password must be at least 6 characters");
      return;
    }

    if (!agreeTerms) {
      toast.error("Please agree to the terms of service");
      return;
    }

    const result = await signup(email, password, username, displayName);
    if (result.success) {
      toast.success("Welcome to Keevan Store! 🎉");
      router.push("/dashboard");
    } else {
      toast.error(result.error || "Signup failed");
    }
  };

  const getUsernameIcon = () => {
    switch (usernameStatus) {
      case "checking":
        return <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />;
      case "available":
        return <Check className="h-4 w-4 text-emerald-500" />;
      case "taken":
      case "invalid":
        return <X className="h-4 w-4 text-destructive" />;
      default:
        return <AtSign className="h-4 w-4 text-muted-foreground" />;
    }
  };

  const getUsernameMessage = () => {
    switch (usernameStatus) {
      case "checking":
        return "Checking availability...";
      case "available":
        return "Username is available!";
      case "taken":
        return "Username is already taken";
      case "invalid":
        return `Must be ${USERNAME_RULES.MIN_LENGTH}-${USERNAME_RULES.MAX_LENGTH} chars, lowercase letters, numbers, and hyphens only`;
      default:
        return `${USERNAME_RULES.MIN_LENGTH}-${USERNAME_RULES.MAX_LENGTH} chars, lowercase letters, numbers, and hyphens`;
    }
  };

  const getUsernameMessageColor = () => {
    switch (usernameStatus) {
      case "available":
        return "text-emerald-600";
      case "taken":
      case "invalid":
        return "text-destructive";
      default:
        return "text-muted-foreground";
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-emerald-50 via-white to-teal-50 dark:from-background dark:via-background dark:to-background p-4">
      <div className="w-full max-w-md">
        {/* Brand */}
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-2">
            <div className="h-10 w-10 rounded-xl bg-emerald-500 flex items-center justify-center">
              <span className="text-white font-bold text-lg">K</span>
            </div>
            <span className="text-2xl font-bold text-foreground">Keevan Store</span>
          </Link>
          <p className="text-muted-foreground mt-2 text-sm">
            Create your online store in minutes
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Create Account</CardTitle>
            <CardDescription>
              Set up your creator account and start selling
            </CardDescription>
          </CardHeader>
          <form onSubmit={handleSubmit}>
            <CardContent className="space-y-4">
              {/* Display Name */}
              <div className="space-y-2">
                <Label htmlFor="displayName">Display Name</Label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="displayName"
                    placeholder="Sarah Creates"
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    className="pl-9"
                    required
                  />
                </div>
              </div>

              {/* Username */}
              <div className="space-y-2">
                <Label htmlFor="username">Username</Label>
                <div className="relative">
                  {getUsernameIcon() && (
                    <div className="absolute right-3 top-1/2 -translate-y-1/2">
                      {getUsernameIcon()}
                    </div>
                  )}
                  <Input
                    id="username"
                    placeholder="sarah-creates"
                    value={username}
                    onChange={(e) => handleUsernameChange(e.target.value)}
                    className="pr-9"
                    maxLength={USERNAME_RULES.MAX_LENGTH}
                    required
                  />
                </div>
                <p className={`text-xs ${getUsernameMessageColor()}`}>
                  {getUsernameMessage()}
                </p>
              </div>

              {/* Email */}
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="you@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="pl-9"
                    required
                  />
                </div>
              </div>

              {/* Password */}
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="pl-9 pr-9"
                    required
                    minLength={6}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </button>
                </div>
                <p className="text-xs text-muted-foreground">
                  Must be at least 6 characters
                </p>
              </div>

              {/* Terms */}
              <div className="flex items-start space-x-2">
                <Checkbox
                  id="terms"
                  checked={agreeTerms}
                  onCheckedChange={(checked) => setAgreeTerms(checked === true)}
                />
                <Label htmlFor="terms" className="text-xs text-muted-foreground leading-relaxed">
                  I agree to the{" "}
                  <span className="text-emerald-600 hover:underline cursor-pointer">
                    Terms of Service
                  </span>{" "}
                  and{" "}
                  <span className="text-emerald-600 hover:underline cursor-pointer">
                    Privacy Policy
                  </span>
                </Label>
              </div>
            </CardContent>
            <CardFooter className="flex flex-col gap-3">
              <Button
                type="submit"
                className="w-full bg-emerald-600 hover:bg-emerald-700 text-white"
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Creating account...
                  </>
                ) : (
                  "Create Account"
                )}
              </Button>

              <p className="text-sm text-muted-foreground text-center">
                Already have an account?{" "}
                <Link
                  href="/login"
                  className="text-emerald-600 hover:text-emerald-700 font-medium"
                >
                  Sign in
                </Link>
              </p>
            </CardFooter>
          </form>
        </Card>
      </div>
    </div>
  );
}
