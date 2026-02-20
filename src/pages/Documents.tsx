import { useState } from "react";

export default function Documents() {
  const [title, setTitle] = useState("");

  return (
    <div>
      <h2>Documents</h2>
      <p>Formulario demo (luego conectamos a tu API y/o storage).</p>

      <label style={{ display: "block", marginTop: 10 }}>
        Document title
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          style={{ width: 360, padding: 10, marginTop: 6, borderRadius: 8, border: "1px solid #ccc" }}
        />
      </label>

      <button style={{ marginTop: 12, padding: 10, borderRadius: 8 }}>Guardar</button>
    </div>
  );
}
