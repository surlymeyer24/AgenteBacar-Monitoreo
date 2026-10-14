package com.bacarsa.inventario.bootstrap;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.core.annotation.Order;
import org.springframework.stereotype.Component;

import java.util.concurrent.ExecutionException;

import com.bacarsa.inventario.models.CatalogoItem;
import com.bacarsa.inventario.repository.CatalogoItemRepository;

@Component
@Order(Integer.MAX_VALUE - 1)
public class CatalogoBootstrapRunner implements ApplicationRunner {

    private static final Logger log = LoggerFactory.getLogger(CatalogoBootstrapRunner.class);

    private static final String CATALOGO_TIPOS_STOCK = "tipos_stock";
    private static final String CATALOGO_UBICACIONES_RED = "ubicaciones_red";
    private static final String CATALOGO_UBICACIONES_COMPUTADORA = "ubicaciones_computadora";
    private static final String CATALOGO_ESTADOS_OPERATIVOS = "estados_operativos";
    private static final String CATALOGO_CONEXIONES_PERIFERICO = "conexiones_periferico";
    private static final String CATALOGO_TIPOS_MAQUINA = "tipos_maquina";
    private static final String CATALOGO_UBICACIONES_CAMARA = "ubicaciones_camara";
    private static final String CATALOGO_ESTADOS_DISPOSITIVO = "estados_dispositivo";
    private static final String CATALOGO_FASES_ETIQUETADO = "fases_etiquetado";
    private static final String CATALOGO_ROLES_SISTEMA = "roles_sistema";
    private static final String CATALOGO_TIPOS_EQUIPO = "tipos_equipo";
    private static final String CATALOGO_CONDICIONES_EQUIPO = "condiciones_equipo";

    private static final String[][] SEED_TIPOS_STOCK = {
            { "computadora", "Computadora" },
            { "camara_ip", "Cámara IP" },
            { "teclado", "Teclado" },
            { "mouse", "Mouse" },
            { "monitor", "Monitor" },
            { "impresora", "Impresora" },
            { "webcam", "Webcam" },
            { "parlante", "Parlante" },
            { "microfono", "Micrófono" },
            { "router", "Router" },
            { "switch", "Switch" },
            { "access_point", "Access Point" },
            { "telefono_ip", "Teléfono IP" },
            { "otro", "Otro" },
    };

    private static final String[][] SEED_UBICACIONES_COMPUTADORA = {
            { "administracion", "Administración" },
            { "monitoreo", "Monitoreo" },
            { "tesoreria", "Tesorería" },
            { "capital_humano", "Capital Humano" },
            { "sistemas", "Sistemas" },
            { "seguridad_privada", "Seguridad Privada" },
            { "operaciones", "Operaciones" },
    };

    private static final String[][] SEED_ESTADOS_OPERATIVOS = {
            { "asignada", "Asignada" },
            { "sin_asignar", "Sin Asignar" },
            { "en_mantenimiento", "En mantenimiento" },
            { "baja", "Baja" },
            { "activa", "Activa" },
            { "inactiva", "Inactiva" },
    };

    private static final String[][] SEED_CONEXIONES_PERIFERICO = {
            { "usb", "USB" },
            { "inalambrico_usb", "Inalámbrico USB" },
            { "bluetooth", "Bluetooth" },
            { "hdmi", "HDMI" },
            { "otro", "Otro" },
    };

    private static final String[][] SEED_TIPOS_MAQUINA = {
            { "validadora", "Validadora" },
            { "bolsillos", "Bolsillos" },
            { "recontadora", "Recontadora" },
            { "envasadora", "Envasadora" },
            { "fajadora", "Fajadora" },
    };

    private static final String[][] SEED_UBICACIONES_CAMARA = {
            { "adm_ger_pas", "ADM GER PAS" },
            { "administracion", "ADMINISTRACION" },
            { "administracion_rack", "Administracion Rack" },
            { "box_entrega", "Box Entrega" },
            { "buzon", "Buzon" },
            { "buzon2", "Buzon2" },
            { "calle1", "CALLE1" },
            { "calle2", "CALLE2" },
            { "capital_humano", "CAPITAL_HUMANO" },
            { "cobroexpress", "CobroExpress" },
            { "depositario_buzon", "Depositario Buzon" },
            { "domo_santiago", "Domo Santiago" },
            { "egreso", "Egreso" },
            { "espera_boxes", "Espera Boxes" },
            { "estacionamiento", "ESTACIONAMIENTO" },
            { "estanco_adentro", "Estanco adentro" },
            { "guarda_izq", "Guarda IZQ" },
            { "guardia_uc", "GUARDIA" },
            { "guardia", "Guardia" },
            { "ingtes", "INGTES" },
            { "ingreso", "Ingreso" },
            { "ingreso_olmos", "Ingreso Olmos" },
            { "ingresosistemas", "IngresoSistemas" },
            { "ip_domo", "IP Domo" },
            { "monitoreo", "MONITOREO" },
            { "monitoreo_rack", "Monitoreo Rack" },
            { "olmos_d", "Olmos D" },
            { "olmos1", "Olmos1" },
            { "olmos2", "Olmos2" },
            { "olmosi", "OlmosI" },
            { "patio_interno", "Patio Interno" },
            { "planta", "Planta" },
            { "planta_2", "Planta 2" },
            { "planta_3", "Planta 3" },
            { "planta_4", "Planta 4" },
            { "planta_5", "Planta 5" },
            { "planta_6", "Planta 6" },
            { "playa", "Playa" },
            { "playa_2", "Playa 2" },
            { "porton_ingreso", "Porton Ingreso" },
            { "puerta_chapa", "Puerta Chapa" },
            { "puerta_sala_de_armas", "Puerta Sala De Armas" },
            { "puerta_taller", "Puerta Taller" },
            { "puerta_tesoreria", "Puerta Tesoreria" },
            { "puertaroja", "PuertaRoja" },
            { "recepcion", "Recepcion" },
            { "reja_monitoreo", "Reja Monitoreo" },
            { "sala_de_armas_afuera", "Sala De Armas Afuera" },
            { "sala_de_armas", "Sala de Armas" },
            { "sala_de_armas_2", "Sala de Armas 2" },
            { "salida", "Salida" },
            { "salidates", "salidaTes" },
            { "santiago_1", "Santiago 1" },
            { "santiago_2", "Santiago 2" },
            { "santiago_3", "Santiago 3" },
            { "seguridadprivada", "SEGURIDADPRIVADA" },
            { "sistemas", "SISTEMAS" },
            { "taller1", "Taller1" },
            { "taller2", "Taller2" },
            { "taller3", "Taller3" },
            { "taller4", "Taller4" },
            { "tallerdepo", "TallerDepo" },
            { "tallerpanol", "TallerPañol" },
            { "tes1", "TES1" },
            { "tes2", "TES2" },
            { "tesoreria", "TESORERIA" },
    };

