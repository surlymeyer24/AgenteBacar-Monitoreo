package com.bacarsa.inventario.services;

import java.util.Arrays;
import java.util.List;
import java.util.concurrent.ExecutionException;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

import com.bacarsa.inventario.models.CambioEstado;
import com.bacarsa.inventario.models.Estado;
import com.bacarsa.inventario.models.EstadoOperativo;
import com.bacarsa.inventario.models.MaquinaTesoreria;
import com.bacarsa.inventario.models.TipoMaquina;
import com.bacarsa.inventario.repository.MaquinaTesoreriaRepository;
import com.google.cloud.Timestamp;

/**
 * Carga inicial de las 58 máquinas de Tesorería desde los inventarios CSV provistos.
 * Activa = "Si" → ASIGNADA; Activa = "No" → BAJA.
 * ID del documento = {TIPO}_{modelo-sin-espacios}_{nroSerie-sin-espacios}.
 */
@Service
public class MaquinaTesoreriaImportService {

    private static final Logger log = LoggerFactory.getLogger(MaquinaTesoreriaImportService.class);

    private final MaquinaTesoreriaRepository repository;

    public MaquinaTesoreriaImportService(MaquinaTesoreriaRepository repository) {
        this.repository = repository;
    }

    record Fila(TipoMaquina tipo, String modelo, String nroSerie, boolean activa, String vida) {}

    private static final List<Fila> DATOS = Arrays.asList(
        // BOLSILLOS (validadora) — YUWF-10E-ST / YUWF-11E-ST
        new Fila(TipoMaquina.BOLSILLOS, "YUWF-10E-ST", "2348", true,  null),
        new Fila(TipoMaquina.BOLSILLOS, "YUWF-10E-ST", "2311", true,  null),
        new Fila(TipoMaquina.BOLSILLOS, "YUWF-10E-ST", "3220", false, null),
        new Fila(TipoMaquina.BOLSILLOS, "YUWF-10E-ST", "4685", true,  null),
        new Fila(TipoMaquina.BOLSILLOS, "YUWF-10E-ST", "4680", true,  null),
        new Fila(TipoMaquina.BOLSILLOS, "YUWF-10E-ST", "4664", true,  null),
        new Fila(TipoMaquina.BOLSILLOS, "YUWF-11E-ST", "1502", true,  null),
        new Fila(TipoMaquina.BOLSILLOS, "YUWF-11E-ST", "2672", true,  null),
        new Fila(TipoMaquina.BOLSILLOS, "YUWF-11E-ST", "2671", true,  null),
        new Fila(TipoMaquina.BOLSILLOS, "YUWF-11E-ST", "2653", true,  null),

        // VALIDADORA — UW-F4EU
        new Fila(TipoMaquina.VALIDADORA, "UW-F4EU", "2601", true,  null),
        new Fila(TipoMaquina.VALIDADORA, "UW-F4EU", "7126", true,  null),
        new Fila(TipoMaquina.VALIDADORA, "UW-F4EU", "8233", true,  null),
        new Fila(TipoMaquina.VALIDADORA, "UW-F4EU", "8236", true,  null),
        new Fila(TipoMaquina.VALIDADORA, "UW-F4EU", "4812", false, null),
        new Fila(TipoMaquina.VALIDADORA, "UW-F4EU", "4716", true,  null),

        // RECONTADORA — GFS-220 CS
        new Fila(TipoMaquina.RECONTADORA, "GFS-220 CS", "GFS220NCN015693S", false, "PARA REPUESTO"),
        new Fila(TipoMaquina.RECONTADORA, "GFS-220 CS", "GFS220NCN001671S", true,  "64662642"),
        new Fila(TipoMaquina.RECONTADORA, "GFS-220 CS", "GFS220NCN001572S", true,  "61886699"),
        new Fila(TipoMaquina.RECONTADORA, "GFS-220 CS", "GFS220NCN008598S", false, "PARA REPUESTO"),
        new Fila(TipoMaquina.RECONTADORA, "GFS-220 CS", "GFS220NCN015764S", false, "TACTIL ROTO"),
        new Fila(TipoMaquina.RECONTADORA, "GFS-220 CS", "GFS220NCN001758S", true,  "58928690"),
        new Fila(TipoMaquina.RECONTADORA, "GFS-220 CS", "GFS220NCN001695S", true,  "53933535"),
        new Fila(TipoMaquina.RECONTADORA, "GFS-220 CS", "GFS220NCN008123S", true,  "45736525"),
        new Fila(TipoMaquina.RECONTADORA, "GFS-220 CS", "GFS220NCN008254S", true,  "44563980"),
        new Fila(TipoMaquina.RECONTADORA, "GFS-220 CS", "GFS220NCN015749S", true,  "39065244"),
        new Fila(TipoMaquina.RECONTADORA, "GFS-220 CS", "GFS220NCN001755S", false, "58633574"),
        new Fila(TipoMaquina.RECONTADORA, "GFS-220 CS", "GFS220NCN001641S", false, "PARA REPUESTO"),
        new Fila(TipoMaquina.RECONTADORA, "GFS-220 CS", "GFS220NCN001738S", true,  "42259895"),
        new Fila(TipoMaquina.RECONTADORA, "GFS-220 CS", "GFS220NCN001763S", true,  "63008895"),
        new Fila(TipoMaquina.RECONTADORA, "GFS-220 CS", "GFS220NCN015631S", true,  "41207806"),
        new Fila(TipoMaquina.RECONTADORA, "GFS-220 CS", "GFS220NCN001627S", true,  "58273765"),
        new Fila(TipoMaquina.RECONTADORA, "GFS-220 CS", "GFS220NCN001379S", true,  "55654771"),
        new Fila(TipoMaquina.RECONTADORA, "GFS-220 CS", "GFS220NCN008412S", true,  "44989703"),
        new Fila(TipoMaquina.RECONTADORA, "GFS-220 CS", "GFS220NCN015475S", true,  "46029274"),
        new Fila(TipoMaquina.RECONTADORA, "GFS-220 CS", "GFS220NCN001349S", true,  "56071343"),
        new Fila(TipoMaquina.RECONTADORA, "GFS-220 CS", "GFS220NCN001749S", true,  "55748183"),
        new Fila(TipoMaquina.RECONTADORA, "GFS-220 CS", "GFS220NCN008352S", false, "49163256"),
        new Fila(TipoMaquina.RECONTADORA, "GFS-220 CS", "GFS220NCN040214S", true,  "13508189"),
        new Fila(TipoMaquina.RECONTADORA, "GFS-220 CS", "GFS220NCN040232S", true,  "6869370"),
        new Fila(TipoMaquina.RECONTADORA, "GFS-220 CS", "GFS220NCN030550S", true,  "29291332"),
        new Fila(TipoMaquina.RECONTADORA, "GFS-220 CS", "GFS220NCN030186S", true,  "31363586"),
        new Fila(TipoMaquina.RECONTADORA, "GFS-220 CS", "GFS220NCN030546S", true,  "31335642"),
        new Fila(TipoMaquina.RECONTADORA, "GFS-220 CS", "GFS220NCN040382S", true,  "14377277"),
        new Fila(TipoMaquina.RECONTADORA, "GFS-220 CS", "GFS220NCN030357S", true,  "31760306"),
        new Fila(TipoMaquina.RECONTADORA, "GFS-220 CS", "GFS220NCN030254S", true,  "25482858"),
        new Fila(TipoMaquina.RECONTADORA, "GFS-220 CS", "GFS220NCN030525S", true,  "33043853"),

        // ENVASADORA — DB2252 N / DZ-450A
        new Fila(TipoMaquina.ENVASADORA, "DB2252 N", "3280027620",        true,  null),
        new Fila(TipoMaquina.ENVASADORA, "DB2252 N", "3280030123",        true,  null),
        new Fila(TipoMaquina.ENVASADORA, "DB2252 N", "3280029423",        true,  null),
        new Fila(TipoMaquina.ENVASADORA, "DZ-450A",  "22SEDZ450A-41",    true,  null),
        new Fila(TipoMaquina.ENVASADORA, "DZ-450A",  "DJ1603001T1-04",   false, null),

        // FAJADORA — BB 40-26
        new Fila(TipoMaquina.FAJADORA, "BB 40-26", "363/2463", true,  null),
        new Fila(TipoMaquina.FAJADORA, "BB 40-26", "363/2363", true,  null),
        new Fila(TipoMaquina.FAJADORA, "BB 40-26", "363/2317", false, null),
        new Fila(TipoMaquina.FAJADORA, "BB 40-26", "363/2530", true,  null),
        new Fila(TipoMaquina.FAJADORA, "BB 40-26", "363/2592", false, null)
    );

