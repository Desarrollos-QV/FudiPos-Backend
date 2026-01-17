const mongoose = require('mongoose');
const dotenv = require('dotenv');
const User = require('./models/User'); // Asegúrate que la ruta al modelo sea correcta

// Cargar variables de entorno
dotenv.config();

const createSuperAdmin = async () => {
    try {
        // 1. Conectar a la Base de Datos
        const dbUri = process.env.MONGO_URI || 'mongodb://localhost:27017/menu_digital';
        await mongoose.connect(dbUri);
        console.log('🔌 Conectado a MongoDB...');

        // 2. Verificar si ya existe un SuperAdmin
        const adminExists = await User.findOne({ role: 'superadmin' });

        if (adminExists) {
            console.log('⚠️ Ya existe un SuperAdmin en la base de datos.');
            process.exit(0);
        }

        // 3. Crear el SuperAdmin
        // Puedes cambiar estas credenciales por las que tú quieras
        const superAdmin = new User({
            username: 'admin',
            email: 'admin@fudiapp.com',
            password: 'admin123', // El modelo la encriptará automáticamente
            role: 'superadmin',
            businessId: null // El SuperAdmin no pertenece a ningún negocio
        });

        await superAdmin.save();

        console.log('✅ ¡SuperAdmin creado con éxito!');
        console.log('👤 Usuario: admin');
        console.log('🔑 Contraseña: admin123');

    } catch (error) {
        console.error('❌ Error:', error);
    } finally {
        // 4. Cerrar conexión
        mongoose.connection.close();
        process.exit(0);
    }
};

createSuperAdmin();