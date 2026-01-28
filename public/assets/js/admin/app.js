import { createApp, ref, onMounted, computed, watch, nextTick, reactive } from 'vue';
import { authFetch } from './api.js';
import { useAuth } from './useAuth.js';
import { useMedia } from './useMedia.js';
import { useBanners } from './useBanners.js';
import { useProducts } from './useProducts.js';
import { useCategories } from './useCategories.js';
import { useAddons } from './useAddons.js';
import { useSettings } from './useSettings.js';
import { useSaas } from './useSaas.js';
import { useAnalytics } from './useAnalytics.js';
import { useLoyalty } from './useLoyalty.js';
import { usePos } from './usePos.js';
import { useUsers } from './useUsers.js';
import { useFinance } from './useFinance.js';
import { useOrders } from './useOrders.js';
import { useQuotes } from './useQuotes.js';
import { useKds } from './useKds.js';
import { useStaff } from './useStaff.js';


const Swal = window.Swal;

// Configuracion de Tailwind
tailwind.config = {
    darkMode: 'class', // Activamos el modo oscuro manual por clases
    theme: {
        extend: {
            fontFamily: {
                sans: ['Outfit', 'sans-serif'],
            },
            colors: {
                primary: '#6366f1', // Indigo 500 equivalent but softer
                primaryDark: '#4f46e5',
                secondary: '#10b981', // Emerald 500
                dark: '#1e293b', // Slate 800
                sidebar: '#0f172a', // Slate 900
            }
        }
    }
}

// Configuración Global de Toastr
toastr.options = {
    "closeButton": true,
    "progressBar": true,
    "positionClass": "toast-bottom-right", // Abajo a la derecha
    "timeOut": "3000",
}

// Google Maps Autocomplete Logic
window.initAutocomplete = function () {
    const input = document.getElementById('address-input');
    if (!input) return;

    const autocomplete = new google.maps.places.Autocomplete(input, {
        fields: ["geometry", "name", "formatted_address"],
        types: ["geocode", "establishment"] // Ajustar según necesidad
    });

    autocomplete.addListener("place_changed", () => {
        const place = autocomplete.getPlace();

        if (!place.geometry || !place.geometry.location) {
            console.error("No details available for input: '" + place.name + "'");
            return;
        }

        // Obtener la instancia de Vue desde el elemento DOM (Truco si no exponemos la variable global)
        // O más limpio: Despachar un evento personalizado que Vue escuche
        const event = new CustomEvent('address-selected', {
            detail: {
                address: place.formatted_address || place.name,
                lat: place.geometry.location.lat(),
                lng: place.geometry.location.lng()
            }
        });
        window.dispatchEvent(event);
    });
};

// Cargar initAutocomplete cuando cargue Google Maps (callback) o si ya cargó
if (window.google && window.google.maps) {
    window.initAutocomplete();
} else {
    // Si usas callback en la URL del script: &callback=initAutocomplete
    // Si no, esperar a window load o similar.
    window.addEventListener('load', () => {
        if (window.google && window.google.maps) window.initAutocomplete();
    });
}

