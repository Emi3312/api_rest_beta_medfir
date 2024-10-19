require('dotenv').config();
const express = require('express');
const mysql = require('mysql2');
const fs = require('fs');
const bcrypt = require('bcrypt');
const multer = require('multer');

const connection = mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    port: process.env.DB_PORT,
    ssl: {
        ca: fs.readFileSync('ca.pem')
    },
    typeCast: function (field, next) {
        if (field.type === 'BLOB' && field.table === 'PACIENTES' && (field.name === 'ALERTA_PACIENTE' || field.name === 'DIRECCION')) {
            return field.string();
        }
        return next();
    }
});

connection.connect((err) => {
    if (err) {
        console.error('Error conectando a la base de datos:', err);
        return;
    }
    console.log('Conexión a la base de datos establecida.');
});

const app = express();
app.use(express.json());

// Configuración de multer para manejar archivos
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

// Endpoint para listar los nombres de las tablas
app.get('/tablas', (req, res) => {
    const query = "SHOW TABLES";
    connection.query(query, (err, results) => {
        if (err) {
            return res.status(500).send('Error obteniendo las tablas');
        }
        const tables = results.map(row => Object.values(row)[0]);
        res.json(tables);
    });
});

// Endpoint para listar los usuarios
app.get('/usuarios', (req, res) => {
    const query = "SELECT * FROM USUARIOS";
    connection.query(query, (err, results) => {
        if (err) {
            return res.status(500).send('Error obteniendo los usuarios');
        }
        res.json(results);
    });
});

// Endpoint para listar los pacientes
app.get('/pacientes', (req, res) => {
    const query = "SELECT * FROM PACIENTES";
    connection.query(query, (err, results) => {
        if (err) {
            return res.status(500).send('Error obteniendo los pacientes');
        }
        res.json(results);
    });
});

// Endpoint para listar las citas
app.get('/citas', (req, res) => {
    const query = "SELECT * FROM CITAS";
    connection.query(query, (err, results) => {
        if (err) {
            return res.status(500).send('Error obteniendo las citas');
        }
        res.json(results);
    });
});

// Endpoint para listar las consultas
app.get('/consultas', (req, res) => {
    const query = "SELECT * FROM CONSULTAS";
    connection.query(query, (err, results) => {
        if (err) {
            return res.status(500).send('Error obteniendo las consultas');
        }
        res.json(results);
    });
});

// Endpoint para listar las recetas
app.get('/recetas', (req, res) => {
    const query = "SELECT * FROM RECETAS";
    connection.query(query, (err, results) => {
        if (err) {
            return res.status(500).send('Error obteniendo las recetas');
        }
        res.json(results);
    });
});

// Obtener un usuario por ID
app.get('/usuarios/:id', (req, res) => {
    const { id } = req.params;
    const query = "SELECT * FROM USUARIOS WHERE ID_USUARIO = ?";
    connection.query(query, [id], (err, results) => {
        if (err) {
            return res.status(500).send('Error obteniendo el usuario');
        }
        res.json(results);
    });
});

// Obtener un paciente por ID
app.get('/pacientes/:id', (req, res) => {
    const { id } = req.params;
    const query = "SELECT * FROM PACIENTES WHERE ID_PACIENTE = ?";
    connection.query(query, [id], (err, results) => {
        if (err) {
            return res.status(500).send('Error obteniendo el paciente');
        }
        res.json(results);
    });
});

// Obtener las citas de un paciente específico
app.get('/citas/paciente/:id', (req, res) => {
    const { id } = req.params;
    const query = "SELECT * FROM CITAS WHERE ID_PACIENTE = ?";
    connection.query(query, [id], (err, results) => {
        if (err) {
            return res.status(500).send('Error obteniendo las citas del paciente');
        }
        res.json(results);
    });
});

// Obtener las consultas de un paciente específico
app.get('/consultas/paciente/:id', (req, res) => {
    const { id } = req.params;
    const query = "SELECT * FROM CONSULTAS WHERE ID_PACIENTE = ?";
    connection.query(query, [id], (err, results) => {
        if (err) {
            return res.status(500).send('Error obteniendo las consultas del paciente');
        }
        res.json(results);
    });
});

// Obtener las recetas de un paciente específico
app.get('/recetas/paciente/:id', (req, res) => {
    const { id } = req.params;
    const query = "SELECT * FROM RECETAS WHERE ID_PACIENTE = ?";
    connection.query(query, [id], (err, results) => {
        if (err) {
            return res.status(500).send('Error obteniendo las recetas del paciente');
        }
        res.json(results);
    });
});

// Obtener las recetas asociadas a una consulta específica
app.get('/recetas/consulta/:id', (req, res) => {
    const { id } = req.params;
    const query = "SELECT * FROM RECETAS WHERE ID_CONSULTA = ?";
    connection.query(query, [id], (err, results) => {
        if (err) {
            return res.status(500).send('Error obteniendo las recetas de la consulta');
        }
        res.json(results);
    });
});

// Obtener todas las recetas de un médico
app.get('/recetas/medico/:id', (req, res) => {
    const { id } = req.params;
    const query = "SELECT * FROM RECETAS WHERE ID_USUARIO = ?";
    connection.query(query, [id], (err, results) => {
        if (err) {
            return res.status(500).send('Error obteniendo las recetas del médico');
        }
        res.json(results);
    });
});

// Obtener todos los documentos
app.get('/documentos', (req, res) => {
    const query = "SELECT ID_DOCUMENTO, NOMBRE_DOCUMENTO FROM DOCUMENTOS";
    connection.query(query, (err, results) => {
        if (err) {
            return res.status(500).send('Error obteniendo los documentos');
        }
        res.json(results);
    });
});

