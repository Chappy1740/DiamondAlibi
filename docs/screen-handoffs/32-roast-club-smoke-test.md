# Roast Club first-run smoke test (owner, ~5 minutes)

Run after deploy, on the real app, with Will's own account. Use a test game, not a league game.
Nothing here changes any scoring. Stop and tell Claude if any step looks wrong.

## Turn it off fast (any time)
Cloudflare dashboard -> Workers -> diamond-alibi-preview -> Settings -> Variables: set `ROAST_CLUB_ENABLED` to `false` and save.
The Join control disappears and no roasts show or speak. Set it back to `true` to restore.
Note: a later deploy may reset the value to the one in `wrangler.jsonc` (`true`); re-check after any deploy.

## Steps
1. For the Team preferences release, open **Profile menu → Bio & profile → Team preferences** and check the team name. On the earlier release, open **Beverage → Season Beverage Board**. Expect: a Roast Club Join control, and you start OUT. [ ]
2. Tap Join. Expect: it says you are in. Reload; still in. [ ]
3. Open a test game, score a plain Hit for YOU. Expect: a funny single line with your name; stats unchanged. [ ]
4. Score an out for someone who has NOT joined. Expect: no popup. [ ]
5. Open Clubhouse announcer, mark this phone as the announcer, tap "Turn sound on and test". Score a hit for you. Expect: the roast is spoken (Daniel), nothing else. [ ]
6. Tap Leave. Score another hit for you. Expect: nothing. [ ]
7. Optional: mute and volume work; dismiss button closes the popup. [ ]
8. Flip the off switch (above) and reload. Expect: Join control gone. Flip back. [ ]

Record results (passed/failed/not tested) in `31-roast-club-status.md`. Not accepted until you say so.
