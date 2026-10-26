"use server";
import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import { supabaseServer } from "@/lib/supabase/server";
export type ClubResult = { error?: string; message?: string; code?: string };
const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
function field(form: FormData, name: string) {
  return String(form.get(name) ?? "").trim();
}
export async function clubAction(
  _previous: ClubResult,
  form: FormData,
): Promise<ClubResult> {
  const supabase = await supabaseServer();
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();
  if (userError || !user)
    return { error: "Sign in again before making changes." };
  const operation = field(form, "operation");
  const team = field(form, "team");
  const name = field(form, "name");
  const nickname = field(form, "nickname");
  const isTeamAction = !["create-team", "join-team", "profile", "bio"].includes(
    operation,
  );
  if (isTeamAction && !uuid.test(team))
    return { error: "Choose a valid team." };
  if (
    ["create-team", "create-season", "guest"].includes(operation) &&
    (!name || name.length > (operation === "guest" ? 40 : 80))
  )
    return { error: "Enter a name within the displayed limit." };
  if (
    ["create-team", "join-team", "profile"].includes(operation) &&
    (!nickname || nickname.length > 40)
  )
    return { error: "Enter a nickname of 1–40 characters." };
  const jar = await cookies();
  const setTeam = (id: string) =>
    jar.set("da-team", id, {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: 60 * 60 * 24 * 30,
    });
  let response;
  switch (operation) {
    case "create-team":
      response = await supabase.rpc("da_create_team", {
        p_name: name,
        p_nickname: nickname,
      });
      if (!response.error) setTeam(response.data);
      break;
    case "join-team": {
      const code = field(form, "code");
      if (!/^[0-9a-f]{36}$/i.test(code))
        return { error: "Invite unavailable or invalid." };
      response = await supabase.rpc("da_redeem_invite", {
        p_code: code,
        p_nickname: nickname,
      });
      if (!response.error && !response.data?.ok)
        return {
          error: response.data?.error ?? "Invite unavailable or invalid.",
        };
      if (!response.error) setTeam(response.data.team_id);
      break;
    }
    case "select-team": {
      const membership = await supabase
        .from("team_memberships")
        .select("team_id")
        .eq("team_id", team)
        .eq("user_id", user.id)
        .eq("active", true)
        .maybeSingle();
      if (membership.error || !membership.data)
        return { error: "Team unavailable." };
      setTeam(team);
      jar.delete("da-season");
      response = { error: null };
      break;
    }
    case "captain":
      response = await supabase.rpc("da_set_captain", {
        p_team: team,
        p_captain: field(form, "captain") === "true",
      });
      break;
    case "create-player-invite": {
      const player = field(form, "player");
      if (!uuid.test(player)) return { error: "Choose a valid roster player." };
      response = await supabase.rpc("da_create_player_invite", {p_team: team, p_player: player});
      if (response.error || !response.data?.[0]?.code) return {error: "Could not create this player invitation. Refresh and check team access; the player may already have an account."};
      revalidatePath("/club");
      return {code: response.data[0].code, message: "Private player invitation created. One account can use it within seven days. Share it only with this player; nothing was sent. Their existing stats and BEVs will stay with this roster entry."};
    }
    case "create-invite": {
      const uses = Number(field(form, "maxUses"));
      if (!Number.isInteger(uses) || uses < 1 || uses > 100)
        return { error: "Choose a use limit from 1 to 100." };
      response = await supabase.rpc("da_create_invite", {
        p_team: team,
        p_max_uses: uses,
      });
      if (!response.error) {
        revalidatePath("/club");
        return {
          code: response.data?.[0]?.code,
          message:
            "Invite created. Expires in seven days. Copy it manually; nothing was sent.",
        };
      }
      break;
    }
    case "revoke-invite": {
      const id = field(form, "invite");
      if (!uuid.test(id)) return { error: "Invite unavailable." };
      response = await supabase.rpc("da_revoke_invite", {
        p_team: team,
        p_invite: id,
      });
      break;
    }
    case "create-season":
      response = await supabase.rpc("da_create_season", {
        p_team: team,
        p_name: name,
      });
      if (!response.error)
        jar.set("da-season", response.data, {
          httpOnly: true,
          sameSite: "lax",
          secure: process.env.NODE_ENV === "production",
          path: "/",
        });
      break;
    case "select-season": {
      const id = field(form, "season");
      if (!uuid.test(id)) return { error: "Season unavailable." };
      const season = await supabase
        .from("team_seasons")
        .select("id")
        .eq("team_id", team)
        .eq("id", id)
        .maybeSingle();
      if (season.error || !season.data) return { error: "Season unavailable." };
      jar.set("da-season", id, {
        httpOnly: true,
        sameSite: "lax",
        secure: process.env.NODE_ENV === "production",
        path: "/",
      });
      response = { error: null };
      break;
    }
    case "archive-season": {
      const id = field(form, "season");
      if (!uuid.test(id)) return { error: "Season unavailable." };
      response = await supabase.rpc("da_archive_season", {
        p_team: team,
        p_season: id,
        p_archived: field(form, "archived") === "true",
      });
      if (!response.error && field(form, "archived") === "true" && jar.get("da-season")?.value === id) jar.delete("da-season");
      break;
    }
    case "guest":
      response = await supabase.rpc("da_add_guest", {
        p_team: team,
        p_name: name,
      });
      break;
    case "bio": {
      const bio = field(form, "bio");
      if (bio.length > 400) return { error: "Keep your bio within 400 characters." };
      response = await supabase.auth.updateUser({ data: { bio } });
      break;
    }
    case "profile":
      response = await supabase.rpc("da_save_profile", {
        p_nickname: nickname,
      });
      break;
    default:
      return { error: "Action unavailable." };
  }
  if (response.error)
    return {
      error:
        "Could not save this change. Check your team access and try again. Names must be valid and season names unique.",
    };
  revalidatePath("/club");
  if (operation === "archive-season") revalidatePath("/", "layout");
  revalidatePath("/more/profile");
  return { message: "Saved to your clubhouse." };
}
