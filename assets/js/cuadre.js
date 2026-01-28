const API_BASE = "https://zippy-miracle-production-48f2.up.railway.app";
let TOTAL_SISTEMA = 0;

/* =========================
   CARGAR EMPLEADOS
========================= */
async function cargarEmpleados() {
    const select = document.getElementById("id_usuario");
    if (!select) return;

    try {
        const res = await fetch(`${API_BASE}/user/empleados`, {
            method: "GET",
            credentials: "omit"
        });

        if (!res.ok) throw new Error(`HTTP ${res.status}`);

        const empleados = await res.json();

        select.innerHTML = '<option value="">-- Seleccionar Empleado --</option>';

        empleados.forEach(emp => {
            const option = document.createElement("option");
            option.value = emp.id_usuario;
            option.textContent = emp.nombre;
            select.appendChild(option);
        });

        console.log("✅ Empleados cargados:", empleados);

    } catch (error) {
        console.error("❌ Error cargando empleados:", error);
        select.innerHTML = '<option value="">Error al cargar empleados</option>';
    }
}

document.addEventListener("DOMContentLoaded", cargarEmpleados);

/* =========================
   BUSCAR VENTAS
========================= */
async function buscarVentas() {
    const fecha = document.getElementById("fecha").value;
    const idUsuario = document.getElementById("id_usuario").value;

    if (!fecha || !idUsuario) {
        alert("Selecciona una fecha y un empleado");
        return;
    }

    try {
        // 🔹 Ventas físicas
        const resFisica = await fetch(
            `${API_BASE}/cuadre-caja/ventas-diarias?fecha=${fecha}&id_usuario=${idUsuario}`
        );
        const dataFisica = await resFisica.json();

        // 🔹 Ventas online
        const resOnline = await fetch(
            `${API_BASE}/cuadre-caja/cuadre-online?fecha=${fecha}`
        );
        const dataOnline = await resOnline.json();

        // 🔹 Verificar si ya existe cuadre
        const resExiste = await fetch(
            `${API_BASE}/cuadre-caja/existe?fecha=${fecha}&id_usuario=${idUsuario}`
        );
        const dataExiste = await resExiste.json();

        console.log("📦 Data física:", dataFisica);
        console.log("🌐 Data online:", dataOnline);

        // 🔹 Soportar objeto o array
        const ventasFisicas = dataFisica.ventas ?? dataFisica ?? [];
        const ventasOnline = dataOnline.ventas ?? dataOnline ?? [];

        // 🔹 Calcular totales seguros
        const totalFisico = dataFisica.total_sistema ??
            ventasFisicas.reduce((acc, v) => acc + Number(v.total || 0), 0);

        const totalOnline = dataOnline.total_online ??
            ventasOnline.reduce((acc, v) => acc + Number(v.total || 0), 0);

        renderTablas(ventasFisicas, ventasOnline);
        actualizarResumen(totalFisico, totalOnline);

        // 🔹 Bloquear botón si ya existe cuadre
        const btn = document.getElementById("btn-guardar");

        if (dataExiste.existe) {
            btn.disabled = true;
            btn.innerHTML = '<i class="fas fa-lock"></i> Cuadre ya registrado';
            alert("⚠️ Ya existe un cuadre para este día y empleado.");
        } else {
            btn.disabled = false;
            btn.innerHTML = '<i class="fas fa-save"></i> Registrar Cuadre';
        }

    } catch (error) {
        console.error("❌ Error buscando ventas:", error);
        alert("Error al consultar ventas");
    }
}

/* =========================
   RENDER TABLAS
========================= */
function renderTablas(fisicas, online) {
    const fBody = document.getElementById("tabla-fisicas");
    const oBody = document.getElementById("tabla-online");

    fBody.innerHTML = "";
    oBody.innerHTML = "";

    if (!fisicas.length) {
        fBody.innerHTML = `<tr><td colspan="3">Sin ventas físicas</td></tr>`;
    } else {
        fBody.innerHTML = fisicas.map(v => `
            <tr>
                <td>${formatearHora(v.fecha)}</td>
                <td>${v.numero_factura}</td>
                <td>$${Number(v.total).toLocaleString()}</td>
            </tr>
        `).join("");
    }

    if (!online.length) {
        oBody.innerHTML = `<tr><td colspan="3">Sin ventas online</td></tr>`;
    } else {
        oBody.innerHTML = online.map(v => `
            <tr>
                <td>${formatearHora(v.fecha)}</td>
                <td>${v.numero_factura}</td>
                <td>$${Number(v.total).toLocaleString()}</td>
            </tr>
        `).join("");
    }
}

/* =========================
   RESUMEN
========================= */
function actualizarResumen(fisico, online) {
    TOTAL_SISTEMA = fisico + online;

    document.getElementById("total-fisico").innerText = `$${fisico.toLocaleString()}`;
    document.getElementById("total-online").innerText = `$${online.toLocaleString()}`;
    document.getElementById("total-sistema").innerText = `$${TOTAL_SISTEMA.toLocaleString()}`;
    document.getElementById("input-total").value = TOTAL_SISTEMA;
}

