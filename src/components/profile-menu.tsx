import Link from "next/link";
import { signout } from "@/app/login/actions";
import { ProfileAvatar } from "@/components/profile-avatar";
import { navigationContext } from "@/lib/app-navigation";

export function ProfileMenu({ signedIn = true, context = "" }: { signedIn?: boolean; context?: string }) {
  const profileContext = navigationContext("", context, "/more/profile");
  return (
    <details className="profile-menu">
      <summary aria-label="Open profile menu">
        <ProfileAvatar signedIn={signedIn} />
      </summary>
      <nav aria-label="Profile">
        {signedIn ? <>
          <Link href={`/more/profile${profileContext ? `?${profileContext}` : ""}`}>Bio & profile</Link>
          <Link href="/more/settings">Account settings</Link>
          <Link className="profile-menu-extras" href={`/more/clubhouse-extras${profileContext ? `?${profileContext}` : ""}`}>
            <span>Clubhouse Extras</span>
            <small>Cold ones. Hot takes.</small>
          </Link>
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