// Obtener(descargar) un documento
app.get('/documentos/:id/descargar', (req, res) => {
    const { id } = req.params;

    const query = `
        SELECT NOMBRE_DOCUMENTO, DOCUMENTO, TIPO_DOCUMENTO
        FROM DOCUMENTOS
        WHERE ID_DOCUMENTO = ?
    `;

    connection.query(query, [id], (err, results) => {
        if (err) {
            console.error('Error al obtener el documento:', err);
            return res.status(500).send('Error al obtener el documento');
        }

        if (results.length === 0) {
            return res.status(404).send('Documento no encontrado');
        }

        const documento = results[0];
        const nombreArchivo = documento.NOMBRE_DOCUMENTO;
        const tipoDocumento = documento.TIPO_DOCUMENTO;
        const contenido = documento.DOCUMENTO; // Debe ser un Buffer

        // Configurar el tipo de contenido basado en el tipo de documento
        let contentType = 'application/octet-stream'; // Tipo de contenido por defecto
        switch (tipoDocumento.toLowerCase()) {
            case 'pdf':
                contentType = 'application/pdf';
                break;
            case 'jpg':
            case 'jpeg':
                contentType = 'image/jpeg';
                break;
            case 'png':
                contentType = 'image/png';
                break;
            case 'doc':
                contentType = 'application/msword';
                break;
            case 'docx':
                contentType = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
                break;
            
        }

        res.setHeader('Content-Type', contentType);
        res.setHeader('Content-Disposition', `attachment; filename="${nombreArchivo}"`);
        res.end(contenido); // Enviar el Buffer directamente
    });
});


/* ===================== ENDPOINTS POST ===================== */

// Crear un nuevo usuario
app.post('/usuarios', async (req, res) => {
    const { NOMBRE, APELLIDOS, EMAIL, TELEFONO, ROL, CONTRASENA } = req.body;

    if (!NOMBRE || !APELLIDOS || !EMAIL || !ROL || !CONTRASENA) {
        return res.status(400).send('Faltan campos obligatorios');
    }

    // Validar ROL
    const validRoles = ['MEDICO', 'TERAPEUTA', 'ADMIN', 'DEVOP'];
    if (!validRoles.includes(ROL)) {
        return res.status(400).send('Rol inválido');
    }

    // Hash de la contraseña
    try {
        const CONTRASENA_HASH = await bcrypt.hash(CONTRASENA, 10);

        const query = "INSERT INTO USUARIOS (NOMBRE, APELLIDOS, EMAIL, TELEFONO, ROL, CONTRASENA_HASH) VALUES (?, ?, ?, ?, ?, ?)";
        const values = [NOMBRE, APELLIDOS, EMAIL, TELEFONO, ROL, CONTRASENA_HASH];

        connection.query(query, values, (err, results) => {
            if (err) {
                console.error('Error al crear el usuario:', err);
                return res.status(500).send('Error al crear el usuario');
            }
            res.status(201).send('Usuario creado exitosamente');
        });
    } catch (error) {
        console.error('Error al hashear la contraseña:', error);
        res.status(500).send('Error al procesar la solicitud');
    }
});

// Crear un nuevo paciente
app.post('/pacientes', (req, res) => {
    const {
        NOMBRE,
        APELLIDOS,
        EMAIL,
        TELEFONO,
        FECHA_NACIMIENTO,
        ALERTA_PACIENTE,
        SEXO,
        PESO_KG,
        DIRECCION
    } = req.body;

    if (!NOMBRE || !APELLIDOS) {
        return res.status(400).send('Faltan campos obligatorios');
    }

    // Validar SEXO
    const validSexo = ['M', 'F'];
    if (SEXO && !validSexo.includes(SEXO)) {
        return res.status(400).send('Sexo inválido');
    }

    const query = `
    INSERT INTO PACIENTES (NOMBRE, APELLIDOS, EMAIL, TELEFONO, FECHA_NACIMIENTO, ALERTA_PACIENTE, SEXO, PESO_KG, DIRECCION)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `;
    const values = [NOMBRE, APELLIDOS, EMAIL, TELEFONO, FECHA_NACIMIENTO, ALERTA_PACIENTE, SEXO, PESO_KG, DIRECCION];

    connection.query(query, values, (err, results) => {
        if (err) {
            console.error('Error al crear el paciente:', err);
            return res.status(500).send('Error al crear el paciente');
        }
        res.status(201).send('Paciente creado exitosamente');
    });
});

// Crear una nueva cita
app.post('/citas', (req, res) => {
    const {
        FECHA,
        HORA,
        ESTADO,
        NOTAS_ADICIONALES,
        TIEMPO_ANTES_CITA_DIAS,
        ID_PACIENTE,
        ID_USUARIO
    } = req.body;

    if (!FECHA || !HORA || !ESTADO || !ID_PACIENTE || !ID_USUARIO) {
        return res.status(400).send('Faltan campos obligatorios');
    }

    // Validar ESTADO
    const validEstado = ['ACTIVO', 'CANCELADO'];
    if (!validEstado.includes(ESTADO)) {
        return res.status(400).send('Estado inválido');
    }

    // Validar TIEMPO_ANTES_CITA_DIAS
    const validTiempoAntes = ['1D', '2D', '3D', '4D', '5D', '6D', '1SEM'];
    if (TIEMPO_ANTES_CITA_DIAS && !validTiempoAntes.includes(TIEMPO_ANTES_CITA_DIAS)) {
        return res.status(400).send('Tiempo antes de cita inválido');
    }

    // Verificar si el paciente existe
    const queryPaciente = "SELECT ID_PACIENTE FROM PACIENTES WHERE ID_PACIENTE = ?";
    connection.query(queryPaciente, [ID_PACIENTE], (err, pacienteResults) => {
        if (err) {
            console.error('Error al verificar el paciente:', err);
            return res.status(500).send('Error al procesar la solicitud');
        }
        if (pacienteResults.length === 0) {
            return res.status(400).send('ID_PACIENTE no existe');
        }

        // Verificar si el usuario existe
        const queryUsuario = "SELECT ID_USUARIO FROM USUARIOS WHERE ID_USUARIO = ?";
        connection.query(queryUsuario, [ID_USUARIO], (err, usuarioResults) => {
            if (err) {
                console.error('Error al verificar el usuario:', err);
                return res.status(500).send('Error al procesar la solicitud');
            }
            if (usuarioResults.length === 0) {
                return res.status(400).send('ID_USUARIO no existe');
            }

            // Insertar la nueva cita
            const query = `
        INSERT INTO CITAS (FECHA, HORA, ESTADO, NOTAS_ADICIONALES, TIEMPO_ANTES_CITA_DIAS, ID_PACIENTE, ID_USUARIO)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `;
            const values = [FECHA, HORA, ESTADO, NOTAS_ADICIONALES, TIEMPO_ANTES_CITA_DIAS, ID_PACIENTE, ID_USUARIO];

            connection.query(query, values, (err, results) => {
                if (err) {
                    console.error('Error al crear la cita:', err);
                    return res.status(500).send('Error al crear la cita');
                }
                res.status(201).send('Cita creada exitosamente');
            });
        });
    });
});

