const API_BASE = "https://zippy-miracle-production-48f2.up.railway.app";
let chart = null;

function cargarVentas() {
    const inicio = document.getElementById("fechaInicio").value;
    const fin = document.getElementById("fechaFin").value;

    if (!inicio || !fin) {
        alert("Selecciona fecha inicio y fecha fin");
        return;
    }

    fetch(`${API_BASE}/producto/productos-mayor-rotacion?fecha_inicio=${inicio}&fecha_fin=${fin}`)
        .then(res => res.json())
        .then(result => {
            if (!result.success || result.data.length === 0) {
                alert("No hay datos para este rango");
                return;
            }

            cargarTabla(result.data);
            cargarGrafica(result.data);
        })
        .catch(err => console.error("Error auditoría:", err));
}

function cargarTabla(data) {
    const tbody = document.getElementById("tablaVentas");
    tbody.innerHTML = "";

    data.forEach(p => {
        const tr = document.createElement("tr");
        tr.innerHTML = `
            <td>${p.nombre}</td>
            <td>${p.total_vendido}</td>
        `;
        tbody.appendChild(tr);
    });
}

function cargarGrafica(data) {
    const ctx = document.getElementById("graficaVentas").getContext("2d");

    const labels = data.map(p => p.nombre);
    const valores = data.map(p => p.total_vendido);

    if (chart) chart.destroy(); // evita duplicados

    chart = new Chart(ctx, {
        type: "bar",
        data: {
            labels,
            datasets: [{
                label: "Unidades vendidas",
                data: valores
            }]
        },
        options: {
            responsive: true,
            plugins: {
                legend: { display: false }
            }
        }
    });
}

//validacion empleado
const empleadoId = localStorage.getItem("empleadoId");
const empleadoNombre = localStorage.getItem("empleadoNombre");

if (!empleadoId) {
    window.location.href = "loginempleado.html";
}

//mostrar nombre
document.getElementById("user-name").textContent = empleadoNombre;


//Manejo menu hamburguesa
const sidebar = document.getElementById("sidebar");
document.getElementById("menu-toggle").addEventListener("click", () => {
    sidebar.classList.toggle("open");
});


// usuario-dopdow
const userDropdown = document.getElementById("user-dropdown");
document.getElementById("user-icon").addEventListener("click", () => {
    userDropdown.classList.toggle("show");
});


//logout
document.getElementById("logout-btn").addEventListener("click", () => {
    localStorage.removeItem("empleadoId");
    localStorage.removeItem("empleadoNombre");
    localStorage.removeItem("empleadoRol");
    window.location.href = "loginempleado.html";
});

// notificaiones-Drpdown
const notifIcon = document.getElementById("notif-icon");
const notifDropdown = document.getElementById("notif-dropdown");

notifIcon.addEventListener("click", () => {
    notifDropdown.classList.toggle("show");
});

//Cargar notificaciones
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


//Navegacion entres paginas del sidebar

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


