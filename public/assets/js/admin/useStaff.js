import { ref, reactive, watch } from 'vue';
import { authFetch } from './api.js';

const parseUsername = (name) => {
    return name
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "") // Quitar acentos
        .replace(/\s+/g, '_')           // Espacios por guiones bajos
        .replace(/[^a-z0-9_]/g, '')     // Quitar caracteres especiales
        .replace(/_+/g, '_')            // Evitar múltiples guiones bajos seguidos
        .trim();
};

export function useStaff() {
    const staffList = ref([]);
    const loading = ref(false);
    
    // Estado del Modal
    const showStaffModal = ref(false);
    const isEditing = ref(false);

    // Formulario Reactivo
    const staffForm = reactive({
        _id: null,
        name: '',
        username: '',
        password: '', // Solo se envía si se cambia/crea
        pin: '',      // 4 dígitos para POS
        role: 'cashier', // Default
        active: true
    });

    // Definición de Roles para la UI
    const availableRoles = [
        { value: 'manager', label: 'Gerente', icon: 'fa-user-tie', color: 'bg-purple-100 text-purple-600' },
        { value: 'cashier', label: 'Cajero', icon: 'fa-cash-register', color: 'bg-green-100 text-green-600' },
        { value: 'cook', label: 'Cocinero', icon: 'fa-fire-burner', color: 'bg-orange-100 text-orange-600' },
        // { value: 'waiter', label: 'Mesero', icon: 'fa-utensils', color: 'bg-blue-100 text-blue-600' }
    ];

    // --- API ACTIONS ---

    const fetchStaff = async () => {
        loading.value = true;
        try {
            // GET /api/staff - Debe retornar array de usuarios del negocio
            const res = await authFetch('/api/staff');
            if (res.ok) {
                staffList.value = await res.json();
            }
        } catch (e) {
            console.error("Error cargando equipo:", e);
        } finally {
            loading.value = false;
        }
    };

    const openModal = (staff = null) => {
        console.log(staff);
        if (staff) {
            isEditing.value = true;
            staffForm._id = staff._id;
            staffForm.email = staff.email;
            staffForm.username = staff.username;
            staffForm.pin = staff.pin || '';
            staffForm.role = staff.role;
            staffForm.active = staff.active;
            staffForm.password = ''; // No mostramos la contraseña actual por seguridad
        } else {
            isEditing.value = false;
            staffForm._id = null;
            staffForm.email = '';
            staffForm.username = '';
            staffForm.password = '';
            staffForm.pin = '';
            staffForm.role = 'cashier';
            staffForm.active = true;
        }
        showStaffModal.value = true;
    };

    const saveStaff = async () => {
        try {
            const method = isEditing.value ? 'PUT' : 'POST';
            const url = isEditing.value ? `/api/staff/${staffForm._id}` : '/api/staff';
            
            // Preparamos payload (si password está vacío en edit, no lo mandamos)
            const payload = { ...staffForm };
            if (isEditing.value && !payload.password) delete payload.password;

            const res = await authFetch(url, {
                method,
                body: JSON.stringify(payload)
            });

            if (res.ok) {
                const title = isEditing.value ? 'Actualizado' : 'Creado';
                // Usamos el toastr global o Swal
                if(window.toastr) window.toastr.success(`Usuario ${title} correctamente`);
                showStaffModal.value = false;
                fetchStaff();
            } else {
                const err = await res.json();
                if(window.toastr) window.toastr.error(err.message || 'Error al guardar');
            }
        } catch (e) {
            console.error(e);
            if(window.toastr) window.toastr.error('Error de conexión');
        }
    };

    const toggleStatus = async (staff) => {
        // Soft Delete o Toggle Active
        try {
            const res = await authFetch(`/api/staff/${staff._id}/toggle`, { method: 'PATCH' });
            if (res.ok) {
                staff.active = !staff.active;
                if(window.toastr) window.toastr.success(`Estado actualizado`);
            }
        } catch (e) {
            console.error(e);
        }
    };

    const deleteStaff = async (staffId) => {
        // Confirmación con SweetAlert
        const result = await window.Swal.fire({
            title: '¿Estás seguro?',
            text: "No podrás revertir esta acción",
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#ef4444',
            confirmButtonText: 'Sí, eliminar'
        });

        if (result.isConfirmed) {
            try {
                const res = await authFetch(`/api/staff/${staffId}`, { method: 'DELETE' });
                if (res.ok) {
                    staffList.value = staffList.value.filter(u => u._id !== staffId);
                    window.Swal.fire('Eliminado', 'El usuario ha sido eliminado.', 'success');
                }
            } catch (e) {
                console.error(e);
            }
        }
    };

    // Watcher para normalizar el username mientras escriben
    watch(() => staffForm.username, (newVal) => {
        if (newVal) {
            staffForm.username = parseUsername(newVal);
        }
    });

    // Si escriben el nombre y el username está vacío, sugerir un slug
    watch(() => staffForm.name, (newVal) => {
        if (!isEditing.value && newVal && (!staffForm.username || staffForm.username === '')) {
            staffForm.username = parseUsername(newVal);
        }
    });

    return {
        staffList,
        loading,
        isEditing,
        showStaffModal,
        staffForm,
        availableRoles,
        fetchStaff,
        openModal,
        saveStaff,
        toggleStatus,
        deleteStaff
    };
}