const API_BASE = "https://zippy-miracle-production-48f2.up.railway.app";

async function cargarEmpleados() {
    const select = document.getElementById("id_usuario");
    if (!select) return;

    try {
        const res = await fetch(`${API_BASE}/user/empleados`);

        if (!res.ok) {
            throw new Error("Error HTTP " + res.status);
        }

        const empleados = await res.json();
        console.log("Empleados:", empleados);

        select.innerHTML = '<option value="">-- Seleccionar empleado --</option>';

        empleados.forEach(emp => {
            const option = document.createElement("option");
            option.value = emp.id_usuario;
            option.textContent = emp.nombre;
            select.appendChild(option);
        });

    } catch (error) {
        console.error("Error cargando empleados:", error);
        select.innerHTML = '<option>Error al cargar</option>';
    }
}

document.addEventListener("DOMContentLoaded", cargarEmpleados);


async function buscarVentas() {
    const fecha = document.getElementById("fecha").value;
    const idUser = document.getElementById("id_usuario").value;

    if (!fecha || !idUser) {
        alert("Selecciona fecha y empleado");
        return;
    }

    try {
        console.log("🔍 Buscando ventas:", { fecha, idUser });

        const [fisicas, online, existe] = await Promise.all([
            fetch(`${API_BASE}/cuadre-caja/ventas-diarias?fecha=${fecha}&id_usuario=${idUser}`).then(r => r.json()),
            fetch(`${API_BASE}/cuadre-caja/cuadre-online?fecha=${fecha}`).then(r => r.json()),
            fetch(`${API_BASE}/cuadre-caja/existe?fecha=${fecha}&id_usuario=${idUser}`).then(r => r.json())
        ]);

        console.log("📦 Ventas físicas:", fisicas);
        console.log("🌐 Ventas online:", online);
        console.log("🔒 Cuadre existe:", existe);

        renderTablas(fisicas.ventas || [], online.ventas || []);
        actualizarResumen(fisicas.total_sistema || 0, online.total_online || 0);

        controlarBotonCuadre(existe.existe);

    } catch (error) {
        console.error("❌ Error consultando ventas:", error);
        alert("Error al consultar ventas");
    }
}

function renderTablas(fisicas, online) {
    const fBody = document.getElementById("tabla-fisicas");
    const oBody = document.getElementById("tabla-online");

    fBody.innerHTML = fisicas.length
        ? fisicas.map(v => `
            <tr>
                <td>${formatearHora(v.fecha)}</td>
                <td>${v.numero_factura}</td>
                <td>$${Number(v.total).toLocaleString()}</td>
            </tr>
        `).join("")
        : `<tr><td colspan="3">Sin ventas</td></tr>`;

    oBody.innerHTML = online.length
        ? online.map(v => `
            <tr>
                <td>${formatearHora(v.fecha)}</td>
                <td>${v.numero_factura}</td>
                <td>$${Number(v.total).toLocaleString()}</td>
            </tr>
        `).join("")
        : `<tr><td colspan="3">Sin ventas</td></tr>`;
}

function formatearHora(fechaISO) {
    return fechaISO?.split("T")[1]?.substring(0, 5) || "--:--";
}

function actualizarResumen(fisico, online) {
    TOTAL_SISTEMA = fisico + online;

    document.getElementById("total-fisico").innerText = `$${fisico.toLocaleString()}`;
    document.getElementById("total-online").innerText = `$${online.toLocaleString()}`;
    document.getElementById("total-sistema").innerText = `$${TOTAL_SISTEMA.toLocaleString()}`;
    document.getElementById("input-total").value = TOTAL_SISTEMA;
}

function controlarBotonCuadre(existe) {
    const btn = document.getElementById("btn-guardar");

    if (existe) {
        btn.disabled = true;
        btn.innerHTML = `<i class="fas fa-lock"></i> Cuadre ya registrado`;
    } else {
        btn.disabled = false;
        btn.innerHTML = `<i class="fas fa-save"></i> Registrar Cuadre`;
    }
}

function calcularCuadre() {
    const caja = Number(document.getElementById("input-caja").value || 0);
    const diff = caja - TOTAL_SISTEMA;
    const r = document.getElementById("resultado");

    if (diff === 0) {
        r.className = "resultado-badge ok";
        r.innerText = "Caja cuadrada";
    } else if (diff > 0) {
        r.className = "resultado-badge warn";
        r.innerText = `Sobrante $${diff.toLocaleString()}`;
    } else {
        r.className = "resultado-badge error";
        r.innerText = `Faltante $${Math.abs(diff).toLocaleString()}`;
    }
}


async function guardarCuadre() {
    const payload = {
        fecha: document.getElementById("fecha").value,
        id_usuario: Number(document.getElementById("id_usuario").value),
        total_sistema: TOTAL_SISTEMA,
        dinero_caja: Number(document.getElementById("input-caja").value),
        observacion: document.getElementById("observacion").value
    };

    try {
        console.log("💾 Guardando cuadre:", payload);

        const res = await fetch(`${API_BASE}/cuadre-caja/`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload)
        });

        const data = await res.json();
        alert(data.message);

        if (data.success) location.reload();

    } catch (error) {
        console.error("❌ Error guardando cuadre:", error);
        alert("No se pudo guardar el cuadre");
    }
}
