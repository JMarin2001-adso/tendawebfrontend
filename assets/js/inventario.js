const API_BASE = "https://zippy-miracle-production-48f2.up.railway.app";

// elementos 
const modalEntrada = document.getElementById("modal");
const modalSalida = document.getElementById("modalSalida");
const formEntrada = document.getElementById("formProducto");
const formSalida = document.getElementById("formSalida");
const tabla = document.getElementById("bodyTabla");
const buscador = document.getElementById("buscarProducto");

let inventario = [];
let productoSalidaSeleccionado = null;


//Modales
function openFormEntrada(producto = null) {
    modalEntrada.style.display = "block";

    if (producto) {
        // Entrada a producto existente
        document.getElementById("id_producto").value = producto.id_producto;
        document.getElementById("producto").value = producto.nombre;
        document.getElementById("precio").value = producto.precio_adquirido || "";
    } else {
        // Nuevo producto
        formEntrada.reset();
        document.getElementById("id_producto").value = 0;
    }
}

function openForm() {
    openFormEntrada(null);
}

function closeFormEntrada() {
    modalEntrada.style.display = "none";
}

function openSalida(producto) {
    productoSalidaSeleccionado = producto;
    modalSalida.style.display = "block";
}

function closeSalida() {
    modalSalida.style.display = "none";
    productoSalidaSeleccionado = null;
}



//Inventario 
async function cargarInventarioBackend() {
    try {
        const res = await fetch(`${API_BASE}/producto/inventario`);
        const data = await res.json();

        if (res.ok && data.success) {
            inventario = data.data;
            actualizarTabla();
            actualizarResumen();
        } else {
            console.error("Error cargando inventario:", data.message);
        }
    } catch (err) {
        console.error("Error conectando al backend:", err);
    }
}


//Tabla de inventario
function actualizarTabla(lista = inventario) {
    tabla.innerHTML = "";

    lista.forEach((p) => {
        const fila = `
            <tr>
                <td>${p.nombre}</td>
                <td>$${(p.precio_adquirido || 0).toFixed(2)}</td>
                <td>${p.stock_actual}</td>
                <td>${p.fecha_ingreso ?? "N/A"}</td>
                <td>${p.proveedor ?? "N/A"}</td>
                <td>
                    <button onclick='openFormEntrada(${JSON.stringify(p)})' class="btn-editar">➕ Entrada</button>
                    <button onclick='openSalida(${JSON.stringify(p)})' class="btn-salida">➖ Salida</button>
                </td>
            </tr>
        `;
        tabla.innerHTML += fila;
    });
}


//resumen de inventario, recuadros
function actualizarResumen() {
    const totalProductos = inventario.length;
    const stockDisponible = inventario.reduce((acc, p) => acc + p.stock_actual, 0);

    document.getElementById("totalProductos").textContent = totalProductos;
    document.getElementById("totalSalidas").textContent = 0;
    document.getElementById("stockDisponible").textContent = stockDisponible;
}


//Buscador de productos
buscador.addEventListener("input", () => {
    const texto = buscador.value.toLowerCase();

    const filtrados = inventario.filter(p =>
        p.nombre.toLowerCase().includes(texto) ||
        (p.proveedor ?? "").toLowerCase().includes(texto)
    );

    actualizarTabla(filtrados);
});


// AGREGAR ENTRADA DE PRODUCTO


formEntrada.addEventListener("submit", async (e) => {
    e.preventDefault();

    
    const idProducto = parseInt(document.getElementById("id_producto").value);

    if (!idProducto || isNaN(idProducto)) {
        alert("❌ El ID del producto es obligatorio");
        return;
    }

    const body = {
        id_producto: idProducto,
        nombre_producto: document.getElementById("producto").value.trim(),
        precio_adquirido: parseFloat(document.getElementById("precio").value),
        cantidad: parseInt(document.getElementById("cantidad").value),
        fecha_ingreso: document.getElementById("fecha").value,
        id_proveedor: parseInt(document.getElementById("proveedor").value),
        observacion: document.getElementById("observaciones").value.trim()
    };

    console.log("📦 Enviando entrada de producto:", body);

    
    if (body.cantidad <= 0) {
        alert("❌ La cantidad debe ser mayor a 0");
        return;
    }

    if (isNaN(body.precio_adquirido)) {
        alert("❌ Precio inválido");
        return;
    }


    try {
        const res = await fetch(`${API_BASE}/producto/producto/entrada`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify(body)
        });

        const data = await res.json();
        console.log("📥 Respuesta backend:", data);

        // ==========================
        // 4️⃣ RESPUESTA
        // ==========================
        if (res.ok && data.success) {
            alert("✅ Entrada de stock registrada correctamente");

            // Recargar inventario
            if (typeof cargarInventarioBackend === "function") {
                await cargarInventarioBackend();
            }

            formEntrada.reset();

            
            if (typeof closeFormEntrada === "function") {
                closeFormEntrada();
            }

        } else {
            alert("❌ " + (data.message || "Error al registrar la entrada"));
        }

    } catch (error) {
        console.error("❌ Error de conexión:", error);
        alert("❌ No se pudo conectar con el servidor");
    }
});


//Registrar salida de productos
formSalida.addEventListener("submit", async (e) => {
    e.preventDefault();

    const cantidad = parseInt(document.getElementById("salidaCantidad").value);
    const observacion = document.getElementById("salidaObs").value.trim();

    if (!productoSalidaSeleccionado) {
        alert("Error al seleccionar producto");
        return;
    }

    const body = {
        id_producto: productoSalidaSeleccionado.id_producto,
        nombre_producto: productoSalidaSeleccionado.nombre,
        cantidad,
        fecha_salida: new Date().toISOString().split("T")[0],
        observacion,
        id_usuario: 1
    };

    try {
        const res = await fetch(`${API_BASE}/producto/salida`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(body)
        });

        const data = await res.json();

        if (res.ok && data.success) {
            alert("Salida registrada");
            await cargarInventarioBackend();
            formSalida.reset();
            closeSalida();
        } else {
            alert("Error: " + data.message);
        }

    } catch (error) {
        alert("No se pudo conectar con el backend");
    }
});



//inicio
window.onload = cargarInventarioBackend;

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


