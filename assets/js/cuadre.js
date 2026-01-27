const API_BASE = "https://zippy-miracle-production-48f2.up.railway.app";
const ID_USUARIO = 1;

let totalFisico = 0;
let totalOnline = 0;

/* ================= BUSCAR ================= */
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

/* ================= FISICAS ================= */
async function cargarFisicas(fecha) {
  const res = await fetch(`${API}/cuadre-caja/ventas-diarias?fecha=${fecha}&id_usuario=${ID_USUARIO}`);
  const data = await res.json();

  totalFisico = data.total_sistema || 0;
  const tbody = document.getElementById("tabla-fisicas");
  tbody.innerHTML = "";

  data.ventas.forEach(v => {
    tbody.innerHTML += `
      <tr>
        <td>${new Date(v.fecha).toLocaleTimeString()}</td>
        <td>${v.numero_factura}</td>
        <td>${v.nombre_usuario}</td>
        <td>$${v.total.toLocaleString()}</td>
      </tr>
    `;
  });
}

/* ================= ONLINE ================= */
async function cargarOnline(fecha) {
  const res = await fetch(`${API_BASE}/cuadre-caja/cuadre-online?fecha=${fecha}`);
  const data = await res.json();

  totalOnline = data.total_online || 0;
  const tbody = document.getElementById("tabla-online");
  tbody.innerHTML = "";

  data.ventas.forEach(v => {
    tbody.innerHTML += `
      <tr>
        <td>${new Date(v.fecha).toLocaleTimeString()}</td>
        <td>${v.numero_factura}</td>
        <td>${v.nombre_usuario}</td>
        <td>$${v.total.toLocaleString()}</td>
      </tr>
    `;
  });
}

/* ================= VERIFICAR CUADRE ================= */
async function verificarCuadreExistente(fecha) {
  const res = await fetch(`${API_BASE}/cuadre-caja/existe?fecha=${fecha}&id_usuario=${ID_USUARIO}`);
  const data = await res.json();

  document.getElementById("cuadre-box").style.display =
    data.existe ? "none" : "block";
}

/* ================= CALCULAR ================= */
function calcularCuadre() {
  const total = Number(input-total.value);
  const caja = Number(input-caja.value);
  const diff = caja - total;

  const r = document.getElementById("resultado");

  if (diff === 0) {
    r.textContent = "✅ Caja cuadrada";
    r.className = "resultado ok";
  } else if (diff > 0) {
    r.textContent = `⚠️ Sobrante $${diff.toLocaleString()}`;
    r.className = "resultado sobrante";
  } else {
    r.textContent = `❌ Faltante $${Math.abs(diff).toLocaleString()}`;
    r.className = "resultado faltante";
  }
}

/* ================= GUARDAR ================= */
async function guardarCuadre() {
  const payload = {
    fecha: fecha.value,
    id_usuario: ID_USUARIO,
    total_sistema: Number(input-total.value),
    dinero_caja: Number(input-caja.value),
    observacion: observacion.value
  };

  const res = await fetch(`${API_BASE}/cuadre-caja/`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload)
  });

  const data = await res.json();
  alert(data.message);
}

//Validacion de usuario
const empleadoId = localStorage.getItem("empleadoId");
const empleadoNombre = localStorage.getItem("empleadoNombre");

if (!empleadoId) {
    window.location.href = "loginempleado.html";
}

//Mostrar nombre usuario
document.getElementById("user-name").textContent = empleadoNombre;


//Menu Hamburguesa
const sidebar = document.getElementById("sidebar");
document.getElementById("menu-toggle").addEventListener("click", () => {
    sidebar.classList.toggle("open");
});


//Usuario-Dropdown
const userDropdown = document.getElementById("user-dropdown");
document.getElementById("user-icon").addEventListener("click", () => {
    userDropdown.classList.toggle("show");
});


// logout
document.getElementById("logout-btn").addEventListener("click", () => {
    localStorage.removeItem("empleadoId");
    localStorage.removeItem("empleadoNombre");
    localStorage.removeItem("empleadoRol");
    window.location.href = "loginempleado.html";
});

//Notificaciones-Dropdown
const notifIcon = document.getElementById("notif-icon");
const notifDropdown = document.getElementById("notif-dropdown");

notifIcon.addEventListener("click", () => {
    notifDropdown.classList.toggle("show");
});

//Cargar notificiaciones
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


//Navegacion entre paginas del sidebar

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