import { useRef, useState } from "react";

function localDate() {
  const today = new Date();
  return [today.getFullYear(), String(today.getMonth() + 1).padStart(2, "0"), String(today.getDate()).padStart(2, "0")].join("-");
}

export function DayForm({ initial, disabled, onSave, onCancel }) {
  const [form, setForm] = useState(() => ({
    fecha: initial?.fecha || localDate(),
    operacion: initial?.operacion || "Starken",
    hub: initial?.hub || "Las Condes",
    movil: initial?.movil || "",
    chofer: initial?.chofer || "",
    ofEsperadas: initial?.ofEsperadas || "",
  }));
  const update = (field, value) => setForm((current) => ({ ...current, [field]: value }));

  return (
    <form onSubmit={(event) => {
      event.preventDefault();
      onSave({ ...form, ofEsperadas: Number(form.ofEsperadas) });
    }}>
      <fieldset disabled={disabled}>
        <legend>{initial ? "Editar jornada" : "Nueva jornada de despacho"}</legend>
        <div className="sd-form-grid">
          <label>Operación<input value={form.operacion} readOnly /></label>
          <label>Hub<input value={form.hub} readOnly /></label>
          <label>Fecha<input type="date" required value={form.fecha} onChange={(event) => update("fecha", event.target.value)} /></label>
          <label>Móvil<input required maxLength={40} placeholder="Ej. TYXS13" value={form.movil} onChange={(event) => update("movil", event.target.value)} /></label>
          <label>Chofer<input required maxLength={120} placeholder="Nombre del chofer" value={form.chofer} onChange={(event) => update("chofer", event.target.value)} /></label>
          <label>OF esperadas<input type="number" min="1" max="1000" step="1" required value={form.ofEsperadas} onChange={(event) => update("ofEsperadas", event.target.value)} /></label>
        </div>
        <p className="sd-help">La cantidad esperada corresponde a órdenes de flete (OF). Una OF puede contener varios bultos.</p>
        <div className="sd-actions">
          <button type="submit" className="sd-primary">{disabled ? "Guardando…" : initial ? "Guardar jornada" : "Crear jornada"}</button>
          <button type="button" onClick={onCancel}>Cancelar</button>
        </div>
      </fieldset>
    </form>
  );
}

export function OrderForm({ initial, disabled, onSave, onCancel }) {
  const [form, setForm] = useState(() => ({
    of: initial?.of || "",
    codigoBarras: initial?.codigoBarras || "",
    direccion: initial?.direccion || "",
    comuna: initial?.comuna || "",
    bultos: initial?.bultos || 1,
    estadoDireccion: initial?.estadoDireccion || "por_revisar",
    parada: initial?.parada ?? "",
  }));
  function update(field, value) {
    setForm((current) => ({
      ...current,
      [field]: value,
      ...(["direccion", "comuna"].includes(field) ? { estadoDireccion: "por_revisar" } : {}),
    }));
  }
  const canValidate = Boolean(form.direccion.trim() && form.comuna.trim());
  const identifiersLocked = Boolean(initial?.bultosEscaneados.length);

  return (
    <form onSubmit={(event) => {
      event.preventDefault();
      onSave({ ...form, bultos: Number(form.bultos), parada: form.parada === "" ? null : Number(form.parada) });
    }}>
      <fieldset disabled={disabled}>
        <legend>{initial ? `Editar OF ${initial.of}` : "Registrar OF"}</legend>
        <div className="sd-form-grid">
          <label>OF<input required readOnly={identifiersLocked} maxLength={128} autoComplete="off" placeholder="Ej. 279128020" value={form.of} onChange={(event) => update("of", event.target.value)} /></label>
          <label>Código de barras <span className="sd-optional">(opcional)</span><input readOnly={identifiersLocked} maxLength={128} autoComplete="off" value={form.codigoBarras} onChange={(event) => update("codigoBarras", event.target.value)} /></label>
          <label className="sd-wide">Dirección<input maxLength={300} placeholder="Calle, número, departamento y piso" value={form.direccion} onChange={(event) => update("direccion", event.target.value)} /></label>
          <label>Comuna<input maxLength={100} placeholder="Ej. Santiago" value={form.comuna} onChange={(event) => update("comuna", event.target.value)} /></label>
          <label>Bultos<input type="number" min="1" max="1000" step="1" required value={form.bultos} onChange={(event) => update("bultos", event.target.value)} /></label>
          <label>Estado de dirección<select value={form.estadoDireccion} onChange={(event) => update("estadoDireccion", event.target.value)}>
            <option value="por_revisar">Por revisar</option>
            <option value="ok" disabled={!canValidate}>OK · revisada manualmente</option>
          </select></label>
          <label>Parada manual <span className="sd-optional">(opcional)</span><input type="number" min="1" max="1000" step="1" placeholder="Sin asignar" value={form.parada} onChange={(event) => update("parada", event.target.value)} /></label>
        </div>
        <p className="sd-help">Puedes guardar una dirección incompleta para revisarla después. Al cambiar dirección o comuna, vuelve a «Por revisar»; marca OK solo después de comprobar ambas.</p>
        {identifiersLocked && <p className="sd-help">La OF y el código de barras quedan fijos después de confirmar el primer bulto.</p>}
        {initial && <p className="sd-help">Carga: {initial.bultosEscaneados.length} de {initial.bultos} bultos confirmados. No se puede reducir la cantidad por debajo de un número de bulto ya confirmado.</p>}
        <div className="sd-actions">
          <button type="submit" className="sd-primary">{disabled ? "Guardando…" : initial ? "Guardar OF" : "Agregar OF"}</button>
          {initial && <button type="button" onClick={onCancel}>Cancelar edición</button>}
        </div>
      </fieldset>
    </form>
  );
}

export function ScanForm({ disabled, onScan }) {
  const [codigo, setCodigo] = useState("");
  const [bulto, setBulto] = useState(1);
  const codeInput = useRef(null);

  async function submit(event) {
    event.preventDefault();
    if (await onScan({ codigo, bulto: Number(bulto) })) {
      setCodigo("");
      setBulto(1);
      requestAnimationFrame(() => codeInput.current?.focus());
    }
  }

  return (
    <form onSubmit={submit}>
      <fieldset disabled={disabled}>
        <legend>Confirmar carga</legend>
        <p className="sd-help">Ingresa una OF o su código de barras. También admite un lector que escriba el código como un teclado y envíe Enter.</p>
        <label>OF o código de barras<input ref={codeInput} required maxLength={128} autoComplete="off" value={codigo} onChange={(event) => setCodigo(event.target.value)} /></label>
        <label>Número de bulto<input type="number" min="1" max="1000" step="1" required value={bulto} onChange={(event) => setBulto(event.target.value)} /></label>
        <p className="sd-help">Confirma cada paquete por separado: para una OF con 3 bultos, registra los números 1, 2 y 3. Un número repetido cuenta como intento duplicado.</p>
        <button type="submit" className="sd-primary">{disabled ? "Confirmando…" : "Confirmar bulto"}</button>
      </fieldset>
    </form>
  );
}
