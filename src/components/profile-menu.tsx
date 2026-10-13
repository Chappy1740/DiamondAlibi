import Link from "next/link";
import { UserRound } from "lucide-react";
import { signout } from "@/app/login/actions";

export function ProfileMenu({ signedIn = true, context = "" }: { signedIn?: boolean; context?: string }) {
  return (
    <details className="profile-menu">
      <summary aria-label="Open profile menu">
        <UserRound size={22} aria-hidden />
      </summary>
      <nav aria-label="Profile">
        {signedIn ? <>
          <Link href="/more/profile">Bio & profile</Link>
          <Link href="/more/settings">Account settings</Link>
          <Link href={`/club${context ? `?${context}` : ""}`}>Team management</Link>
          <Link href="/more/alibi">My alibis</Link>
          <form action={signout}>
            <button type="submit">Sign out</button>
          </form>
        </> : <Link href="/login">Sign in</Link>}
      </nav>
    </details>
  );
}
