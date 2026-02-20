import { useState } from "react";
import Sidebar from "../components/Sidebar";
import Buildings from "./Buildings";
import Documents from "./Documents";

export default function Portal({
  email,
  onLogout,
}: {
  email: string;
  onLogout: () => void;
}) {
  const [active, setActive] = useState<"buildings" | "documents">("buildings");

  return (
    <div style={{ display: "grid", gridTemplateColumns: "250px 1fr" }}>
      <Sidebar email={email} active={active} onSelect={setActive} onLogout={onLogout} />
      <div style={{ padding: 20 }}>
        {active === "buildings" ? <Buildings /> : <Documents />}
      </div>
    </div>
  );
}