// Crear una nueva consulta
app.post('/consultas', (req, res) => {
    const {
        FECHA_HORA,
        EXPLORACION_MEDICA,
        EXPLORACION_FISICA,
        DIAGNOSTICO,
        COBRO_CONSULTA,
        ID_PACIENTE,
        ID_USUARIO
    } = req.body;

    if (!FECHA_HORA || !ID_PACIENTE || !ID_USUARIO) {
        return res.status(400).send('Faltan campos obligatorios');
    }

    // Verificar si el paciente existe
    const queryPaciente = "SELECT ID_PACIENTE FROM PACIENTES WHERE ID_PACIENTE = ?";
    connection.query(queryPaciente, [ID_PACIENTE], (err, pacienteResults) => {
        if (err) {
            console.error('Error al verificar el paciente:', err);
            return res.status(500).send('Error al procesar la solicitud');
        }
        if (pacienteResults.length === 0) {
            return res.status(400).send('ID_PACIENTE no existe');
        }

        // Verificar si el usuario existe
        const queryUsuario = "SELECT ID_USUARIO FROM USUARIOS WHERE ID_USUARIO = ?";
        connection.query(queryUsuario, [ID_USUARIO], (err, usuarioResults) => {
            if (err) {
                console.error('Error al verificar el usuario:', err);
                return res.status(500).send('Error al procesar la solicitud');
            }
            if (usuarioResults.length === 0) {
                return res.status(400).send('ID_USUARIO no existe');
            }

            // Insertar la nueva consulta
            const query = `
        INSERT INTO CONSULTAS (FECHA_HORA, EXPLORACION_MEDICA, EXPLORACION_FISICA, DIAGNOSTICO, COBRO_CONSULTA, ID_PACIENTE, ID_USUARIO)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `;
            const values = [FECHA_HORA, EXPLORACION_MEDICA, EXPLORACION_FISICA, DIAGNOSTICO, COBRO_CONSULTA, ID_PACIENTE, ID_USUARIO];

            connection.query(query, values, (err, results) => {
                if (err) {
                    console.error('Error al crear la consulta:', err);
                    return res.status(500).send('Error al crear la consulta');
                }
                res.status(201).send('Consulta creada exitosamente');
            });
        });
    });
});

// Crear una nueva receta
app.post('/recetas', (req, res) => {
    const {
        CONTENIDO,
        FECHA_EMISION,
        ID_CONSULTA,
        ID_USUARIO,
        ID_PACIENTE
    } = req.body;

    if (!CONTENIDO || !FECHA_EMISION || !ID_USUARIO || !ID_PACIENTE) {
        return res.status(400).send('Faltan campos obligatorios');
    }

    // Verificar si el paciente existe
    const queryPaciente = "SELECT ID_PACIENTE FROM PACIENTES WHERE ID_PACIENTE = ?";
    connection.query(queryPaciente, [ID_PACIENTE], (err, pacienteResults) => {
        if (err) {
            console.error('Error al verificar el paciente:', err);
            return res.status(500).send('Error al procesar la solicitud');
        }
        if (pacienteResults.length === 0) {
            return res.status(400).send('ID_PACIENTE no existe');
        }

        // Verificar si el usuario existe
        const queryUsuario = "SELECT ID_USUARIO FROM USUARIOS WHERE ID_USUARIO = ?";
        connection.query(queryUsuario, [ID_USUARIO], (err, usuarioResults) => {
            if (err) {
                console.error('Error al verificar el usuario:', err);
                return res.status(500).send('Error al procesar la solicitud');
            }
            if (usuarioResults.length === 0) {
                return res.status(400).send('ID_USUARIO no existe');
            }

            // Si se proporciona ID_CONSULTA, verificar si existe
            if (ID_CONSULTA) {
                const queryConsulta = "SELECT ID_CONSULTA FROM CONSULTAS WHERE ID_CONSULTA = ?";
                connection.query(queryConsulta, [ID_CONSULTA], (err, consultaResults) => {
                    if (err) {
                        console.error('Error al verificar la consulta:', err);
                        return res.status(500).send('Error al procesar la solicitud');
                    }
                    if (consultaResults.length === 0) {
                        return res.status(400).send('ID_CONSULTA no existe');
                    }
                    // Insertar la nueva receta
                    insertReceta();
                });
            } else {
                // Insertar la nueva receta
                insertReceta();
            }

            function insertReceta() {
                const query = `
          INSERT INTO RECETAS (CONTENIDO, FECHA_EMISION, ID_CONSULTA, ID_USUARIO, ID_PACIENTE)
          VALUES (?, ?, ?, ?, ?)
        `;
                const values = [CONTENIDO, FECHA_EMISION, ID_CONSULTA, ID_USUARIO, ID_PACIENTE];

                connection.query(query, values, (err, results) => {
                    if (err) {
                        console.error('Error al crear la receta:', err);
                        return res.status(500).send('Error al crear la receta');
                    }
                    res.status(201).send('Receta creada exitosamente');
                });
            }
        });
    });
});

