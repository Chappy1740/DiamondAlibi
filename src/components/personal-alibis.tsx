import { alibiAction, loadPersonalAlibis } from "@/app/more/alibi/actions";
import { AlibiEditor } from "./alibi-editor";
export async function PersonalAlibis({ connected }: { connected: boolean }) {
  if (!connected) return <AlibiEditor initial={{ status: "auth-required" }} />;
  return <AlibiEditor initial={await loadPersonalAlibis()} saveAction={alibiAction} reloadAction={loadPersonalAlibis} />;
}