/* =========================
   CALCULAR CUADRE
========================= */
function calcularCuadre() {
    const caja = Number(document.getElementById("input-caja").value);
    const resultado = document.getElementById("resultado");
    const diferencia = caja - TOTAL_SISTEMA;

    if (isNaN(caja)) {
        resultado.innerText = "Ingrese efectivo";
        return;
    }

    if (diferencia === 0) {
        resultado.className = "resultado-badge ok";
        resultado.innerText = "Caja cuadrada perfectamente";
    } else if (diferencia > 0) {
        resultado.className = "resultado-badge warn";
        resultado.innerText = `Sobrante de $${diferencia.toLocaleString()}`;
    } else {
        resultado.className = "resultado-badge error";
        resultado.innerText = `Faltante de $${Math.abs(diferencia).toLocaleString()}`;
    }
}

/* =========================
   GUARDAR CUADRE
========================= */
async function guardarCuadre() {
    const payload = {
        fecha: document.getElementById("fecha").value,
        id_usuario: Number(document.getElementById("id_usuario").value),
        total_sistema: TOTAL_SISTEMA,
        dinero_caja: Number(document.getElementById("input-caja").value),
        observacion: document.getElementById("observacion").value
    };

    try {
        const res = await fetch(`${API_BASE}/cuadre-caja/`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload)
        });

        const data = await res.json();
        alert(data.message || "Cuadre registrado");

        if (data.success) location.reload();

    } catch (error) {
        alert("Error guardando cuadre");
        console.error(error);
    }
}

/* =========================
   UTILIDAD
========================= */
function formatearHora(fecha) {
    if (!fecha) return "--:--";
    return fecha.split("T")[1]?.substring(0, 5) || "--:--";
}


//Validar sesion de empleado.
const empleadoId = localStorage.getItem("empleadoId");
const empleadoNombre = localStorage.getItem("empleadoNombre");

if (!empleadoId) {
    window.location.href = "loginempleado.html";
}

//Mostrar nombre en tobar
document.getElementById("user-name").textContent = empleadoNombre;


// Manejo menu hamburguesa
const sidebar = document.getElementById("sidebar");
document.getElementById("menu-toggle").addEventListener("click", () => {
    sidebar.classList.toggle("open");
});


// Usuario-Dropdwon
const userDropdown = document.getElementById("user-dropdown");
document.getElementById("user-icon").addEventListener("click", () => {
    userDropdown.classList.toggle("show");
});


// Logout
document.getElementById("logout-btn").addEventListener("click", () => {
    localStorage.removeItem("empleadoId");
    localStorage.removeItem("empleadoNombre");
    localStorage.removeItem("empleadoRol");
    window.location.href = "loginempleado.html";
});

//Notificacione-Dropdown
const notifIcon = document.getElementById("notif-icon");
const notifDropdown = document.getElementById("notif-dropdown");

notifIcon.addEventListener("click", () => {
    notifDropdown.classList.toggle("show");
});

//Cargar notificaciones de compra
async function cargarNotificaciones() {
    try {
        const res = await fetch(`${API_BASE}/pedido/pendientes`);
        const pedidos = await res.json();

        // Cantidad
        document.getElementById("notif-count").textContent = pedidos.length;

        // Lista
        const notifList = document.getElementById("notif-list");
        notifList.innerHTML = "";

        pedidos.forEach(p => {
            let li = document.createElement("li");
            li.textContent = `Pedido #${p.id_pedido} en revisión`;
            
            li.addEventListener("click", () => {
                window.location.href = `revision_pedido.html?id=${p.id_pedido}`;
            });
            
            notifList.appendChild(li);
        });


    } catch (error) {
        console.error("Error cargando notificaciones:", error);
    }
}

// Ejecutar al cargar el panel
cargarNotificaciones();

// Consultar cada 8 segundos
setInterval(cargarNotificaciones, 8000);


//Navegacion por paginas del Sidebar

document.querySelectorAll(".nav-item").forEach(item => {
    item.addEventListener("click", (e) => {
        e.preventDefault(); // evitar salto arriba

        const destino = item.getAttribute("data-page");

        if (destino) {
            window.location.href = destino;
        }
    });
});

// Mostrar / ocultar submenú de Transacciones
document.getElementById("btn-transacciones").addEventListener("click", () => {
    const submenu = document.getElementById("submenu-transacciones");
    submenu.style.display =
        submenu.style.display === "block" ? "none" : "block";
});

// Navegación de submenú
document.querySelectorAll(".nav-subitem").forEach(item => {
    item.addEventListener("click", () => {
        const page = item.getAttribute("data-page");
        window.location.href = page;
    });
});