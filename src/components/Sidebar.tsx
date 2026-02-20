export default function Sidebar({
  email,
  active,
  onSelect,
  onLogout,
}: {
  email: string;
  active: "buildings" | "documents";
  onSelect: (k: "buildings" | "documents") => void;
  onLogout: () => void;
}) {
  return (
    <div style={{ padding: 16, borderRight: "1px solid #eee", height: "100vh" }}>
      <div style={{ marginBottom: 16 }}>
        <div style={{ fontSize: 12, color: "#666" }}>Bienvenida/o</div>
        <div style={{ fontWeight: 600 }}>{email}</div>
      </div>

      <div style={{ display: "grid", gap: 8 }}>
        <button onClick={() => onSelect("buildings")} style={{ padding: 10, borderRadius: 8 }}>
          Buildings {active === "buildings" ? "✅" : ""}
        </button>
        <button onClick={() => onSelect("documents")} style={{ padding: 10, borderRadius: 8 }}>
          Documents {active === "documents" ? "✅" : ""}
        </button>
      </div>

      <div style={{ position: "absolute", bottom: 16 }}>
        <button onClick={onLogout} style={{ padding: 10, borderRadius: 8 }}>
          Cerrar sesión
        </button>
      </div>
    </div>
  );
}
