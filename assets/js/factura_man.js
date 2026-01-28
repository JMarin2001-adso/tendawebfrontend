const API_BASE = "https://zippy-miracle-production-48f2.up.railway.app";


//variables
let clienteSeleccionado = null;
let productosFactura = [];
let productoActual = null;
let catalogoProductos = [];

// 2. Función de Búsqueda de Productos (Incluye Precio y Stock de Inventario)
async function filtrarProductos() {
    const busquedaInput = document.getElementById("buscarProducto");
    const listaUL = document.getElementById("listaProductos");

    if (!busquedaInput || !listaUL) return;

    const texto = busquedaInput.value.toLowerCase().trim();

    if (texto.length < 2) {
        listaUL.innerHTML = "";
        return;
    }

    try {
        // Carga el catálogo de Railway solo si está vacío
        if (catalogoProductos.length === 0) {
            const response = await fetch(`${API_BASE}/producto/`);
            if (!response.ok) throw new Error("Error al obtener productos");
            const result = await response.json();
            catalogoProductos = result.data || [];
        }

        listaUL.innerHTML = "";

        // Filtra por nombre
        const filtrados = catalogoProductos.filter(p => 
            p.nombre && p.nombre.toLowerCase().includes(texto)
        );

        if (filtrados.length === 0) {
            listaUL.innerHTML = "<li style='padding:10px; color:gray;'>No se encontró el producto</li>";
            return;
        }

        filtrados.forEach(p => {
            const li = document.createElement("li");
            const stock = p.stock_actual ?? 0;
            const precio = p.precio ?? 0;

            // Formato de moneda para el precio
            const precioFormateado = new Intl.NumberFormat('es-CO', {
                style: 'currency',
                currency: 'COP',
                minimumFractionDigits: 0
            }).format(precio);

            li.style = "padding:10px; border-bottom:1px solid #eee; cursor:pointer; list-style:none;";
            li.innerHTML = `
                <div style="display:flex; justify-content:space-between; align-items:center;">
                    <div style="display:flex; flex-direction:column;">
                        <span style="font-weight:bold; color:#333;">${p.nombre}</span>
                        <small style="color: #007bff; font-weight:bold;">${precioFormateado}</small>
                    </div>
                    <div style="text-align:right;">
                        <strong style="color: ${stock > 0 ? '#28a745' : '#dc3545'};">Stock: ${stock}</strong>
                    </div>
                </div>
            `;

            li.onclick = () => {
                seleccionarProducto(p);
                listaUL.innerHTML = "";
                busquedaInput.value = p.nombre;
            };

            listaUL.appendChild(li);
        });

    } catch (error) {
        // Esto imprimirá el error técnico real en la consola de desarrollador
        console.error("DETALLE TÉCNICO:", error);

        // Esto mostrará el mensaje específico del error en tu modal
        listaUL.innerHTML = `
            <li style='color:red; padding:10px; list-style:none;'>
                <b>Error de conexión:</b> ${error.message} <br>
                <small>Tipo: ${error.name}</small>
            </li>`;
    }
}

// 3. Función para seleccionar y mostrar detalle
function seleccionarProducto(p) {
    productoActual = p;
    
    const nombreElem = document.getElementById("prodNombre");
    const stockElem = document.getElementById("prodStock");
    const detalleDiv = document.getElementById("detalleProducto");

    // Si añadiste el span de precio en el HTML, se llenará aquí:
    const precioElem = document.getElementById("prodPrecio");

    if (nombreElem) nombreElem.innerText = p.nombre;
    if (stockElem) stockElem.innerText = p.stock_actual ?? 0;
    if (precioElem) {
        precioElem.innerText = new Intl.NumberFormat('es-CO').format(p.precio ?? 0);
    }
    
    if (detalleDiv) detalleDiv.style.display = "block";
}