// Crear un nuevo documento para un paciente
app.post('/documentos', upload.single('DOCUMENTO'), (req, res) => {
    const {
        TIPO_DOCUMENTO,
        NOMBRE_DOCUMENTO,
        FECHA_SUBIDA,
        DESCRIPCION,
        ID_PACIENTE
    } = req.body;

    const documentoFile = req.file;

    if (!TIPO_DOCUMENTO || !NOMBRE_DOCUMENTO || !DESCRIPCION || !ID_PACIENTE || !documentoFile) {
        return res.status(400).send('Faltan campos obligatorios');
    }

    const fechaSubida = FECHA_SUBIDA || new Date();

    // Verificar si el paciente existe
    const queryPaciente = "SELECT ID_PACIENTE FROM PACIENTES WHERE ID_PACIENTE = ?";
    connection.query(queryPaciente, [ID_PACIENTE], (err, pacienteResults) => {
        if (err) {
            console.error('Error al verificar el paciente:', err);
            return res.status(500).send('Error al procesar la solicitud');
        }
        if (pacienteResults.length === 0) {
            return res.status(400).send('ID_PACIENTE no existe');
        }

        // Insertar el nuevo documento
        const query = `
      INSERT INTO DOCUMENTOS (TIPO_DOCUMENTO, NOMBRE_DOCUMENTO, FECHA_SUBIDA, DOCUMENTO, DESCRIPCION, ID_PACIENTE)
      VALUES (?, ?, ?, ?, ?, ?)
    `;
        const values = [TIPO_DOCUMENTO, NOMBRE_DOCUMENTO, fechaSubida, documentoFile.buffer, DESCRIPCION, ID_PACIENTE];

        connection.query(query, values, (err, results) => {
            if (err) {
                console.error('Error al crear el documento:', err);
                return res.status(500).send('Error al crear el documento');
            }
            res.status(201).send('Documento creado exitosamente');
        });
    });
});

// ===================== FIN ENDPOINTS POST ===================== //

// ===================== ENDPOINTS PUT ===================== //


// Actualizar un usuario existente
app.put('/usuarios/:id', async (req, res) => {
    const { id } = req.params;
    const { NOMBRE, APELLIDOS, EMAIL, TELEFONO, ROL, CONTRASENA } = req.body;

    // Verificar si el usuario existe
    const queryUsuario = "SELECT * FROM USUARIOS WHERE ID_USUARIO = ?";
    connection.query(queryUsuario, [id], async (err, usuarioResults) => {
        if (err) {
            console.error('Error al verificar el usuario:', err);
            return res.status(500).send('Error al procesar la solicitud');
        }
        if (usuarioResults.length === 0) {
            return res.status(404).send('Usuario no encontrado');
        }

        // Preparar campos para actualización
        let fields = [];
        let values = [];

        if (NOMBRE) {
            fields.push("NOMBRE = ?");
            values.push(NOMBRE);
        }
        if (APELLIDOS) {
            fields.push("APELLIDOS = ?");
            values.push(APELLIDOS);
        }
        if (EMAIL) {
            fields.push("EMAIL = ?");
            values.push(EMAIL);
        }
        if (TELEFONO) {
            fields.push("TELEFONO = ?");
            values.push(TELEFONO);
        }
        if (ROL) {
            const validRoles = ['MEDICO', 'TERAPEUTA', 'ADMIN', 'DEVOP'];
            if (!validRoles.includes(ROL)) {
                return res.status(400).send('Rol inválido');
            }
            fields.push("ROL = ?");
            values.push(ROL);
        }
        if (CONTRASENA) {
            try {
                const CONTRASENA_HASH = await bcrypt.hash(CONTRASENA, 10);
                fields.push("CONTRASENA_HASH = ?");
                values.push(CONTRASENA_HASH);
            } catch (error) {
                console.error('Error al hashear la contraseña:', error);
                return res.status(500).send('Error al procesar la solicitud');
            }
        }

        if (fields.length === 0) {
            return res.status(400).send('No hay campos para actualizar');
        }

        values.push(id);
        const query = `UPDATE USUARIOS SET ${fields.join(', ')} WHERE ID_USUARIO = ?`;

        connection.query(query, values, (err, results) => {
            if (err) {
                console.error('Error al actualizar el usuario:', err);
                return res.status(500).send('Error al actualizar el usuario');
            }
            res.status(200).send('Usuario actualizado exitosamente');
        });
    });
});

