import { useState } from "react";

export default function Buildings() {
  const [buildingName, setBuildingName] = useState("");

  return (
    <div>
      <h2>Buildings</h2>
      <p>Formulario demo (aquí luego conectamos a tu API).</p>

      <label style={{ display: "block", marginTop: 10 }}>
        Building name
        <input
          value={buildingName}
          onChange={(e) => setBuildingName(e.target.value)}
          style={{ width: 360, padding: 10, marginTop: 6, borderRadius: 8, border: "1px solid #ccc" }}
        />
      </label>

      <button style={{ marginTop: 12, padding: 10, borderRadius: 8 }}>Guardar</button>
    </div>
  );
}