createApp({
    setup() {

        const collapsed = ref(false);
        const mobileMenuOpen = ref(false);
        const currentView = ref(localStorage.getItem('currentView') || 'dashboard');
        const currentUserRole = ref('admin_negocio');

        const availableCategoriesStore = ref([
            { id: 'burgers', name: 'Hamburguesas', emoji: '🍔' },
            { id: 'pizza', name: 'Pizza', emoji: '🍕' },
            { id: 'sushi', name: 'Sushi', emoji: '🍣' },
            { id: 'tacos', name: 'Tacos', emoji: '🌮' },
            { id: 'mexican', name: 'Mexicana', emoji: '🌶️' },
            { id: 'wings', name: 'Alitas', emoji: '🍗' },
            { id: 'italian', name: 'Italiana', emoji: '🍝' },
            { id: 'chinese', name: 'China', emoji: '🥡' },
            { id: 'seafood', name: 'Mariscos', emoji: '🍤' },
            { id: 'chicken', name: 'Pollo', emoji: '🐓' },
            { id: 'coffee', name: 'Café', emoji: '☕' },
            { id: 'bakery', name: 'Panadería', emoji: '🥐' },
            { id: 'dessert', name: 'Postres', emoji: '🍰' },
            { id: 'healthy', name: 'Saludable', emoji: '🥗' },
            { id: 'vegan', name: 'Vegana', emoji: '🌱' },
            { id: 'bar', name: 'Bebidas', emoji: '🍺' },
            { id: 'breakfast', name: 'Desayunos', emoji: '🍳' },
            { id: 'fastfood', name: 'Rápida', emoji: '🍟' }
        ]);
        // --- USANDO COMPOSABLES ---
        const auth = useAuth();
        const media = useMedia(auth.isDark);
        const banners = useBanners(auth.isDark, media.fetchMedia);
        const products = useProducts(auth.isDark, media.fetchMedia);
        const categories = useCategories(auth.isDark, media.fetchMedia);
        const addons = useAddons(auth.isDark);
        const settings = useSettings(auth);
        const pos = usePos(products, media.fetchMedia, settings);
        const saas = useSaas();
        const analytics = useAnalytics();
        const useloyalty = useLoyalty();
        const users = useUsers();
        const finance = useFinance();
        const orders = useOrders();
        const quotes = useQuotes(settings);
        const kds = useKds();
        const staff = useStaff();

        const saasMenu = ref([
            { id: 100, label: 'Clientes / Negocios', icon: 'fa-solid fa-building-user', view: 'saas_clients' },
            { id: 102, label: 'Publicidad Global', icon: 'fa-solid fa-globe', view: 'ads' },
            { id: 102, label: 'Galería Global', icon: 'fa-solid fa-images', view: 'media' },
            { id: 103, label: 'Configuración', icon: 'fa-solid fa-gear', view: 'settings' }
        ]);

        const businessMenu = ref([
            { id: 0, label: 'Punto de venta', icon: 'fa-solid fa-cash-register', view: 'pos' ,section: 'main', roles: ['cashier'] },
            { id: 1, label: 'Dashboard', icon: 'fa-solid fa-chart-pie', view: 'dashboard' ,section: 'main', roles: ['admin_negocio','admin', 'manager'] },
            { id: 2, label: 'Medios', icon: 'fa-solid fa-images', view: 'media', section: 'main', roles: ['admin_negocio','admin', 'manager'] },
            // PUBLICIDAD CONDICIONAL
            {
                id: 3,
                label: 'Publicidad',
                icon: 'fa-solid fa-bullhorn',
                view: 'ads',
                section: 'management' ,
                roles: ['admin_negocio','admin', 'manager'],
                get locked() { return (settings.settings.value.plan == 'free') ? true : false; }
            },
            {
                id: 4,
                label: 'Lealtad',
                icon: 'fa-solid fa-gift',
                view: 'loyalty',
                section: 'management' ,
                roles: ['admin_negocio','admin', 'manager'],
                get locked() { return (settings.settings.value.plan == 'free') ? true : false; }
            },
            {
                id: 5,
                label: 'Productos',
                icon: 'fa-solid fa-burger',
                expanded: false,
                section: 'management',
                roles: ['admin_negocio','admin', 'manager'],
                children: [
                    { id: 6, label: 'Listado', view: 'products' },
                    { id: 7, label: 'Complementos', view: 'addons' },
                    { id: 8, label: 'Categorías', view: 'categories' }
                ]
            },
            {
                id: 9,
                label: 'Ventas',
                icon: 'fa-solid fa-receipt',
                expanded: false,
                section: 'management',
                roles: ['admin_negocio','admin', 'manager'],
                children: [
                    {
                        id: 10, label: 'Historial', view: 'orders',
                        get locked() { return (settings.settings.value.plan == 'free') ? true : false; }
                    },
                    {
                        id: 11, label: 'Cotizaciones', view: 'quotes',
                        get locked() { return (settings.settings.value.plan == 'free') ? true : false; }
                    }
                ],
                get locked() { return (settings.settings.value.plan == 'free') ? true : false; }
            },
            { id: 3, label: 'KDS Cocina', icon: 'fa-solid fa-fire-burner', view: 'kds', section: 'ops',roles: ['admin_negocio','cook'] }, // Nuevo Item
            {
                id: 9,
                label: 'Caja',
                icon: 'fa-solid fa-box',
                expanded: false,
                section: 'management',
                roles: ['admin_negocio','admin', 'manager'],
                children: [
                    {
                        id: 10, label: 'Caja Actual', view: 'finance',
                        get locked() { return (settings.settings.value.plan == 'free') ? true : false; }
                    },
                    {
                        id: 11, label: 'Historial de Cajas', view: 'finance_history',
                        get locked() { return (settings.settings.value.plan == 'free') ? true : false; }
                    }
                ],
                get locked() { return (settings.settings.value.plan == 'free') ? true : false; }
            },
            { id: 13, label: 'Usuarios', icon: 'fa-solid fa-user-group', view: 'users', section: 'management', roles: ['admin_negocio','admin'] },
            { id: 14, label: 'Equipo y Roles', icon: 'fa-solid fa-users-gear', view: 'staff', section: 'management', roles: ['admin_negocio','admin'] },
            { id: 15, label: 'Configuración', icon: 'fa-solid fa-gear', view: 'settings', section: 'config', roles: ['admin_negocio','admin'] }
        ]);


        // Lógica de Toggle
        const toggleCategory = async (id) => {
            if (settings.settings.value.categories.includes(id)) {
                // Quitar si ya existe
                settings.settings.value.categories = settings.settings.value.categories.filter(c => c !== id);
            } else {
                // Agregar si no existe
                settings.settings.value.categories.push(id);
            }
        };

        
        let productsDataTable = null;
        const initProductsTable = () => {
            if (productsDataTable) {
                productsDataTable.destroy();
            }

            // Esperamos que el DOM esté listo
            nextTick(() => {
                if (!document.getElementById('productsTable')) return;

                productsDataTable = $('#productsTable').DataTable({
                    data: products.products.value, // Datos de Vue
                    responsive: true,
                    language: { url: "/es-ES.json" }, // Español
                    columns: [
                        {
                            data: 'image',
                            render: (data) => `<img src="${data || 'https://via.placeholder.com/50'}" class="w-10 h-10 rounded object-cover">`
                        },
                        {
                            data: 'name',
                            render: (data, type, row) => `<div>
                                <div class="font-bold text-slate-800 dark:text-white">
                                    ${data}
                                </div>
                                <div class="text-xs text-slate-500">
                                    ${row.description.substring(0, 20) + '...'}
                                </div>
                            </div>`
                        },
                        { data: 'price', render: (data) => `<span class="font-bold">$${data}</span>` },
                        {
                            data: 'categories',
                            render: (data) => {
                                if (!data) return '';
                                return data.map(id => `<span class="bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded text-[10px] mx-1">${products.getCategoryName(id)}</span>`).join('');
                            }
                        },
                        {
                            data: 'active',
                            render: (data) => `<span class="px-2 py-1 rounded text-xs font-bold ${data ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}">${data ? 'Activo' : 'Inactivo'}</span>`
                        },
                        {
                            data: null,
                            orderable: false,
                            render: (data, type, row) => `
                                    <div class="flex gap-2 justify-end">
                                        <button class="btn-edit w-8 h-8 rounded-full bg-blue-100 text-blue-600 hover:bg-blue-200 transition flex items-center justify-center" data-id="${row._id}">
                                            <i class="fa-solid fa-pen text-xs"></i>
                                        </button>
                                        <button class="btn-delete w-8 h-8 rounded-full bg-red-100 text-red-600 hover:bg-red-200 transition flex items-center justify-center" data-id="${row._id}">
                                            <i class="fa-solid fa-trash text-xs"></i>
                                        </button>
                                    </div>
                                `
                        }
                    ]
                });
            });
        };

        watch(products.products, () => {
            if (currentView.value === 'products') initProductsTable();
        });

        $(document).on('click', '.btn-edit', function () {
            const id = $(this).data('id');
            const prod = products.products.value.find(p => p._id === id);
            products.openProductModal(prod, media.mediaFiles.value.length);
        });

        $(document).on('click', '.btn-delete', function () {
            const id = $(this).data('id');
            products.deleteProduct(id);
        });

        $(document).on('click', '.btn-trending', function () {
            const id = $(this).data('id');
            const prod = products.products.value.find(p => p._id === id);
            products.toggleTrending(prod);
        });

        // Listener para Google Maps Event (Desde fuera de Vue)
        const updateAddressFromMap = (e) => {
            const { address, lat, lng } = e.detail;
            settings.settings.value.address = address;
            // Asegurar objeto location
            if (!settings.settings.value.location) settings.settings.value.location = {};

            settings.settings.value.location.lat = lat;
            settings.settings.value.location.lng = lng;

            // Opcional: Feedback visual
            toastr.info('Ubicación actualizada');
        };

        // Computada para decidir qué menú mostrar
        // const activeMenuItems = computed(() => {
        //     return currentUserRole.value === 'superadmin' ? saasMenu.value : businessMenu.value;
        // });
        // --- FILTRADO AUTOMÁTICO SEGÚN ROL ---
        const activeMenuItems = computed(() => {
            // Si no hay usuario cargado aún, o no tiene rol, asumimos 'admin' si es el dueño inicial
            // o bloqueamos todo. Aquí uso 'admin' como fallback para pruebas, pero en prod debería ser estricto.
            if(currentUserRole.value === 'superadmin') {
                saasMenu.value
            }else {
                return businessMenu.value.filter(item => {
                    // Si el item no tiene roles definidos, es público para todos los logueados
                    if (!item.roles) return true;
                    return item.roles.includes(currentUserRole.value);
                });
            }
        });


        // Watcher global para vistas que requieren inicialización DOM
        watch(currentView, (newVal) => {
            if (newVal === 'settings') {
                nextTick(() => {
                    if (window.initAutocomplete) window.initAutocomplete();
                });
            }
        });

        // --- LOGICA MAP PICKER ---
        const showMapModal = ref(false);
        const mapInstance = ref(null);
        const markerInstance = ref(null);
        const tempAddress = ref('');
        const tempLocation = ref({ lat: 0, lng: 0 });

        const openMapModal = () => {
            showMapModal.value = true;
            mapInstance.value = null; // Resetear para forzar nueva instancia al reabrir (por v-if)
            markerInstance.value = null;
            // Delay para que el modal renderice el div #map-picker
            setTimeout(() => {
                initMapPicker();
            }, 200);
        };

        const initMapPicker = () => {
            const defaultLat = settings.settings.value.location?.lat || 19.432608; // CDMX Default
            const defaultLng = settings.settings.value.location?.lng || -99.133209;
            const center = { lat: parseFloat(defaultLat), lng: parseFloat(defaultLng) };

            tempLocation.value = center;
            tempAddress.value = settings.settings.value.address || '';

            if (!mapInstance.value) {
                const mapEl = document.getElementById('map-picker');
                if (!mapEl || !window.google) return;

                mapInstance.value = new google.maps.Map(mapEl, {
                    center: center,
                    zoom: 15,
                    streetViewControl: false,
                    mapTypeControl: false
                });

                markerInstance.value = new google.maps.Marker({
                    position: center,
                    map: mapInstance.value,
                    draggable: true,
                    animation: google.maps.Animation.DROP,
                    icon: '/assets/images/marker_maps.png'
                });

                // Listeners
                markerInstance.value.addListener('dragend', () => {
                    const position = markerInstance.value.getPosition();
                    tempLocation.value = { lat: position.lat(), lng: position.lng() };
                    geocodePosition(position);
                });

                mapInstance.value.addListener('click', (e) => {
                    markerInstance.value.setPosition(e.latLng);
                    tempLocation.value = { lat: e.latLng.lat(), lng: e.latLng.lng() };
                    geocodePosition(e.latLng);
                });

            } else {
                // Re-centrar si ya existe
                google.maps.event.trigger(mapInstance.value, 'resize');
                mapInstance.value.setCenter(center);
                markerInstance.value.setPosition(center);
            }
        };

        const geocodePosition = (latLng) => {
            const geocoder = new google.maps.Geocoder();
            geocoder.geocode({ location: latLng }, (results, status) => {
                if (status === 'OK' && results[0]) {
                    tempAddress.value = results[0].formatted_address;
                } else {
                    tempAddress.value = 'Dirección no encontrada';
                }
            });
        };

        const confirmLocation = () => {
            settings.settings.value.address = tempAddress.value;
            // Asegurar location
            if (!settings.settings.value.location) settings.settings.value.location = {};

            settings.settings.value.location.lat = tempLocation.value.lat;
            settings.settings.value.location.lng = tempLocation.value.lng;

            showMapModal.value = false;
            toastr.success('Ubicación actualizada desde el mapa');
        };

        // --- LÓGICA LOCAL PARA MODAL DETALLE ITEM ---
        const showItemDetailsModal = ref(false);
        const selectedCartItem = ref(null);

        // DATATABLE DE USUARIOS
        let usersTable = null;
        const initUsersTable = () => {
            if (usersTable) usersTable.destroy();
            nextTick(() => {
                if (!document.getElementById('usersTable')) return;

                usersTable = $('#usersTable').DataTable({
                    data: users.usersList.value,
                    responsive: true,
                    language: { url: "/es-ES.json" },
                    columns: [
                        { data: 'name', render: (data) => `<div class="font-bold text-slate-800 dark:text-white">${data}</div>` },
                        { data: 'phone' },
                        { data: 'points', render: (data) => `<span class="text-emerald-600 font-bold">${data}</span>` },
                        { data: 'visits' },
                        { data: 'lastVisit', render: (data) => data ? new Date(data).toLocaleDateString() : '-' },
                        { data: null, render: () => `<button class="btn-view-user text-primary hover:text-primaryDark"><i class="fa-solid fa-eye"></i></button>` }
                    ]
                });

                // Evento Click en Fila (Delegación) para ver detalle
                $('#usersTable tbody').off('click', 'tr').on('click', 'tr', function () {
                    const rowData = usersTable.row(this).data();
                    if (rowData) {
                        // Llamamos a la lógica para cargar detalle y cambiar vista
                        users.fetchUserDetails(rowData._id);
                        currentView.value = 'user_details';
                    }
                });
            });
        };

        // Watch Users
        watch(users.usersList, () => { if (currentView.value === 'users') initUsersTable(); });

        // DataTable Orders
        let ordersTable = null;
        const initOrdersTable = () => {
            if (ordersTable) ordersTable.destroy();
            nextTick(() => {
                if (!document.getElementById('ordersTable')) return;
                ordersTable = $('#ordersTable').DataTable({
                    data: orders.ordersList.value,
                    responsive: true,
                    language: { url: "/es-ES.json" },
                    order: [[7, 'ASC']], // Ordenar por fecha descendente
                    columns: [
                        { data: '_id', render: (data) => `<span class="font-mono text-xs text-slate-500">#${data.slice(-6).toUpperCase()}</span>` },
                        { data: 'createdAt', render: (data) => `<span class="text-sm">${new Date(data).toLocaleDateString()} ${new Date(data).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>` },
                        { data: 'customerId', render: (data) => data ? `<span class="font-bold text-slate-800 dark:text-white">${data.name}</span>` : '<span class="italic text-slate-400">Mostrador</span>' },
                        { data: 'source', render: (data) => `<span class="badge badge-sm">${data}</span>` },
                        {
                            data: 'paymentMethod', render: (data) => {
                                const icons = { cash: 'fa-money-bill', card: 'fa-credit-card', transfer: 'fa-money-bill-transfer' };
                                return `<i class="fa-solid ${icons[data] || 'fa-circle-question'} text-slate-400 mr-1"></i> <span class="capitalize">${data}</span>`;
                            }
                        },
                        { data: 'total', render: (data) => `<span class="font-bold text-slate-800 dark:text-white">$${data.toFixed(2)}</span>` },
                        {
                            data: 'status', render: (data) => {
                                const colors = { completed: 'bg-green-100 text-green-700', cancelled: 'bg-red-100 text-red-700', pending: 'bg-yellow-100 text-yellow-700' };
                                return `<span class="px-2 py-1 rounded text-xs font-bold ${colors[data] || 'bg-slate-100'}">${data}</span>`;
                            }
                        },
                        { data: null, render: () => `<button class="btn-view-order text-primary hover:text-primaryDark"><i class="fa-solid fa-eye"></i></button>` }
                    ]
                });

                // Click evento
                $('#ordersTable tbody').off('click', '.btn-view-order').on('click', '.btn-view-order', function () {
                    const rowData = ordersTable.row($(this).parents('tr')).data();
                    if (rowData) {
                        orders.fetchOrderDetails(rowData._id);
                        currentView.value = 'order_details';
                    }
                });
            });
        };

        // Watcher Orders
        watch(orders.ordersList, () => { if (currentView.value === 'orders') initOrdersTable(); });

        const viewListOrders = () => {
            orders.fetchOrders();
            initOrdersTable();
            currentView.value = 'orders';
        }

        // DataTable Quotes
        let QuotesTable = null;
        const initQuotesTable = () => {
            if (QuotesTable) QuotesTable.destroy();
            nextTick(() => {
                if (!document.getElementById('quotesTable')) return;
                QuotesTable = $('#quotesTable').DataTable({
                    data: quotes.quotesList.value,
                    responsive: true,
                    language: { url: "/es-ES.json" },
                    order: [[0, 'desc']], // Ordenar por fecha descendente
                    columns: [
                        { data: '_id', render: (data) => `<span class="font-mono text-xs text-slate-500">#${data.slice(-6).toUpperCase()}</span>` },
                        { data: 'customerName', render: (data) => data ? `<span class="font-bold text-slate-800 dark:text-white">${data.toUpperCase()}</span>` : '<span class="italic text-slate-400">Mostrador</span>' },
                        { data: 'validUntil', render: (data) => `<span class="badge badge-sm">${data}</span>` },
                        { data: 'total', render: (data) => `<span class="font-bold text-slate-800 dark:text-white">$${data.toFixed(2)}</span>` },
                        {
                            data: 'status', render: (data) => {
                                const colors = { ready: 'bg-green-100 text-green-700', pending: 'bg-yellow-100 text-yellow-700' };
                                return `<span class="px-2 py-1 rounded text-xs font-bold ${colors[data] || 'bg-slate-100'}">${data}</span>`;
                            }
                        },
                        {
                            data: null, render: () => `
                            <div class="flex gap-2 justify-end">
                                <button class="btn-edit-quote text-blue-500 hover:bg-blue-50 p-2 rounded"><i class="fa-solid fa-eye"></i></button>
                                <button class="btn-delete-quote text-red-500 hover:bg-red-50"><i class="fa-solid fa-trash"></i></button>
                            </div>` }
                    ]
                });

                // Click evento
                $('#quotesTable tbody').off('click', '.btn-edit-quote').on('click', '.btn-edit-quote', function () {
                    const rowData = QuotesTable.row($(this).parents('tr')).data();
                    if (rowData) {
                        editQuote(rowData)
                    }
                });
                $('#quotesTable tbody').off('click', '.btn-delete-quote').on('click', '.btn-delete-quote', function () {
                    const rowData = QuotesTable.row($(this).parents('tr')).data();
                    if (rowData) {
                        quotes.deleteQuote(rowData._id)
                    }
                });
            });
        };

        // Watcher Quotes
        watch(quotes.quotesList, () => { if (currentView.value === 'quotes') initQuotesTable(); });

        // --- Interceptamos el login para obtener el rol real
        const originalLogin = auth.login;
        auth.login = async () => {
            // Hacemos el login normal
            await originalLogin();

            // Si el login fue exitoso (hay token), determinamos el rol
            if (auth.isAuthenticated.value) {
                // TRUCO: Decodificar el JWT para sacar el rol real
                const token = localStorage.getItem('token');
                if (token) {
                    const payload = JSON.parse(atob(token.split('.')[1]));
                    const role = payload.role || 'admin_negocio';

                    // Guardar y Actualizar estado
                    localStorage.setItem('role', role);
                    currentUserRole.value = role;
                    settings.fetchSettings(); // <-- Cargamos y normalizamos configuraciones...
                    finance.fetchCurrentStatus(); // <-- Cargamos el status de la caja
                    finance.fetchHistory(); // <-- Cargamos el status de la caja
                    analytics.fetchDashboardStats(); // <-- Cargamos stadisticas
                    // Redirección inteligente
                    if (role === 'superadmin') {
                        currentView.value = 'saas_clients';
                        saas.fetchBusinesses();
                    } else {
                        currentView.value = 'dashboard';
                        analytics.fetchDashboardStats();
                    }
                }
            }
        };

        const toggleSidebar = () => {
            if (window.innerWidth < 768) mobileMenuOpen.value = !mobileMenuOpen.value;
            else collapsed.value = !collapsed.value;
        };

        const navigate = async (item) => {
            currentView.value = item.view;
            localStorage.setItem('currentView', JSON.stringify(item));
            mobileMenuOpen.value = false;

            // 1. CAMBIAR LA URL VISUALMENTE
            const slug = item.view === 'dashboard' ? '' : item.view; // /admin/dashboard -> /admin/
            // Nota: Asumimos base /admin/
            if (!item.locked) {
                const newUrl = `/admin/${slug}`;
                window.history.pushState({ view: item.view }, '', newUrl);
            } else {
                const Toast = Swal.mixin({ toast: true, position: 'bottom-end', showConfirmButton: false, timer: 3500 });
                Toast.fire({ icon: 'error', title: 'Sección Bloqueada', text: "Por favor activa un plan PRO" });
                currentView.value = "dashboard";
                // 1. CAMBIAR LA URL VISUALMENTE
                const newUrl = `/admin/dashboard`;
                window.history.pushState({ view: currentView.value }, '', newUrl);
                return;
            }

            if (window.innerWidth < 768) mobileMenuOpen.value = false;
            else collapsed.value = false;

            // Stop KDS polling if leaving KDS
            if (item.view !== 'kds') kds.stopPolling();
            // Check KDS for sidebar
            if (item.view == 'kds') {
                if (window.innerWidth < 768) {
                    mobileMenuOpen.value = false;
                    collapsed.value = false;
                } else {
                    mobileMenuOpen.value = true;
                    collapsed.value = true;
                }
            }

            // Optimizamos el espacio del POS
            if (item.view == 'pos') {
                products.fetchProducts();
                if (window.innerWidth < 768) {
                    mobileMenuOpen.value = false;
                    collapsed.value = false;
                } else {
                    mobileMenuOpen.value = true;
                    collapsed.value = true;
                }
            }

            if (!item.children) {
                // Vistas Comunes (Admin y Negocio)
                if (item.view === 'media') media.fetchMedia();
                if (item.view === 'ads') banners.fetchBanners();
                if (item.view === 'settings') settings.fetchSettings();

                // Vistas Específicas
                if (item.view === 'saas_clients') saas.fetchBusinesses();
                if (item.view === 'products') products.fetchProducts();
                if (item.view === 'categories') categories.fetchCategories();
                if (item.view === 'addons') addons.fetchAddons();
                if (item.view === 'loyalty') useloyalty.fetchProgram();
                if (item.view === 'dashboard' && currentUserRole.value !== 'superadmin') {
                    analytics.fetchDashboardStats();
                }
                if (item.view === 'users') users.fetchUsers();
                if (item.view === 'finance') {
                    finance.fetchCurrentStatus();
                    finance.fetchHistory();
                }
                if (item.view === 'orders') orders.fetchOrders();
                if (item.view === 'quotes'){
                    quotes.fetchQuotes();
                    products.fetchProducts();
                    users.fetchUsers();
                }
                if (item.view === 'kds') kds.startPolling(); // Start polling for KDS
                if (item.view === 'staff') staff.fetchStaff();
            }
        };

        const toggleSubmenu = (item) => {
            item.expanded = !item.expanded;
            if (collapsed.value) collapsed.value = false;
        };

        const openItemDetails = (item) => {
            selectedCartItem.value = item;
            if (!item.note) item.note = '';
            // Inicializar opciones seleccionadas si no existen
            if (!item.selectedOptions) item.selectedOptions = [];
            showItemDetailsModal.value = true;
        };

        // Helpers para Complementos en Modal
        const selectedItemAddonGroups = computed(() => {
            if (!selectedCartItem.value || !selectedCartItem.value.addons) return [];
            return selectedCartItem.value.addons;
        });

        const selectedItemUnitPrice = computed(() => {
            if (!selectedCartItem.value) return 0;
            const addonsTotal = (selectedCartItem.value.selectedOptions || []).reduce((sum, opt) => sum + (opt.price || 0), 0);
            return selectedCartItem.value.price + addonsTotal;
        });

        const toggleAddonOption = (group, option) => {
            const item = selectedCartItem.value;
            if (!item.selectedOptions) item.selectedOptions = [];

            const existingIdx = item.selectedOptions.findIndex(o => o.name === option.name && o.group === group.name);

            if (existingIdx !== -1) {
                // Deseleccionar
                item.selectedOptions.splice(existingIdx, 1);
            } else {
                // Seleccionar
                if (group.maxOptions > 1) {
                    // Lógica Checkbox (Múltiple con límite)
                    const currentInGroup = item.selectedOptions.filter(o => o.group === group.name).length;
                    if (currentInGroup < group.maxOptions) {
                        item.selectedOptions.push({ name: option.name, price: option.priceExtra, group: group.name });
                    } else {
                        toastr.warning(`Máximo ${group.maxOptions} opciones para ${group.name}`);
                    }
                } else {
                    // Lógica Radio (Único: reemplaza otros del mismo grupo)
                    const others = item.selectedOptions.filter(o => o.group !== group.name);
                    others.push({ name: option.name, price: option.priceExtra, group: group.name });
                    item.selectedOptions = others;
                }
            }
        };

        const isOptionSelected = (group, option) => {
            return selectedCartItem.value?.selectedOptions?.some(o => o.name === option.name && o.group === group.name);
        };

        // EXPORTAR VENTAS A EXCEL
        const downloadSalesExcel = () => {
            if (!orders.ordersList.value || orders.ordersList.value.length === 0) {
                return Swal.fire('Error', 'No hay datos para exportar', 'warning');
            }

            // Preparar datos planos para Excel
            const data = orders.ordersList.value.map(o => ({
                Folio: o._id.slice(-6).toUpperCase(),
                Fecha: new Date(o.createdAt).toLocaleDateString(),
                Hora: new Date(o.createdAt).toLocaleTimeString(),
                Cliente: o.customerId ? o.customerId.name : 'Mostrador',
                MetodoPago: o.paymentMethod,
                Total: o.total,
                Estado: o.status
            }));

            const worksheet = XLSX.utils.json_to_sheet(data);
            const workbook = XLSX.utils.book_new();
            XLSX.utils.book_append_sheet(workbook, worksheet, "Ventas");

            // Generar archivo
            XLSX.writeFile(workbook, `Reporte_Ventas_${new Date().toISOString().split('T')[0]}.xlsx`);
            toastr.success('Reporte descargado correctamente');
        };

        // IMPRIMIR TICKET TÉRMICO (80mm)
        const printThermalTicket = () => {
            const ord = orders.selectedOrder.value;
            if (!ord) return;

            // Ventana emergente con estilos específicos para impresora
            const win = window.open('', '', 'width=350,height=600');
            const styles = `
                        <style>
                            @page { margin: 0; }
                            body { margin: 0; padding: 10px; font-family: 'Courier New', monospace; font-size: 12px; width: 80mm; }
                            .center { text-align: center; }
                            .bold { font-weight: bold; }
                            .line { border-bottom: 1px dashed #000; margin: 5px 0; }
                            .flex { display: flex; justify-content: space-between; }
                            .title { font-size: 16px; font-weight: bold; margin-bottom: 5px; }
                        </style>
                    `;

            const itemsHtml = ord.items.map(item => `
                        <div class="flex">
                            <span>${item.quantity} x ${item.name}</span>
                            <span>$${(item.price * item.quantity).toFixed(2)}</span>
                        </div>
                    `).join('');

            const content = `
                        <html>
                            <head><title>Ticket</title>${styles}</head>
                            <body>
                                <div class="center">
                                    <div class="title">${settings.settings.value.appName || 'FUDIAPP'}</div>
                                    <div>${settings.settings.value.ownerEmail || 'soporte@fudiapp.com'}</div>
                                    <div>Tel: ${settings.settings.value.phone || '000-000-000'}</div>
                                </div>
                                <div class="line"></div>
                                <div>Folio: #${ord._id.slice(-6).toUpperCase()}</div>
                                <div>Fecha: ${new Date(ord.createdAt).toLocaleString()}</div>
                                <div>Cliente: ${ord.customerId ? ord.customerId.name : 'Mostrador'}</div>
                                <div class="line"></div>
                                ${itemsHtml}
                                <div class="line"></div>
                                <div class="flex bold">
                                    <span>TOTAL</span>
                                    <span>$${ord.total.toFixed(2)}</span>
                                </div>
                                <div class="center" style="margin-top:10px;">
                                    <div>Forma de Pago: <span style="text-transform:uppercase">${ord.paymentMethod}</span></div>
                                    <div style="margin-top:10px;">¡Gracias por su compra!</div>
                                </div>
                            </body>
                        </html>
                    `;

            win.document.write(content);
            win.document.close();
            win.focus();
            setTimeout(() => {
                win.print();
                win.close();
            }, 500);
        };
        // --- LÓGICA IMPRESIÓN DE TICKETS PRO ---
        const showTicketModal = ref(false);
        const ticketData = ref(null);

        const openTicketPreview = () => {
            const ord = orders.selectedOrder.value;
            if (!ord) return;

            ticketData.value = {
                folio: ord._id.slice(-6).toUpperCase(),
                customer: ord.customerId ? ord.customerId.name : 'Mostrador',
                total: ord.total,
                method: ord.paymentMethod,
                items: ord.items.map(i => ({ qty: i.quantity, name: i.name, price: i.price }))
            };
            showTicketModal.value = true;
        };

        // Print PDF Ticket
        const printTicketNow = () => {
            // 1. Obtener el HTML limpio del ticket
            const content = document.getElementById('thermal-ticket-content').innerHTML;

            // 2. Crear un iframe oculto
            const iframe = document.createElement('iframe');
            iframe.style.display = 'none';
            document.body.appendChild(iframe);

            // 3. Escribir el contenido
            const doc = iframe.contentWindow.document;
            doc.open();
            doc.write(`
                        <html>
                        <head>
                            <title>Print</title>
                            <style>
                                body { margin: 0; padding: 0; font-family: 'Courier New', monospace; font-size: 12px; width: 80mm; }
                                .text-center { text-align: center; }
                                .font-bold { font-weight: bold; }
                                .flex { display: flex; justify-content: space-between; }
                                .mb-1 { margin-bottom: 4px; }
                                .mb-2 { margin-bottom: 8px; }
                                .mt-2 { margin-top: 8px; }
                                .text-lg { font-size: 16px; }
                                .ticket-dashed { border-bottom: 1px dashed #000; margin: 8px 0; }
                                .text-xs { font-size: 11px; }
                            </style>
                        </head>
                        <body>
                            ${content}
                            <script>
                                window.onload = function() { 
                                    window.print(); 
                                    setTimeout(() => { window.parent.document.body.removeChild(window.frameElement); }, 1000);
                                }
                            <\/script>
                        </body>
                        </html>
                    `);
            doc.close();
        };

        // GENERAR PDF
        const generatePDF = () => {
            const ord = orders.selectedOrder.value;
            if (!ord) return;

            const { jsPDF } = window.jspdf;
            const doc = new jsPDF();

            // Título
            doc.setFontSize(20);
            doc.text(`${settings.settings.value.appName || 'FUDIAPP'} - Comprobante de Venta`, 105, 20, { align: "center" });

            // Info General
            doc.setFontSize(10);
            doc.text(`Folio: #${ord._id.slice(-6).toUpperCase()}`, 20, 40);
            doc.text(`Fecha: ${new Date(ord.createdAt).toLocaleString()}`, 20, 46);
            doc.text(`Cliente: ${ord.customerId ? ord.customerId.name : 'Mostrador'}`, 20, 52);
            doc.text(`Estado: ${ord.status.toUpperCase()}`, 150, 40);

            // Línea
            doc.line(20, 60, 190, 60);

            // Tabla Productos (Manual)
            let y = 70;
            doc.setFont(undefined, 'bold');
            doc.text("Producto", 20, y);
            doc.text("Cant.", 120, y);
            doc.text("Precio", 140, y);
            doc.text("Total", 170, y);
            doc.setFont(undefined, 'normal');

            y += 6;
            ord.items.forEach(item => {
                doc.text(item.name.substring(0, 40), 20, y);
                doc.text(item.quantity.toString(), 120, y);
                doc.text(`$${item.price.toFixed(2)}`, 140, y);
                doc.text(`$${(item.price * item.quantity).toFixed(2)}`, 170, y);
                y += 6;
            });

            doc.line(20, y + 4, 190, y + 4);

            // Totales
            y += 12;
            doc.setFontSize(14);
            doc.setFont(undefined, 'bold');
            doc.text(`TOTAL: $${ord.total.toFixed(2)}`, 140, y);

            doc.save(`Venta_${ord._id.slice(-6)}.pdf`);
        };

        // --- LÓGICA DE COTIZACIONES (BRIDGE) ---
        const startNewQuote = () => {
            // Asegurarnos que tenemos los usuarios cargados
            users.fetchUsers().then(() => {
                quotes.setClientsDb(users.usersList.value);
                quotes.setProductsDb(products.products.value);
                quotes.newQuote();
                currentView.value = 'quote_editor';
            });
        };

        const editQuote = (q) => {
            // Asegurarnos que tenemos los usuarios cargados
            users.fetchUsers().then(async () => {
                await quotes.setClientsDb(users.usersList.value);
                await quotes.setProductsDb(products.products.value);
                await quotes.editQuote(q);
                currentView.value = 'quote_editor';
            });
        };

        const saveQuote = async () => {
            if (!quotes.clientSearch.value) return Swal.fire('Falta información', 'Ingresa el nombre del cliente', 'warning');
            if (quotes.form.items.length === 0) return Swal.fire('Vacío', 'Agrega productos a la cotización', 'warning');

            quotes.form.total = quotes.totals.value.total; // Guardamos el total final calculado
            quotes.form.createdAt = new Date().toISOString();

            try {
                const url = quotes.isEditing.value ? `/api/quotes/${quotes.form._id}` : '/api/quotes';
                const method = quotes.isEditing.value ? 'PUT' : 'POST';
                const res = await authFetch(url, {
                    method: method,
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(quotes.form)
                });

                if (!res.ok) throw new Error('Error al guardar la cotizacion');
                toastr.success('Cotización guardada');
                quotes.fetchQuotes(); // Recargar lista
                viewListQuotes(); // Volver al listado
            } catch (error) {
                Swal.fire('Error', error.message, 'error');
            }
        };

        const viewListQuotes = () => {
            currentView.value = 'quotes';
            initQuotesTable();
        };

        const convertQuoteToSale = () => {
            if (!quotes.clientSearch.value) return Swal.fire('Falta información', 'Ingresa el nombre del cliente', 'warning');
            if (quotes.form.items.length === 0) return Swal.fire('Vacío', 'Agrega productos a la cotización', 'warning');

            const items = quotes.form.items;
            if (items.length === 0) return Swal.fire('Error', 'La cotización está vacía', 'warning');
            Swal.fire({
                title: '¿Generar Venta?',
                text: "Una vez generada la venta esta cotización sera cerrada!!.",
                icon: 'warning',
                showCancelButton: true,
                confirmButtonText: 'Sí, Generar'
            }).then(async (result) => {
                if (result.isConfirmed) {
                    try {
                        // Aplicamos el carrito
                        pos.activeTab.value.cart = JSON.parse(JSON.stringify(items));
                        // Aplicamops el descuento
                        pos.activeTab.value.discount.amount = quotes.form.discount.value;
                        pos.activeTab.value.discount.reason = quotes.form.discount.title;
                        pos.activeTab.value.discount.type = quotes.form.discount.type;
                        // Aplicamos el usuario
                        pos.selectCustomer(quotes.form.client);
                        // Eliminamos solo si ya es una quote guardada...
                        if (quotes.isEditing.value) {
                            quotes.form.status = 'ready'; // <-- Marcamos como lista
                            const res = await authFetch(`/api/quotes/${quotes.form._id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(quotes.form) });
                            if (!res.ok) throw new Error('Error al guardar la cotizacion');
                            if (res.ok) { toastr.success('Cotización Actualizada con éxito!'); }
                        }
                        // Cambiamos vista...
                        currentView.value = 'pos';
                        toastr.success('Productos cargados al POS');
                    } catch (e) { toastr.error('Error'); }
                }
            });
        };


        // --- LOGICA HORARIOS (BUSINESS HOURS) ---
        const showBusinessHoursModal = ref(false);
        const tempBusinessHour = ref({});
        const currentDayIndex = ref(-1);

        const openBusinessHoursModal = (index) => {
            // Copia profunda para editar sin modificar reactivamente directo
            tempBusinessHour.value = JSON.parse(JSON.stringify(settings.settings.value.businessHours[index]));
            currentDayIndex.value = index;
            showBusinessHoursModal.value = true;
        };

        const saveBusinessHours = async () => {
            if (currentDayIndex.value !== -1) {
                // Actualizar el array local
                settings.settings.value.businessHours[currentDayIndex.value] = tempBusinessHour.value;
                // Guardar todo
                await settings.saveSettings();
                showBusinessHoursModal.value = false;
            }
        };

        // --- LOGICA DESCUENTOS (DISCOUNTS) ---
        const showDiscountModal = ref(false);
        const tempDiscount = reactive({ type: 'amount', value: 0, title: '' });

        const openDiscountModal = () => {
            // Copiar valores actuales al temporal
            const current = quotes.form.discount;
            tempDiscount.type = current.type || 'amount';
            tempDiscount.value = current.value || 0;
            tempDiscount.title = current.title || '';
            showDiscountModal.value = true;
        };

        const confirmDiscount = () => {
            quotes.applyDiscount(tempDiscount.type, tempDiscount.value, tempDiscount.title);
            showDiscountModal.value = false;
        };

        // --- COMPARTIR WHATSAPP ---
        const showShareModal = ref(false);
        const sharePhone = ref('');
        const sharePrefix = ref('52'); // Default México
        const shareContext = ref('ticket'); // 'ticket' | 'quote'

        const openShareModal = () => {
            shareContext.value = 'ticket';
            // Pre-llenar teléfono si el cliente lo tiene
            const customer = orders.selectedOrder.value?.customerId;
            if (customer && customer.phone) {
                sharePhone.value = customer.phone;
            } else {
                sharePhone.value = '';
            }
            showShareModal.value = true;
        };

        const openQuoteShare = (type) => {
            if (type === 'wa') {
                shareContext.value = 'quote';
                sharePhone.value = ''; // No guardamos teléfono en cotización simple
                showShareModal.value = true;
            }
        };

        const confirmShare = () => {
            if (!sharePhone.value) return Swal.fire('Error', 'Ingresa un número', 'warning');
            const fullPhone = `${sharePrefix.value}${sharePhone.value.replace(/[^0-9]/g, '')}`;

            let msg = '';
            if (shareContext.value === 'ticket') {
                const ord = orders.selectedOrder.value;
                msg = `Hola, aquí tienes el detalle de tu compra en ${settings.settings.value.appName || 'FudiPos'} | ID #${ord._id.slice(-6)}:\n\n`;
                ord.items.forEach(i => {
                    msg += `${i.quantity} x ${i.name} - $${(i.price * i.quantity).toFixed(2)}\n`;
                });

                if (ord.discount.amount > 0) {
                    msg += `\nSubtotal: $${ord.subtotal.toFixed(2)}`;
                    msg += `\nDescuento: -$${ord.discount.amount.toFixed(2)}`;
                }

                msg += `\n*TOTAL: $${ord.total.toFixed(2)}*\n\n`;
                msg += `\n** ${settings.settings.value.appName || 'FudiPos'} - Agradece tú preferencia **`;
            } else {
                // Usar la lógica de mensaje de useQuotes
                msg = decodeURIComponent(quotes.sendWhatsApp(settings.settings.value));
            }

            const url = `https://wa.me/${fullPhone}?text=${encodeURIComponent(msg)}`;
            window.open(url, '_blank');
            showShareModal.value = false;
        };

        // Gestion de cajas
        const closeFinanceShift = () => {
            finance.closeAmount.value = 0;
            finance.closeRecounts.debit = 0;
            finance.closeRecounts.credit = 0;
            finance.closeRecounts.transfer = 0;
            finance.closeStatusView.value = 'couts'; 
            finance.showCloseModal.value = true;
        }

        // EXPORTAR CIERRE DE CAJA A EXCEL
        const downloadShiftCloseExcel = () => {
            if (!finance.selectedShift.value) {
                return Swal.fire('Error', 'No hay datos para exportar', 'warning');
            }
            const shift = finance.selectedShift.value;
            const wb = XLSX.utils.book_new();
            const currentDate = new Date();
            const options = {
                day: '2-digit',
                month: '2-digit',
                year: 'numeric'
            };
            /** Creamos la tabla */
            const InnerDiv = document.getElementById('inner-table');
            // --- RESUMEN DE COSTOS ---
            const start = new Date(shift.startTime);
            const end = new Date(shift.endTime);
            const diffMs = end - start;
            const hrs = Math.floor(diffMs / 3600000);
            const mins = Math.floor((diffMs % 3600000) / 60000);
            const duracionStr = `${hrs}h ${mins}m`; 

            // --- BALANCE DE CAJA ---
            // Cálculos para Balance de Caja (EFECTIVO)
            const entries = shift.movements.filter(m => m.type === 'in').reduce((acc, m) => acc + m.amount, 0);
            const exits = shift.movements.filter(m => m.type === 'out').reduce((acc, m) => acc + m.amount, 0);
            const cashSales = (shift.finalCashExpected - shift.initialCash - entries + exits);

            InnerDiv.innerHTML = `<table id="summary_shift" border="1">
                <thead>
                    <tr>
                        <th colspan="8" style="text-align: center;background: #000;display:flex:justify-content:center:align-items:center;">Resumen del Corte</th> 
                    </tr>
                </thead>
                <tbody>
                    <tr>
                        <td>Folio</td>
                        <td>Negocio</td>
                        <td>Cajero</td>
                        <td colspan="2">Apertura</td>
                        <td colspan="2">Cierre</td>
                        <td colspan="2">Duración del turno</td>
                    </tr>
                    <tr>
                        <td>${shift._id.slice(-6).toUpperCase()}</td>
                        <td>${settings.settings.value.appName || 'FudiPos'}</td>
                        <td>${shift.closedBy?.username || 'N/A'}</td>
                        <td colspan="2">${new Date(shift.startTime).toLocaleString()}</td>
                        <td colspan="2">${new Date(shift.endTime).toLocaleString()}</td>
                        <td colspan="2">${duracionStr}</td>
                    </tr>
                    <tr><td></td><td></td><td></td><td></td><td></td><td></td><td></td><td></td></tr>
                    <tr><td></td><td></td><td></td><td></td><td></td><td></td><td></td><td></td></tr>
                    <tr>
                        <th colspan="11" style="text-align: center;background: red;">Balance de Caja</th> 
                    </tr>
                    <tr>
                        <td>Fondo inicial</td>
                        <td colspan="2">+ Ventas en efectivo</td>
                        <td colspan="2">+ Entradas de efectivo</td>
                        <td colspan="2">- Salidas de efectivo</td>
                        <td colspan="2">- Retiros de caja</td>
                        <td>Contado en caja</td>
                        <td>Diferencia</td>
                    </tr>
                    <tr>
                        <td>$${shift.initialCash}</td>
                        <td colspan="2">$${cashSales}</td>
                        <td colspan="2">$${entries}</td>
                        <td colspan="2">$${exits}</td>
                        <td colspan="2">$${shift.cashOut || 0}</td>
                        <td>$${shift.finalCashActual}</td>
                        <td>$${shift.difference}</td>
                    </tr>
                    <tr><td></td><td></td><td></td><td></td><td></td><td></td><td></td><td></td></tr>
                    <tr><td></td><td></td><td></td><td></td><td></td><td></td><td></td><td></td></tr>
                    <tr>
                        <th colspan="12" style="text-align: center;background: red;">Resumen de ventas</th> 
                    </tr>
                    <tr>
                        <td>Efectivo</td>
                        <td colspan="2">Tarjeta Crédito</td>
                        <td colspan="2">Tarjeta Débito</td>
                        <td colspan="2">Transferencias</td>
                        <td colspan="2">Ventas Totales</td>
                        <td>Tickets</td>
                        <td colspan="2">Ticket Promedio</td>
                    </tr>
                    <tr>
                        <td>$${cashSales}</td>
                        <td colspan="2">$${shift.totalCreditCard}</td>
                        <td colspan="2">$${shift.totalDebitCard}</td>
                        <td colspan="2">$${shift.totalTransfer}</td>
                        <td colspan="2">$${ (cashSales + shift.totalCreditCard + shift.totalDebitCard + shift.totalTransfer)}</td>
                        <td>${(shift.totalSalesCash + shift.totalSalesCreditCard + shift.totalSalesDebitCard)}</td>
                        <td colspan="2">$${((shift.finalCashActual + 
                            shift.totalDebitCard + 
                            shift.totalCreditCard + 
                            shift.totalTransfer) / 
                            (shift.totalSalesCash + 
                            shift.totalSalesCreditCard + 
                            shift.totalSalesDebitCard)).toFixed(2)}</td>
                    </tr>
                </tbody>
            </table>`;
             
            const ws1 = XLSX.utils.table_to_sheet(document.getElementById('summary_shift'));

            InnerDiv.innerHTML = `<table id="movements_shift" border="1">
                <thead>
                    <tr>
                        <th colspan="7" style="text-align: center;background: #000;display:flex:justify-content:center:align-items:center;">Movimientos de Caja</th> 
                    </tr>
                </thead>
                <tbody>
                    <tr>
                        <td colspan="2">Hora</td>
                        <td colspan="2">Tipo</td>
                        <td colspan="2">Concepto</td>
                        <td colspan="2">Monto</td>
                        <td colspan="2">Usuario</td>
                    </tr>
                    ${
                        shift.movements.map(mv => `
                            <tr>
                                <td colspan="2">${new Date(mv.date).toTimeString().split(' ')[0]}</td>
                                <td colspan="2">${mv.type === 'in' ? 'Entrada' : 'Salida'}</td>
                                <td colspan="2">${mv.reason}</td>
                                <td colspan="2">$${mv.amount.toFixed(2)}</td>
                                <td colspan="2">${shift.closedBy?.username || 'FudiPos'}</td>
                            </tr>
                        `).join('')
                    }
                </tbody>
            </table>`;
            
            const ws2 = XLSX.utils.table_to_sheet(document.getElementById('movements_shift'));

            XLSX.utils.book_append_sheet(wb, ws1, "Resumen del Corte");
            XLSX.utils.book_append_sheet(wb, ws2, "Movimientos de Caja");

            /* Write the workbook and trigger a download */
            
            const formattedDate = currentDate.toLocaleDateString('es-MX', options);
            XLSX.writeFile(wb, `CorteCaja_${formattedDate}_Caja${shift._id.slice(-8).toUpperCase()}_${shift.closedBy?.username || 'FudiPos'}.xlsx`);

        };

        // --- FUNCIÓN: PROCESAR VENTA Y ABRIR TICKET ---
        const finishSale = async () => {
            await pos.processSale(finance)
            // Si el modal de pago se cierra, asumimos éxito
            if (!pos.showPayModal.value) {
                setTimeout(async () => {
                    // Buscar la última orden para imprimir su ticket
                    await orders.fetchOrders();
                    const lastOrder = orders.ordersList.value[0];

                    if (lastOrder) {
                        ticketData.value = {
                            folio: lastOrder._id.slice(-6).toUpperCase(),
                            customer: lastOrder.customerId ? lastOrder.customerId.name : 'Mostrador',
                            total: lastOrder.total,
                            method: lastOrder.paymentMethod,
                            items: lastOrder.items.map(i => ({ qty: i.quantity, name: i.name, price: i.price }))
                        };
                        showTicketModal.value = true;
                    }
                }, 500); // Pequeño delay para asegurar que BD actualizó
            }
        };

        // --- GESTOR DE CAJA ---
        const viewShiftDetails = async (shift) => {
            finance.isLoading = true; 
            finance.selectedShift.value = shift;
            currentView.value = 'finance_details';
            finance.isLoading = false;
        };

        // --- Back To ShiftList ---
        const backToShiftList = async () => {
            await finance.fetchHistory();
            currentView.value = 'finance_history';
        };
        

        onMounted(async () => {
            auth.checkSession();
            window.addEventListener('address-selected', updateAddressFromMap);
            const path = window.location.pathname; // Ej: /admin/pos
            // Extraer la última parte de la URL
            const parts = path.split('/').filter(p => p);
            const lastPart = parts[parts.length - 1]; // "pos"
            kds.stopPolling();

            if (auth.isAuthenticated.value) {
                const savedRole = localStorage.getItem('role');
                if (savedRole) currentUserRole.value = savedRole;
                await settings.fetchSettings();
                await finance.fetchCurrentStatus();
                await finance.fetchHistory();
                if (currentUserRole.value === 'superadmin') {
                    // Si recargamos y estamos en dashboard, mover a saas
                    if (currentView.value === 'dashboard') currentView.value = 'saas_clients';
                    // Cargar datos según la vista inicial
                    if (currentView.value === 'saas_clients') saas.fetchBusinesses();
                    if (currentView.value === 'ads') banners.fetchBanners();
                    if (currentView.value === 'media') media.fetchMedia();
                    if (currentView.value === 'settings') settings.fetchSettings();
                } else {
                    // Validamos si el role es Cajero unicamente vera el POS
                    if (currentUserRole.value === 'cashier') {
                        currentView.value = 'pos';
                        products.fetchProducts();
                        if (window.innerWidth < 768) {
                            mobileMenuOpen.value = false;
                            collapsed.value = false;
                        } else {
                            mobileMenuOpen.value = true;
                            collapsed.value = true;
                        }
                    }else if(currentUserRole.value === 'cook'){
                        currentView.value = 'kds';
                        kds.startPolling();
                        if (window.innerWidth < 768) {
                            mobileMenuOpen.value = false;
                            collapsed.value = false;
                        } else {
                            mobileMenuOpen.value = true;
                            collapsed.value = true;
                        }
                    } else {
                        // Si la URL es solo /admin, vamos al dashboard
                        if (path.endsWith('/admin') || path.endsWith('/admin/')) {
                            currentView.value = 'dashboard';
                        } else {
                            // Buscar si existe una vista con ese nombre
                            const found = businessMenu.value.find(i => i.view === lastPart);

                            if (lastPart == 'pos') {
                                if (settings.settings.value.plan == 'free') {
                                    const Toast = Swal.mixin({ toast: true, position: 'bottom-end', showConfirmButton: false, timer: 3500 });
                                    Toast.fire({ icon: 'error', title: 'Sección Bloqueada', text: "Por favor activa un plan PRO" });
                                    currentView.value = "dashboard";
                                    // 1. CAMBIAR LA URL VISUALMENTE
                                    const newUrl = `/admin/dashboard`;
                                    window.history.pushState({ view: currentView.value }, '', newUrl);
                                } else {
                                    currentView.value = 'pos';
                                }
                            } else {
                                if (found) {
                                    if (found.locked == undefined) {
                                        currentView.value = found.view;
                                    } else {
                                        const Toast = Swal.mixin({ toast: true, position: 'bottom-end', showConfirmButton: false, timer: 3500 });
                                        Toast.fire({ icon: 'error', title: 'Sección Bloqueada', text: "Por favor activa un plan PRO" });
                                        currentView.value = "dashboard";
                                        // 1. CAMBIAR LA URL VISUALMENTE
                                        const newUrl = `/admin/dashboard`;
                                        window.history.pushState({ view: currentView.value }, '', newUrl);
                                    }
                                } else {
                                    // Buscamos por children
                                    const childrenFound = businessMenu.value.find(c => c.children && c.children.find(cx => cx.view === lastPart));
                                    if (childrenFound) {
                                        const child = childrenFound.children.find(cx => cx.view === lastPart);
                                        if (child) {
                                            currentView.value = child.view
                                            toggleSubmenu(childrenFound)
                                        };
                                    }
                                }
                            }


                            // Cargar datos iniciales de negocio
                            if (currentView.value === 'pos') {
                                products.fetchProducts();
                                if (window.innerWidth < 768) {
                                    mobileMenuOpen.value = false;
                                    collapsed.value = false;
                                } else {
                                    mobileMenuOpen.value = true;
                                    collapsed.value = true;
                                }
                            }
                            if (currentView.value === 'dashboard') analytics.fetchDashboardStats();
                            if (currentView.value === 'media') media.fetchMedia();
                            if (currentView.value === 'ads') { banners.isUploadingBanner.value = false; banners.fetchBanners(); }
                            if (currentView.value === 'loyalty') useloyalty.fetchProgram();
                            if (currentView.value === 'products') {
                                products.isUploadingProductImg.value = false;
                                products.fetchProducts();
                                initProductsTable();
                            }
                            if (currentView.value === 'addons') addons.fetchAddons();
                            if (currentView.value === 'categories') categories.isUploadingCatImg.value = false; categories.fetchCategories();
                            if (currentView.value === 'orders') orders.fetchOrders();
                            if (currentView.value === 'finance') {
                                finance.fetchCurrentStatus();
                                finance.fetchHistory();
                            }
                            if (currentView.value === 'users') users.fetchUsers();
                            if (currentView.value === 'settings') {
                                settings.fetchSettings();
                            }
                            if (currentView.value === 'quotes'){
                                quotes.fetchQuotes();
                                products.fetchProducts();
                                users.fetchUsers();
                            }
                            if (currentView.value === 'kds') {
                                kds.startPolling();
                                if (window.innerWidth < 768) {
                                    mobileMenuOpen.value = false;
                                    collapsed.value = false;
                                } else {
                                    mobileMenuOpen.value = true;
                                    collapsed.value = true;
                                }
                            }
                            if (currentView.value === 'staff') staff.fetchStaff();
                        }
                    }
                }
            }
        });


        // 4. MANEJAR BOTÓN "ATRÁS" DEL NAVEGADOR
        window.onpopstate = (event) => {
            if (event.state && event.state.view) {
                currentView.value = event.state.view;
            } else {
                // Fallback si no hay estado (ej: volver al inicio)
                currentView.value = 'dashboard';
            }
        };

        // Función para abrir la PWA
        const openPWA = () => {
            if (settings.settings.value && settings.settings.value.slug) {
                const url = '/' + settings.settings.value.slug;
                window.open(url, '_blank', 'width=400,height=850,scrollbars=yes,resizable=yes');
            } else {
                alert('El slug del negocio no está configurado');
            }
        };

        return {
            collapsed, mobileMenuOpen, currentView,
            activeMenuItems, currentUserRole,
            openPWA,
            availableCategoriesStore, toggleCategory,
            toggleSidebar, navigate, toggleSubmenu,
            ...analytics, // Analitica general
            ...settings, // Configuraciones
            ...auth,   // isAuthenticated, username, login, logout, Theme...
            ...media,  // mediaFiles, uploadFile, deleteFile...
            ...banners, // banners, saveBanner...
            ...products, // products, saveProduct...
            ...categories, // categoriesList, saveCategory...
            ...addons, // addonsList, saveAddon, addOptionRow...
            ...saas, // Multinegocios
            ...useloyalty, // Loyalty
            kds, // KDS Expuesto
            // POS
            pos, showItemDetailsModal, selectedCartItem, openItemDetails,finishSale,
            selectedItemAddonGroups, selectedItemUnitPrice, toggleAddonOption, isOptionSelected,
            users,
            finance, closeFinanceShift,viewShiftDetails, backToShiftList, downloadShiftCloseExcel, // Exportar
            orders,
            quotes,
            saveQuote,
            viewListQuotes,
            viewListOrders,
            downloadSalesExcel, printThermalTicket, generatePDF,
            startNewQuote, editQuote, convertQuoteToSale, openQuoteShare,
            showShareModal, sharePhone, sharePrefix, openShareModal, confirmShare,
            showDiscountModal, tempDiscount, openDiscountModal, confirmDiscount,
            // Impresion de Tickets
            showTicketModal, ticketData, openTicketPreview, printTicketNow,            // Horarios
            showBusinessHoursModal, tempBusinessHour, openBusinessHoursModal, saveBusinessHours,
            // Map Picker
            showMapModal, mapInstance, tempAddress, openMapModal, confirmLocation,
            // EXPONEMOS STAFF
            staff,
        };
    }
}).mount('#app');
