const bcrypt = require('bcryptjs');

router.post('/profile/avatar', middlewareLocal, (req, res) => {
    try {
        const { avatar } = req.body;
        const datos = db.leerDatos();
        const userIndex = datos.usuarios.findIndex(u => u.id === req.userId);

        if (userIndex === -1) {
            return res.status(404).json({ error: "Usuario no encontrado" });
        }

        datos.usuarios[userIndex].avatar = avatar;
        db.guardarDatos(datos);

        res.json({ mensaje: "Avatar actualizado", avatar });
    } catch (err) {
        res.status(500).json({ error: "Error al guardar avatar: " + err.message });
    }
});

router.post('/profile/update', middlewareLocal, (req, res) => {
    try {
        const { username, email, alias, passwordCurr, passwordNew } = req.body;
        const datos = db.leerDatos();
        
        const userIndex = datos.usuarios.findIndex(u => u.id === req.userId);
        if (userIndex === -1) {
            return res.status(404).json({ error: "Usuario no encontrado" });
        }

        const usuarioActual = datos.usuarios[userIndex];

        const passwordValido = bcrypt.compareSync(passwordCurr, usuarioActual.password);
        if (!passwordValido) {
            return res.status(401).json({ error: "La contrasena actual es incorrecta" });
        }

        if (username && username.toLowerCase() !== usuarioActual.username.toLowerCase()) {
            const userExiste = datos.usuarios.find(u => u.username.toLowerCase() === username.toLowerCase());
            if (userExiste) return res.status(400).json({ error: "El nombre de usuario ya esta en uso" });
            usuarioActual.username = username;
        }

        if (email && email.toLowerCase() !== (usuarioActual.email || '').toLowerCase()) {
            const emailExiste = datos.usuarios.find(u => (u.email || '').toLowerCase() === email.toLowerCase());
            if (emailExiste) return res.status(400).json({ error: "El correo electronico ya esta registrado" });
            usuarioActual.email = email;
        }

        if (alias && alias.toLowerCase() !== (usuarioActual.alias || '').toLowerCase()) {
            if (alias.includes('@') || alias.includes('#')) {
                return res.status(400).json({ error: "El alias no puede contener @ ni #" });
            }
            const aliasExiste = datos.usuarios.find(u => (u.alias || '').toLowerCase() === alias.toLowerCase());
            if (aliasExiste) return res.status(400).json({ error: "El alias ya esta siendo utilizado" });
            usuarioActual.alias = alias;
        }

        if (passwordNew && passwordNew.trim() !== "") {
            usuarioActual.password = bcrypt.hashSync(passwordNew, 8);
        }

        datos.usuarios[userIndex] = usuarioActual;
        db.guardarDatos(datos);

        res.json({ mensaje: "Perfil modificado correctamente" });
    } catch (err) {
        res.status(500).json({ error: "Error interno: " + err.message });
    }
});