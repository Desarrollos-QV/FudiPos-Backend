const User = require('../models/User');
const bcrypt = require('bcryptjs');

// Función para normalizar el username (slug)
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

// OBTENER EQUIPO DEL NEGOCIO
exports.getStaff = async (req, res) => {
    try {
        // Buscamos usuarios que pertenezcan al mismo negocio que el admin logueado
        // Excluimos al propio admin de la lista si se desea, o lo incluimos.
        // Aquí traemos todos MENOS el usuario actual para evitar que se auto-elimine
        const staff = await User.find({ 
            businessId: req.user.businessId,
            _id: { $ne: req.user._id } 
        }).select('-password').populate('businessId', 'name') // No devolvemos la contraseña

        res.json(staff);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error al obtener el equipo' });
    }
};

// CREAR NUEVO MIEMBRO
exports.createStaff = async (req, res) => {
    try {
        let { email, username, password, pin, role } = req.body;
        username = parseUsername(username); // Si no viene username, usamos el name

        // Validar si el usuario ya existe
        const existingUser = await User.findOne({ username });
        if (existingUser) {
            return res.status(400).json({ message: 'El nombre de usuario ya está en uso' });
        }

        // Encriptar contraseña
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        const newUser = new User({
            email,
            username,
            password, //: hashedPassword,
            pin, // El PIN puede ir en texto plano si es de 4 dígitos para POS, o hasheado según tu seguridad
            role,
            businessId: req.user.businessId, // Vincular al negocio del creador
            active: true
        });

        await newUser.save();
        res.status(201).json({ message: 'Usuario creado exitosamente', user: newUser });

    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error al crear usuario' });
    }
};

// ACTUALIZAR MIEMBRO
exports.updateStaff = async (req, res) => {
    try {
        const { email, username, pin, role, password } = req.body;
        const userId = req.params.id;

        const user = await User.findOne({ _id: userId, businessId: req.user.businessId });
        if (!user) return res.status(404).json({ message: 'Usuario no encontrado' });

        user.email = email || user.email;
        user.username = username || user.username;
        user.pin = pin || user.pin;
        user.role = role || user.role;

        // Solo actualizar contraseña si se envía una nueva
        if (password && password.trim() !== '') {
            const salt = await bcrypt.genSalt(10);
            user.password = password; //await bcrypt.hash(password, salt);
        }

        await user.save();
        res.json({ message: 'Usuario actualizado', user });

    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error al actualizar' });
    }
};

// CAMBIAR ESTADO (Activar/Desactivar)
exports.toggleStatus = async (req, res) => {
    try {
        const user = await User.findOne({ _id: req.params.id, businessId: req.user.businessId });
        if (!user) return res.status(404).json({ message: 'Usuario no encontrado' });

        user.active = !user.active;
        await user.save();

        res.json({ message: `Usuario ${user.active ? 'activado' : 'desactivado'}`, active: user.active });

    } catch (error) {
        res.status(500).json({ message: 'Error al cambiar estado' });
    }
};

// ELIMINAR MIEMBRO
exports.deleteStaff = async (req, res) => {
    try {
        const result = await User.deleteOne({ _id: req.params.id, businessId: req.user.businessId });
        if (result.deletedCount === 0) return res.status(404).json({ message: 'Usuario no encontrado' });

        res.json({ message: 'Usuario eliminado correctamente' });
    } catch (error) {
        res.status(500).json({ message: 'Error al eliminar usuario' });
    }
};