// 4. Función para añadir a la tabla de la factura
function agregarProducto() {
    const cantidadInput = document.getElementById("cantidadProducto");
    const cantidad = parseInt(cantidadInput.value);

    if (!productoActual) {
        alert("Por favor seleccione un producto primero");
        return;
    }

    if (cantidad <= 0) {
        alert("La cantidad debe ser mayor a 0");
        return;
    }

    // Validación de Stock
    if (cantidad > (productoActual.stock_actual || 0)) {
        alert(`No hay suficiente stock. Disponible: ${productoActual.stock_actual}`);
        return;
    }

    // Añadir al arreglo de la factura
    productosFactura.push({
        id_producto: productoActual.id_producto,
        nombre: productoActual.nombre,
        cantidad: cantidad,
        precio_unitario: productoActual.precio // Tomado directamente de la tabla producto
    });

    actualizarTabla();
    
    // Resetear formulario del modal
    productoActual = null;
    cantidadInput.value = 1;
    document.getElementById("detalleProducto").style.display = "none";
    document.getElementById("buscarProducto").value = "";
    closeModal("productModal");
}

// 5. Actualizar la visualización de la tabla
function actualizarTabla() {
    const tbody = document.querySelector("#invoiceTable tbody");
    if (!tbody) return;
    
    tbody.innerHTML = "";
    let total = 0;

    productosFactura.forEach((p, index) => {
        const subtotal = p.cantidad * p.precio_unitario;
        total += subtotal;

        tbody.innerHTML += `
            <tr>
                <td>${p.nombre}</td>
                <td>${p.cantidad}</td>
                <td>$${new Intl.NumberFormat('es-CO').format(p.precio_unitario)}</td>
                <td>$${new Intl.NumberFormat('es-CO').format(subtotal)}</td>
                <td><button class="btn-danger" onclick="eliminarProducto(${index})">X</button></td>
            </tr>
        `;
    });

    const totalDoc = document.getElementById("totalInvoice");
    if (totalDoc) totalDoc.innerText = new Intl.NumberFormat('es-CO').format(total);
}

// --- FUNCIONES DE APOYO (Mantener igual) ---

function eliminarProducto(index) {
    productosFactura.splice(index, 1);
    actualizarTabla();
}

function openModal(id) {
    document.getElementById(id).style.display = "flex";
}

function closeModal(id) {
    document.getElementById(id).style.display = "none";
}

function openModal(id) {
    document.getElementById(id).style.display = "flex";
}

function closeModal(id) {
    document.getElementById(id).style.display = "none";
}

async function buscarCliente() {
    const documento = document.getElementById("documento").value.trim();
    const estado = document.getElementById("estadoCliente");

    if (!documento) {
        estado.innerText = "Ingrese un documento";
        return;
    }

    try {
        const response = await fetch(`${API_BASE}/factura/busqueda-documento/${documento}`);
        const res = await response.json();

        if (res && res.success && res.data) {
            clienteSeleccionado = Array.isArray(res.data) ? res.data[0] : res.data;

            // se llenan los input, para guardar datos
            document.getElementById("nombre").value = clienteSeleccionado.nombre || "";
            document.getElementById("correo").value = clienteSeleccionado.correo || "";
            document.getElementById("telefono").value = clienteSeleccionado.telefono || "";
            document.getElementById("direccion").value = clienteSeleccionado.direccion || "";

            estado.innerText = "Cliente encontrado ✔";
            mostrarClienteResumen();
        } else {
            estado.innerText = "Cliente no encontrado";
            mostrarFormulario();
        }
    } catch (error) {
        estado.innerText = "Error en la búsqueda";
    }
}

async function guardarCliente() {
    const estado = document.getElementById("estadoCliente");
    
    // objeto que captura los datos del formulario
    const nuevoCliente = {
        documento: document.getElementById("documento").value.trim(),
        nombre: document.getElementById("nombre").value.trim(),
        correo: document.getElementById("correo").value.trim(),
        telefono: document.getElementById("telefono").value.trim(),
        direccion: document.getElementById("direccion").value.trim()
    };

    try {
        const response = await fetch(`${API_BASE}/factura/cliente/manual`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(nuevoCliente)
        });

        const res = await response.json();

        if (response.ok && res.success) {
            clienteSeleccionado = res.data; 

            estado.innerText = "Cliente creado correctamente ✔";
            mostrarClienteResumen();
            closeModal("clientModal");
        } else {
            alert(res.message || "No se pudo crear el cliente");
        }
    } catch (error) {
        console.error("Error al guardar:", error);
        alert("Error de conexión al intentar guardar");
    }
}

