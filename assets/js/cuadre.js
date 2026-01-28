const API_BASE = "https://zippy-miracle-production-48f2.up.railway.app";
let TOTAL_SISTEMA = 0; 

async function cargarEmpleados() {
    const select = document.getElementById("id_usuario");
    if (!select) return;

    try {
        
        const res = await fetch(`${API_BASE}/empleados`);
        
        if (!res.ok) throw new Error("Error en el servidor");

        const empleados = await res.json();
        
        select.innerHTML = '<option value="">-- Seleccionar Empleado --</option>';

        empleados.forEach(emp => {
            const option = document.createElement("option");
            option.value = emp.id_usuario; 
            option.textContent = emp.nombre; 
            select.appendChild(option);
        });

        console.log("✅ Empleados cargados correctamente");

    } catch (error) {
        console.error("Fallo al cargar:", error);
        select.innerHTML = '<option value="">Error al conectar</option>';
    }
}

document.addEventListener("DOMContentLoaded", cargarEmpleados);

async function buscarVentas() {
    const fecha = document.getElementById("fecha").value;
    const idUser = document.getElementById("id_usuario").value;
    if (!fecha || !idUser) return alert("Selecciona fecha y empleado");

    try {
        
        const resF = await fetch(`${API_BASE}/cuadre-caja/ventas-diarias?fecha=${fecha}&id_usuario=${idUser}`);
        const dataF = await resF.json();

     
        const resO = await fetch(`${API_BASE}/cuadre-caja/cuadre-online?fecha=${fecha}`);
        const dataO = await resO.json();

        
        const resE = await fetch(`${API_BASE}/cuadre-caja/existe?fecha=${fecha}&id_usuario=${idUser}`);
        const dataE = await resE.json();

        renderTablas(dataF.ventas, dataO.ventas);
        actualizarResumen(dataF.total_sistema || 0, dataO.total_online || 0);

        const btn = document.getElementById("btn-guardar");
        if (dataE.existe) {
            btn.disabled = true;
            btn.innerHTML = '<i class="fas fa-lock"></i> Cuadre ya realizado';
            alert("Atención: Ya se registró un cierre para este día.");
        } else {
            btn.disabled = false;
            btn.innerHTML = '<i class="fas fa-save"></i> Registrar Cuadre';
        }
    } catch (e) {
        alert("Error de conexión con el servidor");
    }
}

function renderTablas(fisicas, online) {
    const fBody = document.getElementById("tabla-fisicas");
    const oBody = document.getElementById("tabla-online");
    
    fBody.innerHTML = fisicas.map(v => `<tr><td>${v.fecha.split('T')[1].substring(0,5)}</td><td>${v.numero_factura}</td><td>$${v.total.toLocaleString()}</td></tr>`).join('');
    oBody.innerHTML = online.map(v => `<tr><td>${v.fecha.split('T')[1].substring(0,5)}</td><td>${v.numero_factura}</td><td>$${v.total.toLocaleString()}</td></tr>`).join('');
}

function actualizarResumen(fisico, online) {
    TOTAL_SISTEMA = fisico + online;
    document.getElementById("total-fisico").innerText = `$${fisico.toLocaleString()}`;
    document.getElementById("total-online").innerText = `$${online.toLocaleString()}`;
    document.getElementById("total-sistema").innerText = `$${TOTAL_SISTEMA.toLocaleString()}`;
    document.getElementById("input-total").value = TOTAL_SISTEMA;
}

function calcularCuadre() {
    const caja = Number(document.getElementById("input-caja").value);
    const diff = caja - TOTAL_SISTEMA;
    const resDiv = document.getElementById("resultado");

    if (diff === 0) {
        resDiv.className = "resultado-badge ok";
        resDiv.innerText = "Caja Cuadrada Perfectamente";
    } else if (diff > 0) {
        resDiv.className = "resultado-badge warn";
        resDiv.innerText = `Sobrante de $${diff.toLocaleString()}`;
    } else {
        resDiv.className = "resultado-badge error";
        resDiv.innerText = `Faltante de $${Math.abs(diff).toLocaleString()}`;
    }
}

async function guardarCuadre() {
    const payload = {
        fecha: document.getElementById("fecha").value,
        id_usuario: parseInt(document.getElementById("id_usuario").value),
        total_sistema: TOTAL_SISTEMA,
        dinero_caja: Number(document.getElementById("input-caja").value),
        observacion: document.getElementById("observacion").value
    };

    const res = await fetch(`${API_BASE}/cuadre-caja/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
    });
    const resData = await res.json();
    alert(resData.message);
    if(resData.success) location.reload();
}