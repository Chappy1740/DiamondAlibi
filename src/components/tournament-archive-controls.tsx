"use client";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { scoringAction, loadScorebook } from "@/app/club/scoring-actions";

type Request = {type: "archiveTournament"; teamId: string; seasonId: string; tournamentId: string; commandId: string; expectedRevision: number; archived: boolean};
export function TournamentArchiveControls({team,season,id,name,archived,revision,seasonArchived}: {
  team:string; season:string; id:string; name:string; archived:boolean; revision:number; seasonArchived:boolean;
}) {
  const router=useRouter();
  const [state,setState]=useState({archived,revision});
  const [confirming,setConfirming]=useState(false);
  const [busy,setBusy]=useState(false);
  const [online,setOnline]=useState(true);
  const [retry,setRetry]=useState(false);
  const [message,setMessage]=useState("");
  const lock=useRef(false), pending=useRef<Request|null>(null);
  const actionButton=useRef<HTMLButtonElement>(null), confirmButton=useRef<HTMLButtonElement>(null), wasConfirming=useRef(false);
  useEffect(()=>{if(confirming)confirmButton.current?.focus();else if(wasConfirming.current)actionButton.current?.focus();wasConfirming.current=confirming;},[confirming]);
  useEffect(()=>setState({archived,revision}),[archived,revision]);
  useEffect(()=>{const update=()=>setOnline(navigator.onLine);update();window.addEventListener("online",update);window.addEventListener("offline",update);return()=>{window.removeEventListener("online",update);window.removeEventListener("offline",update)}},[]);
  async function send(request:Request) {
    if(lock.current || !navigator.onLine || seasonArchived)return;
    lock.current=true;setBusy(true);pending.current=request;
    try {
      const result=await scoringAction(request);
      if(result.status!=="ok") {
        if(result.status==="uncertain" || result.status==="unavailable") {setRetry(true);setMessage("Archive change could not be confirmed. Retry the same change.");return;}
        pending.current=null;setRetry(false);
        setMessage(result.status==="paused" ? "Restore the season before changing its tournaments." : "Could not change this tournament. Check team access and refresh.");return;
      }
      const receipt=result.data as {status?:string;revision?:number};
      if(!["accepted","conflict"].includes(receipt.status??"")) {setRetry(true);setMessage("Archive change needs confirmation. Retry the same change.");return;}
      const loaded=await loadScorebook(team,season,"Overall");
      const current=loaded.status==="ok" && loaded.data.snapshot.teamId===team && loaded.data.snapshot.seasonId===season ? loaded.data.snapshot.tournaments.find(t=>t.id===id) : undefined;
      if(!current || typeof current.archived!=="boolean" || !Number.isSafeInteger(current.revision)) {setRetry(true);setMessage("Could not confirm the latest tournament state. Retry the same change.");return;}
      setState({archived:current.archived,revision:current.revision});
      if(receipt.status==="conflict" || (current.archived!==request.archived && typeof receipt.revision==="number" && current.revision>receipt.revision)) {
        pending.current=null;setRetry(false);setConfirming(false);setMessage("Tournament settings changed. Latest records are loaded; review before trying again.");router.refresh();return;
      }
      if(current.archived!==request.archived || current.revision<=request.expectedRevision) {setRetry(true);setMessage("Archive change needs confirmation. Retry the same change.");return;}
      pending.current=null;setRetry(false);setConfirming(false);
      setMessage(current.archived ? "Tournament archived. Find it under Archived tournaments; its games, stats and BEVs are retained." : "Tournament restored to the active list. Games, stats and BEVs are retained.");
      router.refresh();
    } catch {setRetry(true);setMessage("Archive change could not be confirmed. Retry the same change.");}
    finally {lock.current=false;setBusy(false);}
  }
  const disabled=busy || !online || seasonArchived;
  return <section className="archive-controls" aria-label="Tournament archive controls">
    <h3>{state.archived ? "Restore tournament" : "Archive tournament"}</h3>
    <p>Archive hides this tournament from the active list and pauses scoring. Saved games, statistics and BEVs stay in history. Restore brings it back.</p>
    {seasonArchived && <p>Restore the season in Team management before changing its tournaments.</p>}
    {!online && <p role="status">Offline. Reconnect before changing archive settings.</p>}
    {retry ? <button className="button secondary" disabled={disabled} onClick={()=>pending.current && void send(pending.current)}>Retry the same archive change</button> : confirming ? <form onSubmit={event=>{event.preventDefault();void send({type:"archiveTournament",teamId:team,seasonId:season,tournamentId:id,commandId:crypto.randomUUID(),expectedRevision:state.revision,archived:!state.archived})}}>
      <p>{state.archived ? "Restore" : "Archive"} {name}?</p>
      <button ref={confirmButton} className="button secondary" disabled={disabled}>{busy ? "Saving…" : state.archived ? "Confirm restore tournament" : "Confirm archive tournament"}</button>
      <button className="button secondary" type="button" disabled={busy} onClick={()=>setConfirming(false)}>Cancel</button>
    </form> : <button className="button secondary" disabled={disabled} onClick={()=>setConfirming(true)}>{state.archived ? "Restore tournament" : "Archive tournament"}</button>}
    {message && <p role="status">{message}</p>}
  </section>;
}
