import { ref, reactive, computed } from 'vue';
import { authFetch } from './api.js';

export function useFinance() {
    const shiftStatus = ref('loading'); // 'loading', 'closed', 'open'
    const currentData = ref(null); // Datos del turno actual (si está abierto)
    const historyList = ref([]);
    
    // Formularios
    const openAmount = ref(0);
    const movementForm = reactive({ type: 'in', amount: 0, reason: '' });
    const closeAmount = ref(0); // Lo que el usuario cuenta físicamente
    const closeRecounts = reactive({
        debit: 0,      // Tarjeta Débito
        credit: 0,     // Tarjeta Crédito
        transfer: 0    // Transferencias
    });
    const closeStatusView = ref('couts'); // couts , close
    const cashOut = ref(0); // Monto a retirar de caja despues de cierre
    // Modales
    const showOpenModal = ref(false);
    const showMovementModal = ref(false);
    const showCloseModal = ref(false);
    
    // Detalle de Corte
    const showShiftDetailModal = ref(false);
    const selectedShift = ref(null);
    const isLoading = Boolean(false);

    const viewShift = (shift) => {
        selectedShift.value = shift;
        showShiftDetailModal.value = true;
    };

    // Cargar estado inicial
    const fetchCurrentStatus = async () => {
        try {
            const res = await authFetch('/api/finance/current');
            if (res.ok) {
                const data = await res.json();
                if (data.status === 'open') {
                    shiftStatus.value = 'open';
                    currentData.value = data;
                } else {
                    shiftStatus.value = 'closed';
                    currentData.value = null;
                }
            }
        } catch (e) { console.error(e); }
    };

    const fetchHistory = async () => {
        try {
            const res = await authFetch('/api/finance/history');
            if (res.ok) historyList.value = await res.json();
        } catch (e) { console.error(e); }
    };

    // Acciones
    const openRegister = async () => {
        try {
            const res = await authFetch('/api/finance/open', {
                method: 'POST',
                body: JSON.stringify({ amount: openAmount.value })
            });
            if (res.ok) {
                toastr.success('Caja abierta correctamente');
                showOpenModal.value = false;
                fetchCurrentStatus();
                cashOut.value = 0;
            } else {
                const err = await res.json();
                toastr.error(err.message);
            }
        } catch (e) { toastr.error('Error al abrir caja'); }
    };

    const registerMovement = async () => {
        try {
            const res = await authFetch('/api/finance/movement', {
                method: 'POST',
                body: JSON.stringify(movementForm)
            });
            if (res.ok) {
                toastr.success('Movimiento registrado');
                showMovementModal.value = false;
                movementForm.amount = 0; movementForm.reason = '';
                fetchCurrentStatus(); // Actualizar números
            }
        } catch (e) { toastr.error('Error al registrar movimiento'); }
    };

    const closeRegister = async () => {
        if(closeStatusView.value == 'couts') {
            closeStatusView.value = 'close';
        }else {
            try {
                const res = await authFetch('/api/finance/close', {
                    method: 'POST',
                    body: JSON.stringify({ finalCashActual: closeAmount.value, cashOut: cashOut.value })
                });
                if (res.ok) {
                    toastr.success('Caja cerrada. Corte realizado.');
                    showCloseModal.value = false;
                    fetchCurrentStatus();
                    fetchHistory(); // Actualizar historial
                    closeStatusView.value = 'couts';
                    closeRecounts.debit = 0;
                    closeRecounts.credit = 0;
                    closeRecounts.transfer = 0;
                    // Abrimos nueva caja con el monto dejado
                    openAmount.value =  (closeAmount.value - cashOut.value);
                    openRegister();
                }
            } catch (e) { toastr.error('Error al cerrar caja'); }
        }
    };

    const generatePDF = (shift) => {
        try {
            const { jsPDF } = window.jspdf;
            const doc = new jsPDF();

            // 1. Encabezado
            doc.setFontSize(16);
            doc.text('CORTE DE CAJA', 14, 22);
            doc.setFontSize(10);
            doc.text(`ID: ${shift._id}`, 14, 28);
            doc.text(`Fecha: ${new Date(shift.createdAt).toLocaleString()}`, 14, 34);
            doc.text(`Fondo Inicial: $${shift.initialCash.toFixed(2)}`, 14, 40);
            // 2. Resumen de Ingresos
            doc.setFontSize(12);
            doc.text('INGRESOS', 14, 45);
            // doc.text(`Ventas en Efectivo: $${shift.cashSales.toFixed(2)}`, 14, 52);
            doc.text(`Ventas en Efectivo (Calc): $${ (shift.finalCashExpected 
                                        - shift.initialCash 
                                        - shift.movements.filter(m => m.type === 'in').reduce((acc, m) => acc + m.amount, 0) 
                                        + shift.movements.filter(m => m.type === 'out').reduce((acc, m) => acc + m.amount, 0)).toFixed(2) 
                                    }`, 14, 52);
            doc.text(`Entradas Manuales: $${ shift.movements.filter(m => m.type === 'in').reduce((acc, m) => acc + m.amount, 0).toFixed(2) }`, 14, 58);
            doc.text(`Salidas Manuales: $${ shift.movements.filter(m => m.type === 'out').reduce((acc, m) => acc + m.amount, 0).toFixed(2) }`, 14, 64);
            doc.text(`Total Esperado: $${shift.finalCashExpected.toFixed(2)}`, 14, 70);
            
            doc.setFontSize(12);
            doc.setFontSize(12);
            // 3. Movimientos
            doc.text('MOVIMIENTOS', 14, 75);
            if (shift.movements.length === 0) {
                doc.text('Sin movimientos', 14, 82);
            } else {
                shift.movements.forEach((m, i) => {
                    doc.text(`${m.type === 'in' ? '+' : '-'} $${m.amount} - ${m.reason}`, 14, 88 + (i * 6));
                });
            }

            // 4. Cierre
            doc.text('CIERRE', 14, 88 + (shift.movements.length * 6) + 10);
            doc.text(`Cajero: ${shift.closedBy.username}`, 14, 94 + (shift.movements.length * 6));
            doc.text(`Cierre Manual: $${shift.finalCashActual.toFixed(2)}`, 14, 100 + (shift.movements.length * 6));

            // 5. Guardar
            doc.save(`corte-caja-${shift.id}.pdf`);
            toastr.success('PDF generado');

        } catch (e) { toastr.error('Error al generar PDF'); }
    };

    return {
        isLoading, shiftStatus, currentData, historyList,
        openAmount, movementForm, closeAmount,cashOut, closeRecounts,
        showOpenModal, showMovementModal, showCloseModal,
        showShiftDetailModal, selectedShift, viewShift,
        fetchCurrentStatus, fetchHistory,
        openRegister, registerMovement, closeRegister, generatePDF,
        closeStatusView
    };
}