// Actualizar un paciente existente
app.put('/pacientes/:id', (req, res) => {
    const { id } = req.params;
    const {
        NOMBRE,
        APELLIDOS,
        EMAIL,
        TELEFONO,
        FECHA_NACIMIENTO,
        ALERTA_PACIENTE,
        SEXO,
        PESO_KG,
        DIRECCION
    } = req.body;

    // Verificar si el paciente existe
    const queryPaciente = "SELECT * FROM PACIENTES WHERE ID_PACIENTE = ?";
    connection.query(queryPaciente, [id], (err, pacienteResults) => {
        if (err) {
            console.error('Error al verificar el paciente:', err);
            return res.status(500).send('Error al procesar la solicitud');
        }
        if (pacienteResults.length === 0) {
            return res.status(404).send('Paciente no encontrado');
        }

        // Preparar campos para actualización
        let fields = [];
        let values = [];

        if (NOMBRE) {
            fields.push("NOMBRE = ?");
            values.push(NOMBRE);
        }
        if (APELLIDOS) {
            fields.push("APELLIDOS = ?");
            values.push(APELLIDOS);
        }
        if (EMAIL) {
            fields.push("EMAIL = ?");
            values.push(EMAIL);
        }
        if (TELEFONO) {
            fields.push("TELEFONO = ?");
            values.push(TELEFONO);
        }
        if (FECHA_NACIMIENTO) {
            fields.push("FECHA_NACIMIENTO = ?");
            values.push(FECHA_NACIMIENTO);
        }
        if (ALERTA_PACIENTE) {
            fields.push("ALERTA_PACIENTE = ?");
            values.push(ALERTA_PACIENTE);
        }
        if (SEXO) {
            const validSexo = ['M', 'F'];
            if (!validSexo.includes(SEXO)) {
                return res.status(400).send('Sexo inválido');
            }
            fields.push("SEXO = ?");
            values.push(SEXO);
        }
        if (PESO_KG) {
            fields.push("PESO_KG = ?");
            values.push(PESO_KG);
        }
        if (DIRECCION) {
            fields.push("DIRECCION = ?");
            values.push(DIRECCION);
        }

        if (fields.length === 0) {
            return res.status(400).send('No hay campos para actualizar');
        }

        values.push(id);
        const query = `UPDATE PACIENTES SET ${fields.join(', ')} WHERE ID_PACIENTE = ?`;

        connection.query(query, values, (err, results) => {
            if (err) {
                console.error('Error al actualizar el paciente:', err);
                return res.status(500).send('Error al actualizar el paciente');
            }
            res.status(200).send('Paciente actualizado exitosamente');
        });
    });
});

// Actualizar una cita existente
app.put('/citas/:id', (req, res) => {
    const { id } = req.params;
    const {
        FECHA,
        HORA,
        ESTADO,
        NOTAS_ADICIONALES,
        TIEMPO_ANTES_CITA_DIAS,
        ID_PACIENTE,
        ID_USUARIO
    } = req.body;

    // Verificar si la cita existe
    const queryCita = "SELECT * FROM CITAS WHERE ID_CITA = ?";
    connection.query(queryCita, [id], (err, citaResults) => {
        if (err) {
            console.error('Error al verificar la cita:', err);
            return res.status(500).send('Error al procesar la solicitud');
        }
        if (citaResults.length === 0) {
            return res.status(404).send('Cita no encontrada');
        }

        // Preparar campos para actualización
        let fields = [];
        let values = [];

        if (FECHA) {
            fields.push("FECHA = ?");
            values.push(FECHA);
        }
        if (HORA) {
            fields.push("HORA = ?");
            values.push(HORA);
        }
        if (ESTADO) {
            const validEstado = ['ACTIVO', 'CANCELADO'];
            if (!validEstado.includes(ESTADO)) {
                return res.status(400).send('Estado inválido');
            }
            fields.push("ESTADO = ?");
            values.push(ESTADO);
        }
        if (NOTAS_ADICIONALES) {
            fields.push("NOTAS_ADICIONALES = ?");
            values.push(NOTAS_ADICIONALES);
        }
        if (TIEMPO_ANTES_CITA_DIAS) {
            const validTiempoAntes = ['1D', '2D', '3D', '4D', '5D', '6D', '1SEM'];
            if (!validTiempoAntes.includes(TIEMPO_ANTES_CITA_DIAS)) {
                return res.status(400).send('Tiempo antes de cita inválido');
            }
            fields.push("TIEMPO_ANTES_CITA_DIAS = ?");
            values.push(TIEMPO_ANTES_CITA_DIAS);
        }
        if (ID_PACIENTE) {
            fields.push("ID_PACIENTE = ?");
            values.push(ID_PACIENTE);
        }
        if (ID_USUARIO) {
            fields.push("ID_USUARIO = ?");
            values.push(ID_USUARIO);
        }

        if (fields.length === 0) {
            return res.status(400).send('No hay campos para actualizar');
        }

        // Verificar si el paciente y el usuario existen si se proporcionan
        const verifyEntities = () => {
            if (ID_PACIENTE) {
                const queryPaciente = "SELECT ID_PACIENTE FROM PACIENTES WHERE ID_PACIENTE = ?";
                connection.query(queryPaciente, [ID_PACIENTE], (err, pacienteResults) => {
                    if (err) {
                        console.error('Error al verificar el paciente:', err);
                        return res.status(500).send('Error al procesar la solicitud');
                    }
                    if (pacienteResults.length === 0) {
                        return res.status(400).send('ID_PACIENTE no existe');
                    }
                    if (ID_USUARIO) {
                        verifyUsuario();
                    } else {
                        updateCita();
                    }
                });
            } else if (ID_USUARIO) {
                verifyUsuario();
            } else {
                updateCita();
            }
        };

        const verifyUsuario = () => {
            const queryUsuario = "SELECT ID_USUARIO FROM USUARIOS WHERE ID_USUARIO = ?";
            connection.query(queryUsuario, [ID_USUARIO], (err, usuarioResults) => {
                if (err) {
                    console.error('Error al verificar el usuario:', err);
                    return res.status(500).send('Error al procesar la solicitud');
                }
                if (usuarioResults.length === 0) {
                    return res.status(400).send('ID_USUARIO no existe');
                }
                updateCita();
            });
        };

        const updateCita = () => {
            values.push(id);
            const query = `UPDATE CITAS SET ${fields.join(', ')} WHERE ID_CITA = ?`;

            connection.query(query, values, (err, results) => {
                if (err) {
                    console.error('Error al actualizar la cita:', err);
                    return res.status(500).send('Error al actualizar la cita');
                }
                res.status(200).send('Cita actualizada exitosamente');
            });
        };

        verifyEntities();
    });
});