    public int importarTodos() throws ExecutionException, InterruptedException {
        int n = 0;
        for (Fila fila : DATOS) {
            String docId = generarId(fila);
            MaquinaTesoreria maquina = construir(fila);
            repository.guardarConId(docId, maquina);
            n++;
        }
        log.info("Importación máquinas Tesorería: {} documentos escritos.", n);
        return n;
    }

    private static MaquinaTesoreria construir(Fila fila) {
        EstadoOperativo op = fila.activa() ? EstadoOperativo.ASIGNADA : EstadoOperativo.BAJA;

        Estado estado = new Estado();
        estado.setNombre(op.getNombre());
        estado.setDescripcion(op.getDescripcion());

        CambioEstado estadoInicial = new CambioEstado();
        estadoInicial.setEstado(estado);
        estadoInicial.setMotivo("Carga inicial de inventario");
        estadoInicial.setFechaHoraInicio(Timestamp.now());
        estadoInicial.setFechaHoraFin(null);

        MaquinaTesoreria maquina = new MaquinaTesoreria();
        maquina.setTipo(fila.tipo());
        maquina.setModelo(fila.modelo());
        maquina.setNroSerie(fila.nroSerie());
        maquina.setVida(fila.vida());
        maquina.setEstadoActual(estado);
        maquina.getHistorialEstados().add(estadoInicial);
        return maquina;
    }

    private static String generarId(Fila fila) {
        String modelo = fila.modelo().replaceAll("[^a-zA-Z0-9]", "");
        String serie  = fila.nroSerie().replaceAll("[^a-zA-Z0-9]", "");
        return fila.tipo().name() + "_" + modelo + "_" + serie;
    }
}
