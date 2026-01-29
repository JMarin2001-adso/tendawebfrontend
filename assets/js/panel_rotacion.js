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