// Actualizar una consulta existente
app.put('/consultas/:id', (req, res) => {
    const { id } = req.params;
    const {
        FECHA_HORA,
        EXPLORACION_MEDICA,
        EXPLORACION_FISICA,
        DIAGNOSTICO,
        COBRO_CONSULTA,
        ID_PACIENTE,
        ID_USUARIO
    } = req.body;

    // Verificar si la consulta existe
    const queryConsulta = "SELECT * FROM CONSULTAS WHERE ID_CONSULTA = ?";
    connection.query(queryConsulta, [id], (err, consultaResults) => {
        if (err) {
            console.error('Error al verificar la consulta:', err);
            return res.status(500).send('Error al procesar la solicitud');
        }
        if (consultaResults.length === 0) {
            return res.status(404).send('Consulta no encontrada');
        }

        // Preparar campos para actualización
        let fields = [];
        let values = [];

        if (FECHA_HORA) {
            fields.push("FECHA_HORA = ?");
            values.push(FECHA_HORA);
        }
        if (EXPLORACION_MEDICA) {
            fields.push("EXPLORACION_MEDICA = ?");
            values.push(EXPLORACION_MEDICA);
        }
        if (EXPLORACION_FISICA) {
            fields.push("EXPLORACION_FISICA = ?");
            values.push(EXPLORACION_FISICA);
        }
        if (DIAGNOSTICO) {
            fields.push("DIAGNOSTICO = ?");
            values.push(DIAGNOSTICO);
        }
        if (COBRO_CONSULTA) {
            fields.push("COBRO_CONSULTA = ?");
            values.push(COBRO_CONSULTA);
        }
        if (ID_PACIENTE) {
            fields.push("ID_PACIENTE = ?");
            values.push(ID_PACIENTE);
        }
        if (ID_USUARIO) {
            fields.push("ID_USUARIO = ?");
            values.push(ID_USUARIO);
        }

        if (fields.length === 0) {
            return res.status(400).send('No hay campos para actualizar');
        }

        // Verificar si el paciente y el usuario existen si se proporcionan
        const verifyEntities = () => {
            if (ID_PACIENTE) {
                const queryPaciente = "SELECT ID_PACIENTE FROM PACIENTES WHERE ID_PACIENTE = ?";
                connection.query(queryPaciente, [ID_PACIENTE], (err, pacienteResults) => {
                    if (err) {
                        console.error('Error al verificar el paciente:', err);
                        return res.status(500).send('Error al procesar la solicitud');
                    }
                    if (pacienteResults.length === 0) {
                        return res.status(400).send('ID_PACIENTE no existe');
                    }
                    if (ID_USUARIO) {
                        verifyUsuario();
                    } else {
                        updateConsulta();
                    }
                });
            } else if (ID_USUARIO) {
                verifyUsuario();
            } else {
                updateConsulta();
            }
        };

        const verifyUsuario = () => {
            const queryUsuario = "SELECT ID_USUARIO FROM USUARIOS WHERE ID_USUARIO = ?";
            connection.query(queryUsuario, [ID_USUARIO], (err, usuarioResults) => {
                if (err) {
                    console.error('Error al verificar el usuario:', err);
                    return res.status(500).send('Error al procesar la solicitud');
                }
                if (usuarioResults.length === 0) {
                    return res.status(400).send('ID_USUARIO no existe');
                }
                updateConsulta();
            });
        };

        const updateConsulta = () => {
            values.push(id);
            const query = `UPDATE CONSULTAS SET ${fields.join(', ')} WHERE ID_CONSULTA = ?`;

            connection.query(query, values, (err, results) => {
                if (err) {
                    console.error('Error al actualizar la consulta:', err);
                    return res.status(500).send('Error al actualizar la consulta');
                }
                res.status(200).send('Consulta actualizada exitosamente');
            });
        };

        verifyEntities();
    });
});

// Actualizar una receta existente
app.put('/recetas/:id', (req, res) => {
    const { id } = req.params;
    const {
        CONTENIDO,
        FECHA_EMISION,
        ID_CONSULTA,
        ID_USUARIO,
        ID_PACIENTE
    } = req.body;

    // Verificar si la receta existe
    const queryReceta = "SELECT * FROM RECETAS WHERE ID_RECETA = ?";
    connection.query(queryReceta, [id], (err, recetaResults) => {
        if (err) {
            console.error('Error al verificar la receta:', err);
            return res.status(500).send('Error al procesar la solicitud');
        }
        if (recetaResults.length === 0) {
            return res.status(404).send('Receta no encontrada');
        }

        // Preparar campos para actualización
        let fields = [];
        let values = [];

        if (CONTENIDO) {
            fields.push("CONTENIDO = ?");
            values.push(CONTENIDO);
        }
        if (FECHA_EMISION) {
            fields.push("FECHA_EMISION = ?");
            values.push(FECHA_EMISION);
        }
        if (ID_CONSULTA) {
            fields.push("ID_CONSULTA = ?");
            values.push(ID_CONSULTA);
        }
        if (ID_USUARIO) {
            fields.push("ID_USUARIO = ?");
            values.push(ID_USUARIO);
        }
        if (ID_PACIENTE) {
            fields.push("ID_PACIENTE = ?");
            values.push(ID_PACIENTE);
        }

        if (fields.length === 0) {
            return res.status(400).send('No hay campos para actualizar');
        }

        // Verificar entidades si se proporcionan
        const verifyEntities = () => {
            if (ID_PACIENTE) {
                const queryPaciente = "SELECT ID_PACIENTE FROM PACIENTES WHERE ID_PACIENTE = ?";
                connection.query(queryPaciente, [ID_PACIENTE], (err, pacienteResults) => {
                    if (err) {
                        console.error('Error al verificar el paciente:', err);
                        return res.status(500).send('Error al procesar la solicitud');
                    }
                    if (pacienteResults.length === 0) {
                        return res.status(400).send('ID_PACIENTE no existe');
                    }
                    if (ID_USUARIO) {
                        verifyUsuario();
                    } else if (ID_CONSULTA) {
                        verifyConsulta();
                    } else {
                        updateReceta();
                    }
                });
            } else if (ID_USUARIO) {
                verifyUsuario();
            } else if (ID_CONSULTA) {
                verifyConsulta();
            } else {
                updateReceta();
            }
        };

        const verifyUsuario = () => {
            const queryUsuario = "SELECT ID_USUARIO FROM USUARIOS WHERE ID_USUARIO = ?";
            connection.query(queryUsuario, [ID_USUARIO], (err, usuarioResults) => {
                if (err) {
                    console.error('Error al verificar el usuario:', err);
                    return res.status(500).send('Error al procesar la solicitud');
                }
                if (usuarioResults.length === 0) {
                    return res.status(400).send('ID_USUARIO no existe');
                }
                if (ID_CONSULTA) {
                    verifyConsulta();
                } else {
                    updateReceta();
                }
            });
        };

        const verifyConsulta = () => {
            const queryConsulta = "SELECT ID_CONSULTA FROM CONSULTAS WHERE ID_CONSULTA = ?";
            connection.query(queryConsulta, [ID_CONSULTA], (err, consultaResults) => {
                if (err) {
                    console.error('Error al verificar la consulta:', err);
                    return res.status(500).send('Error al procesar la solicitud');
                }
                if (consultaResults.length === 0) {
                    return res.status(400).send('ID_CONSULTA no existe');
                }
                updateReceta();
            });
        };

        const updateReceta = () => {
            values.push(id);
            const query = `UPDATE RECETAS SET ${fields.join(', ')} WHERE ID_RECETA = ?`;

            connection.query(query, values, (err, results) => {
                if (err) {
                    console.error('Error al actualizar la receta:', err);
                    return res.status(500).send('Error al actualizar la receta');
                }
                res.status(200).send('Receta actualizada exitosamente');
            });
        };

        verifyEntities();
    });
});

