const API_BASE = "https://zippy-miracle-production-48f2.up.railway.app";
const empleadoId = localStorage.getItem("empleadoId");
const empleadoNombre = localStorage.getItem("empleadoNombre");

let totalFisico = 0;
let totalOnline = 0;

// Redirigir si no hay sesión
if (!empleadoId) window.location.href = "loginempleado.html";
document.getElementById("user-name").textContent = empleadoNombre;

async function buscarVentas() {
    const fecha = document.getElementById("fecha").value;
    if (!fecha) return alert("Seleccione una fecha");

    await cargarFisicas(fecha);
    await cargarOnline(fecha);

    const totalSistema = totalFisico + totalOnline;
    document.getElementById("total-fisico").innerText = `$${totalFisico.toLocaleString()}`;
    document.getElementById("total-online").innerText = `$${totalOnline.toLocaleString()}`;
    document.getElementById("total-sistema").innerText = `$${totalSistema.toLocaleString()}`;
    document.getElementById("input-total").value = totalSistema;

    verificarCuadreExistente(fecha);
}

async function cargarFisicas(fecha) {
    const res = await fetch(`${API_BASE}/cuadre-caja/ventas-diarias?fecha=${fecha}&id_usuario=${empleadoId}`);
    const data = await res.json();
    totalFisico = data.total_sistema || 0;
    const tbody = document.getElementById("tabla-fisicas");
    tbody.innerHTML = data.ventas.map(v => `
        <tr>
            <td>${new Date(v.fecha).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</td>
            <td>${v.numero_factura}</td>
            <td>${empleadoNombre}</td>
            <td>$${v.total.toLocaleString()}</td>
        </tr>`).join('');
}

async function cargarOnline(fecha) {
    const res = await fetch(`${API_BASE}/cuadre-caja/cuadre-online?fecha=${fecha}`);
    const data = await res.json();
    totalOnline = data.total_online || 0;
    const tbody = document.getElementById("tabla-online");
    tbody.innerHTML = data.ventas.map(v => `
        <tr>
            <td>${new Date(v.fecha).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</td>
            <td>${v.numero_factura}</td>
            <td>Online</td>
            <td>$${v.total.toLocaleString()}</td>
        </tr>`).join('');
}

async function verificarCuadreExistente(fecha) {
    const res = await fetch(`${API_BASE}/cuadre-caja/existe?fecha=${fecha}&id_usuario=${empleadoId}`);
    const data = await res.json();
    document.getElementById("cuadre-box").style.display = data.existe ? "none" : "block";
    if(data.existe) alert("Ya existe un cuadre registrado para esta fecha.");
}

function calcularCuadre() {
    const total = Number(document.getElementById("input-total").value);
    const caja = Number(document.getElementById("input-caja").value);
    const diff = caja - total;
    const r = document.getElementById("resultado");

    r.className = "resultado " + (diff === 0 ? "ok" : diff > 0 ? "sobrante" : "faltante");
    r.textContent = diff === 0 ? "✅ Caja cuadrada" : 
                    diff > 0 ? `⚠️ Sobrante $${diff.toLocaleString()}` : 
                    `❌ Faltante $${Math.abs(diff).toLocaleString()}`;
}

async function guardarCuadre() {
    const payload = {
        fecha: document.getElementById("fecha").value,
        id_usuario: parseInt(empleadoId),
        total_sistema: Number(document.getElementById("input-total").value),
        dinero_caja: Number(document.getElementById("input-caja").value),
        observacion: document.getElementById("observacion").value
    };

    const res = await fetch(`${API_BASE}/cuadre-caja/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
    });
    const data = await res.json();
    alert(data.message);
    if(data.success) location.reload();
}

// Event Listeners para UI (Sidebar, Logout, etc.)
document.getElementById("menu-toggle").addEventListener("click", () => document.getElementById("sidebar").classList.toggle("open"));
document.getElementById("logout-btn").addEventListener("click", () => {
    localStorage.clear();
    window.location.href = "loginempleado.html";
});