    private static final String[][] SEED_ESTADOS_DISPOSITIVO = {
            { "activo", "Activo" },
            { "en_stock", "En stock" },
            { "baja", "Baja" },
    };

    private static final String[][] SEED_FASES_ETIQUETADO = {
            { "etiquetado", "Etiquetado" },
            { "embalado", "Embalado" },
            { "destino", "En destino" },
    };

    private static final String[][] SEED_ROLES_SISTEMA = {
            { "VISUALIZADOR", "Visualizador" },
            { "USUARIO", "Usuario" },
            { "ADMINISTRADOR", "Administrador" },
    };

    private static final String[][] SEED_TIPOS_EQUIPO = {
            { "mini_pc", "Mini PC" },
            { "desktop", "Desktop" },
            { "notebook", "Notebook" },
    };

    private static final String[][] SEED_CONDICIONES_EQUIPO = {
            { "nueva", "Nueva" },
            { "usada", "Usada" },
    };

    private static final String[][] SEED_UBICACIONES_RED = {
            { "rack_principal", "Rack Principal" },
            { "rack_secundario", "Rack Secundario" },
            { "administracion", "Administración" },
            { "monitoreo", "Monitoreo" },
            { "sistemas", "Sistemas" },
            { "guardia", "Guardia" },
    };

    private final CatalogoItemRepository repository;

    public CatalogoBootstrapRunner(CatalogoItemRepository repository) {
        this.repository = repository;
    }

    @Override
    public void run(ApplicationArguments args) throws Exception {
        seedSiVacio(CATALOGO_TIPOS_STOCK, SEED_TIPOS_STOCK);
        seedSiVacio(CATALOGO_UBICACIONES_RED, SEED_UBICACIONES_RED);
        seedSiVacio(CATALOGO_UBICACIONES_COMPUTADORA, SEED_UBICACIONES_COMPUTADORA);
        seedSiVacio(CATALOGO_ESTADOS_OPERATIVOS, SEED_ESTADOS_OPERATIVOS);
        seedSiVacio(CATALOGO_CONEXIONES_PERIFERICO, SEED_CONEXIONES_PERIFERICO);
        seedSiVacio(CATALOGO_TIPOS_MAQUINA, SEED_TIPOS_MAQUINA);
        seedSiVacio(CATALOGO_UBICACIONES_CAMARA, SEED_UBICACIONES_CAMARA);
        seedSiVacio(CATALOGO_ESTADOS_DISPOSITIVO, SEED_ESTADOS_DISPOSITIVO);
        seedSiVacio(CATALOGO_FASES_ETIQUETADO, SEED_FASES_ETIQUETADO);
        seedSiVacio(CATALOGO_ROLES_SISTEMA, SEED_ROLES_SISTEMA);
        seedSiVacio(CATALOGO_TIPOS_EQUIPO, SEED_TIPOS_EQUIPO);
        seedSiVacio(CATALOGO_CONDICIONES_EQUIPO, SEED_CONDICIONES_EQUIPO);
    }

    private void seedSiVacio(String catalogo, String[][] items) throws Exception {
        if (!repository.existenItemsParaCatalogo(catalogo)) {
            log.info("Catálogo '{}': vacío, sembrando {} items…", catalogo, items.length);
            for (int i = 0; i < items.length; i++) {
                crearItem(catalogo, items[i][0], items[i][1], i + 1);
            }
            log.info("Catálogo '{}': seed completado.", catalogo);
            return;
        }

        int creados = 0;
        for (int i = 0; i < items.length; i++) {
            String id = catalogo + "_" + items[i][0];
            if (repository.findById(id).isEmpty()) {
                crearItem(catalogo, items[i][0], items[i][1], i + 1);
                creados++;
            }
        }
        if (creados > 0) {
            log.info("Catálogo '{}': {} documentos faltantes creados (id catalogo_codigo).", catalogo, creados);
        }
    }

    private void crearItem(String catalogo, String codigo, String label, int orden)
            throws ExecutionException, InterruptedException {
        CatalogoItem item = new CatalogoItem();
        item.setCatalogo(catalogo);
        item.setCodigo(codigo);
        item.setId(catalogo + "_" + codigo);
        item.setLabel(label);
        item.setActivo(true);
        item.setOrden(orden);
        repository.save(item);
    }
}