function mostrarClienteResumen() {
    const box = document.getElementById("displayClient");
    const summary = document.getElementById("clientDataSummary");

    if (!clienteSeleccionado) return;

    box.style.display = "block";
    summary.innerHTML = `
        <p><b>${clienteSeleccionado.nombre || 'Sin nombre'}</b></p>
        <p>Doc: ${clienteSeleccionado.documento || 'N/A'}</p>
        <p>Email: ${clienteSeleccionado.correo || 'N/A'}</p>
        <p>Dir: ${clienteSeleccionado.direccion || 'N/A'}</p>
    `;
}


//generar factura manual
function generateInvoice() {
    if (!clienteSeleccionado) {
        alert("Debe seleccionar un cliente primero");
        return;
    }

    if (productosFactura.length === 0) {
        alert("Debe agregar al menos un producto");
        return;
    }

    // datos del clinete aparecen en resumen de factura
    const datosCliente = clienteSeleccionado.data || clienteSeleccionado;

    const payload = {
        cliente: {
            documento: datosCliente.documento,
            nombre: datosCliente.nombre,
            correo: datosCliente.correo,
            telefono: datosCliente.telefono,
            direccion: datosCliente.direccion
        },
        //se visualizan los productos ordenados
        productos: productosFactura.map(p => ({
            id_producto: p.id_producto,
            cantidad: p.cantidad,
            precio_unitario: p.precio_unitario
        }))
    };

    // 3. Envío de datos al servidor
    fetch(`${API_BASE}/factura/manual`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
    })
    .then(res => res.json())
    .then(res => {
        if (res.success) {
            alert("Factura generada correctamente ✔");

            const display = document.getElementById("numeroFacturaDisplay");
            const modal = document.getElementById("modalConfirmacion");

            if (display && modal) {
                display.innerText = res.numero_factura;
                modal.style.display = "flex";
            }
        } else {
            console.error("Detalle del error:", res);
            alert("Error: " + (res.message || "Los datos no son válidos para el servidor"));
        }
    })
    .catch((err) => {
        console.error("Error de conexión:", err);
        alert("Error crítico de conexión con el servidor");
    });
}

function imprimirFactura() {
    window.print();
}

//Validacion de sesion empleado
const empleadoId = localStorage.getItem("empleadoId");
const empleadoNombre = localStorage.getItem("empleadoNombre");

if (!empleadoId) {
    window.location.href = "loginempleado.html";
}

//Mostrar nombre empleado
document.getElementById("user-name").textContent = empleadoNombre;


//Menu hamburguesa
const sidebar = document.getElementById("sidebar");
document.getElementById("menu-toggle").addEventListener("click", () => {
    sidebar.classList.toggle("open");
});


//Usuario-Dropdown
const userDropdown = document.getElementById("user-dropdown");
document.getElementById("user-icon").addEventListener("click", () => {
    userDropdown.classList.toggle("show");
});

//lagout

document.getElementById("logout-btn").addEventListener("click", () => {
    localStorage.removeItem("empleadoId");
    localStorage.removeItem("empleadoNombre");
    localStorage.removeItem("empleadoRol");
    window.location.href = "loginempleado.html";
});
//Notificaciones-dropdown

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


// Navegacion por paginas del sidebar

document.querySelectorAll(".nav-item").forEach(item => {
    item.addEventListener("click", (e) => {
        e.preventDefault();

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


async function cargarEmpleados() {
    const select = document.getElementById("id_vendedor");

    if (!select) {
        console.warn("⚠️ Select id_vendedor no encontrado");
        return;
    }

    try {
        const response = await fetch(`${API_BASE}/user/vendedor`, {
            method: "GET",
            headers: {
                "Content-Type": "application/json"
            }
        });

        if (!response.ok) {
            throw new Error(`HTTP ${response.status}`);
        }

        const result = await response.json();
        console.log("📦 Respuesta empleados:", result);

        if (!result.success) {
            throw new Error(result.message || "Error desconocido");
        }

        
        select.innerHTML = `<option value="">-- Seleccionar vendedor --</option>`;

      
        result.data.forEach(emp => {
            const option = document.createElement("option");
            option.value = emp.id_usuario;
            option.textContent = emp.nombre;
            select.appendChild(option);
        });

        console.log("✅ Empleados cargados correctamente");

    } catch (error) {
        console.error("❌ Error cargando empleados:", error);
        select.innerHTML = `<option value="">Error al cargar empleados</option>`;
    }
}


document.addEventListener("DOMContentLoaded", () => {
    cargarEmpleados();
});