// Actualizar un documento existente
app.put('/documentos/:id', upload.single('DOCUMENTO'), (req, res) => {
    const { id } = req.params;
    const {
        TIPO_DOCUMENTO,
        NOMBRE_DOCUMENTO,
        FECHA_SUBIDA,
        DESCRIPCION,
        ID_PACIENTE
    } = req.body;

    const documentoFile = req.file;

    // Verificar si el documento existe
    const queryDocumento = "SELECT * FROM DOCUMENTOS WHERE ID_DOCUMENTO = ?";
    connection.query(queryDocumento, [id], (err, documentoResults) => {
        if (err) {
            console.error('Error al verificar el documento:', err);
            return res.status(500).send('Error al procesar la solicitud');
        }
        if (documentoResults.length === 0) {
            return res.status(404).send('Documento no encontrado');
        }

        // Preparar campos para actualización
        let fields = [];
        let values = [];

        if (TIPO_DOCUMENTO) {
            fields.push("TIPO_DOCUMENTO = ?");
            values.push(TIPO_DOCUMENTO);
        }
        if (NOMBRE_DOCUMENTO) {
            fields.push("NOMBRE_DOCUMENTO = ?");
            values.push(NOMBRE_DOCUMENTO);
        }
        if (FECHA_SUBIDA) {
            fields.push("FECHA_SUBIDA = ?");
            values.push(FECHA_SUBIDA);
        }
        if (DESCRIPCION) {
            fields.push("DESCRIPCION = ?");
            values.push(DESCRIPCION);
        }
        if (ID_PACIENTE) {
            fields.push("ID_PACIENTE = ?");
            values.push(ID_PACIENTE);
        }
        if (documentoFile) {
            fields.push("DOCUMENTO = ?");
            values.push(documentoFile.buffer);
        }

        if (fields.length === 0) {
            return res.status(400).send('No hay campos para actualizar');
        }

        // Verificar si el paciente existe si se proporciona
        const verifyPaciente = () => {
            if (ID_PACIENTE) {
                const queryPaciente = "SELECT ID_PACIENTE FROM PACIENTES WHERE ID_PACIENTE = ?";
                connection.query(queryPaciente, [ID_PACIENTE], (err, pacienteResults) => {
                    if (err) {
                        console.error('Error al verificar el paciente:', err);
                        return res.status(500).send('Error al procesar la solicitud');
                    }
                    if (pacienteResults.length === 0) {
                        return res.status(400).send('ID_PACIENTE no existe');
                    }
                    updateDocumento();
                });
            } else {
                updateDocumento();
            }
        };

        const updateDocumento = () => {
            values.push(id);
            const query = `UPDATE DOCUMENTOS SET ${fields.join(', ')} WHERE ID_DOCUMENTO = ?`;

            connection.query(query, values, (err, results) => {
                if (err) {
                    console.error('Error al actualizar el documento:', err);
                    return res.status(500).send('Error al actualizar el documento');
                }
                res.status(200).send('Documento actualizado exitosamente');
            });
        };

        verifyPaciente();
    });
});


/* ===================== FIN ENDPOINTS POST ===================== */



// ===================== ENDPOINTS DELETE ===================== //

// Eliminar un usuario por ID
app.delete('/usuarios/:id', (req, res) => {
    const { id } = req.params;

    // Verificar si el usuario existe
    const queryUsuario = "SELECT * FROM USUARIOS WHERE ID_USUARIO = ?";
    connection.query(queryUsuario, [id], (err, usuarioResults) => {
        if (err) {
            console.error('Error al verificar el usuario:', err);
            return res.status(500).send('Error al procesar la solicitud');
        }
        if (usuarioResults.length === 0) {
            return res.status(404).send('Usuario no encontrado');
        }

        // Intentar eliminar el usuario
        const deleteQuery = "DELETE FROM USUARIOS WHERE ID_USUARIO = ?";
        connection.query(deleteQuery, [id], (err, results) => {
            if (err) {
                if (err.code === 'ER_ROW_IS_REFERENCED_2' || err.code === 'ER_ROW_IS_REFERENCED') {
                    return res.status(400).send('No se puede eliminar el usuario porque tiene registros asociados.');
                }
                console.error('Error al eliminar el usuario:', err);
                return res.status(500).send('Error al eliminar el usuario');
            }
            res.status(200).send('Usuario eliminado exitosamente');
        });
    });
});

