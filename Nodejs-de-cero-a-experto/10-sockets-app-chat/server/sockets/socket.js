const { io } = require("../server");

const { Usuarios } = require("../classes/usuario.js");
const { crearMensaje } = require("../utils/util");

let usuarios = new Usuarios();

io.on("connection", cliente => {
    console.log("Nuevo usuario");

    cliente.on("ingresarChat", (data, callback) => {
        console.log("INgresadno", data);
        if (!data.nombre || !data.sala) {
            return callback({
                ok: false,
                message: "El nombre y la sala es requerido"
            });
        }

        cliente.join(data.sala);

        usuarios.agregarPersona(cliente.id, data.nombre, data.sala);

        let personas = usuarios.getPersonasPorSala(data.sala);
        cliente.broadcast.to(data.sala).emit("clientesActivos", personas);
        cliente.broadcast.to(data.sala).emit(
            "enviarMensaje",
            crearMensaje(
                "Administrador",
                `${data.nombre} se unió al chat`
            )
        );

        return callback(personas);
    });

    cliente.on("enviarMensaje", (data ,callback)=> {

        let data_persona = usuarios.getPersona(cliente.id);
        if (data_persona.ok===true) {  
            let mensaje = crearMensaje(data_persona.persona.nombre, data.message);
            cliente.broadcast.to(data_persona.persona.sala).emit(
                "enviarMensaje",
                mensaje
            );
            callback(mensaje);
        }else{
          console.log('Solicitud negada',data_persona);
        }

    });

    cliente.on("mensajePrivado", data => {
        let persona = usuarios.getPersona(cliente.id);

        if (persona) {
            cliente.broadcast
                .to(data.id_destino)
                .emit("mensajePrivado", crearMensaje(persona.nombre, data.message));
        }
    });

   

    cliente.on("disconnect", () => {
        let data = usuarios.borrarPersona(cliente.id).personaBorrada;



        cliente.broadcast.to(data.persona.sala).emit(
            "enviarMensaje",
            crearMensaje(
                "Administrador",
                `${data.persona.nombre} abandonó el chat`
            )
        );

        cliente.broadcast.to(data.persona.sala).emit("clientesActivos", usuarios.getPersonasPorSala(data.persona.sala));
    });


});