// Eliminar un paciente por ID
app.delete('/pacientes/:id', (req, res) => {
    const { id } = req.params;

    // Verificar si el paciente existe
    const queryPaciente = "SELECT * FROM PACIENTES WHERE ID_PACIENTE = ?";
    connection.query(queryPaciente, [id], (err, pacienteResults) => {
        if (err) {
            console.error('Error al verificar el paciente:', err);
            return res.status(500).send('Error al procesar la solicitud');
        }
        if (pacienteResults.length === 0) {
            return res.status(404).send('Paciente no encontrado');
        }

        // Intentar eliminar el paciente
        const deleteQuery = "DELETE FROM PACIENTES WHERE ID_PACIENTE = ?";
        connection.query(deleteQuery, [id], (err, results) => {
            if (err) {
                if (err.code === 'ER_ROW_IS_REFERENCED_2' || err.code === 'ER_ROW_IS_REFERENCED') {
                    return res.status(400).send('No se puede eliminar el paciente porque tiene registros asociados.');
                }
                console.error('Error al eliminar el paciente:', err);
                return res.status(500).send('Error al eliminar el paciente');
            }
            res.status(200).send('Paciente eliminado exitosamente');
        });
    });
});

// Eliminar una cita por ID
app.delete('/citas/:id', (req, res) => {
    const { id } = req.params;

    // Verificar si la cita existe
    const queryCita = "SELECT * FROM CITAS WHERE ID_CITA = ?";
    connection.query(queryCita, [id], (err, citaResults) => {
        if (err) {
            console.error('Error al verificar la cita:', err);
            return res.status(500).send('Error al procesar la solicitud');
        }
        if (citaResults.length === 0) {
            return res.status(404).send('Cita no encontrada');
        }

        // Eliminar la cita
        const deleteQuery = "DELETE FROM CITAS WHERE ID_CITA = ?";
        connection.query(deleteQuery, [id], (err, results) => {
            if (err) {
                console.error('Error al eliminar la cita:', err);
                return res.status(500).send('Error al eliminar la cita');
            }
            res.status(200).send('Cita eliminada exitosamente');
        });
    });
});

// Eliminar una consulta por ID
app.delete('/consultas/:id', (req, res) => {
    const { id } = req.params;

    // Verificar si la consulta existe
    const queryConsulta = "SELECT * FROM CONSULTAS WHERE ID_CONSULTA = ?";
    connection.query(queryConsulta, [id], (err, consultaResults) => {
        if (err) {
            console.error('Error al verificar la consulta:', err);
            return res.status(500).send('Error al procesar la solicitud');
        }
        if (consultaResults.length === 0) {
            return res.status(404).send('Consulta no encontrada');
        }

        // Eliminar la consulta y sus recetas asociadas si corresponde
        const deleteQuery = `
            DELETE FROM RECETAS WHERE ID_CONSULTA = ?;
            DELETE FROM CONSULTAS WHERE ID_CONSULTA = ?;
        `;
        connection.query(deleteQuery, [id, id], (err, results) => {
            if (err) {
                console.error('Error al eliminar la consulta:', err);
                return res.status(500).send('Error al eliminar la consulta');
            }
            res.status(200).send('Consulta y recetas asociadas eliminadas exitosamente');
        });
    });
});

// Eliminar una receta por ID
app.delete('/recetas/:id', (req, res) => {
    const { id } = req.params;

    // Verificar si la receta existe
    const queryReceta = "SELECT * FROM RECETAS WHERE ID_RECETA = ?";
    connection.query(queryReceta, [id], (err, recetaResults) => {
        if (err) {
            console.error('Error al verificar la receta:', err);
            return res.status(500).send('Error al procesar la solicitud');
        }
        if (recetaResults.length === 0) {
            return res.status(404).send('Receta no encontrada');
        }

        // Eliminar la receta
        const deleteQuery = "DELETE FROM RECETAS WHERE ID_RECETA = ?";
        connection.query(deleteQuery, [id], (err, results) => {
            if (err) {
                console.error('Error al eliminar la receta:', err);
                return res.status(500).send('Error al eliminar la receta');
            }
            res.status(200).send('Receta eliminada exitosamente');
        });
    });
});

// Eliminar un documento por ID
app.delete('/documentos/:id', (req, res) => {
    const { id } = req.params;

    // Verificar si el documento existe
    const queryDocumento = "SELECT * FROM DOCUMENTOS WHERE ID_DOCUMENTO = ?";
    connection.query(queryDocumento, [id], (err, documentoResults) => {
        if (err) {
            console.error('Error al verificar el documento:', err);
            return res.status(500).send('Error al procesar la solicitud');
        }
        if (documentoResults.length === 0) {
            return res.status(404).send('Documento no encontrado');
        }

        // Eliminar el documento
        const deleteQuery = "DELETE FROM DOCUMENTOS WHERE ID_DOCUMENTO = ?";
        connection.query(deleteQuery, [id], (err, results) => {
            if (err) {
                console.error('Error al eliminar el documento:', err);
                return res.status(500).send('Error al eliminar el documento');
            }
            res.status(200).send('Documento eliminado exitosamente');
        });
    });
});

// ===================== FIN ENDPOINTS DELETE ===================== //

// Iniciar el servidor
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Servidor escuchando en el puerto ${PORT}`);
});
