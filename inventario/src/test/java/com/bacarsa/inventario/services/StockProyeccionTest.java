package com.bacarsa.inventario.services;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.junit.jupiter.api.Assertions.assertTrue;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

import org.junit.jupiter.api.Test;

import com.bacarsa.inventario.dto.UnidadStockDTO;
import com.bacarsa.inventario.models.AccessPoint;
import com.bacarsa.inventario.models.Camara;
import com.bacarsa.inventario.models.Celular;
import com.bacarsa.inventario.models.Computadora;
import com.bacarsa.inventario.models.EspecificacionStock;
import com.bacarsa.inventario.models.Estado;
import com.bacarsa.inventario.models.PerifericoManual;
import com.bacarsa.inventario.models.Router;
import com.bacarsa.inventario.models.SwitchRed;
import com.bacarsa.inventario.models.Televisor;
import com.bacarsa.inventario.models.TipoEquipo;
import com.bacarsa.inventario.models.Ubicacion;
import com.bacarsa.inventario.models.UbicacionRed;
import com.bacarsa.inventario.repository.MergeCodigoInterno;

class StockProyeccionTest {

    @Test
    void unaUnidadDeCadaTipoEntraConSuCodigoYLosCamposQueLaFichaTiene() {
        List<FichaLectura> fichas = unidadesDeCadaTipo();

        List<UnidadStockDTO> lista = listar(fichas);

        assertEquals(8, lista.size());
        assertUnidad(lista.get(0), "PC-1", "desktop", "", "", "SN-PC", "usada", "En depósito", "", "SISTEMAS");
        assertUnidad(lista.get(1), "TEC-4", "teclado", "Logitech", "", "SER-TEC", "", "Asignada", "2026-01-02", "sistemas");
        assertUnidad(lista.get(2), "CEL-2", "celular", "Samsung", "A15", "359999", "", "en_stock", "", "");
        assertUnidad(lista.get(3), "CAM-1", "camara", "Hikvision", "DS-2CD", "", "", "Activa", "2026-03-04", "Ingreso");
        assertUnidad(lista.get(4), "TV-1", "televisor", "LG", "55UP", "SER-TV", "", "activo", "", "");
        assertUnidad(lista.get(5), "RTR-3", "router", "Mikrotik", "hAP", "SER-RTR", "", "En rack", "2026-04-01", "RACK_PRINCIPAL");
        assertUnidad(lista.get(6), "SW-1", "switch", "Cisco", "C9200", "SER-SW", "", "En rack", "2026-04-02", "RACK_SECUNDARIO");
        assertUnidad(lista.get(7), "AP-1", "access_point", "Ubiquiti", "U6", "", "", "activo", "", "MONITOREO");
    }

    @Test
    void prefijosDePerifericoYSiguienteNumeroEsElMaximoMasUno() {
        String[][] tipos = {
                { "monitor", "MON" },
                { "teclado", "TEC" },
                { "mouse", "MOU" },
                { "impresora", "IMP" },
                { "webcam", "WEB" },
                { "parlante", "PAR" },
                { "microfono", "MIC" },
        };
        List<FichaLectura> fichas = new ArrayList<>();
        for (String[] tipo : tipos) {
            PerifericoManual ya = new PerifericoManual();
            ya.setId(tipo[0] + "-viejo");
            ya.setTipo(tipo[0]);
            ya.setCantidad(1);
            ya.setCodigoInterno(tipo[1] + "-12");
            PerifericoManual nuevo = new PerifericoManual();
            nuevo.setId(tipo[0] + "-nuevo");
            nuevo.setTipo(tipo[0]);
            nuevo.setCantidad(1);
            fichas.add(ProyeccionStock.desdePeriferico(ya));
            fichas.add(ProyeccionStock.desdePeriferico(nuevo));
        }
        List<String> escritos = new ArrayList<>();
        CodigoInternoBackfill.ejecutar(fichas, (coleccion, id, codigo) -> escritos.add(id + "=" + codigo));
        assertEquals(List.of(
                "monitor-nuevo=MON-13",
                "teclado-nuevo=TEC-13",
                "mouse-nuevo=MOU-13",
                "impresora-nuevo=IMP-13",
                "webcam-nuevo=WEB-13",
                "parlante-nuevo=PAR-13",
                "microfono-nuevo=MIC-13"), escritos);
    }

    @Test
    void notebookPorContainsYCamposVaciosDePc() {
        Computadora notebook = new Computadora();
        notebook.setUuid("nb-1");
        notebook.setCodigoInterno("NB-8");
        notebook.setTipoEquipo(tipo("HP Notebook 15"));
        notebook.setSerialEquipo("SN-NB");
        notebook.setCondicion("nueva");

        FichaLectura ficha = ProyeccionStock.desdeComputadora(notebook);
        UnidadStockDTO dto = ficha.aDto();

        assertEquals("notebook", dto.getTipo());
        assertEquals("NB", ficha.getPrefijo());
        assertEquals("", dto.getMarca());
        assertEquals("", dto.getModelo());
        assertEquals("", dto.getFechaIngreso());
        assertEquals("SN-NB", dto.getSerieOImei());
        assertEquals("nueva", dto.getCondicion());
    }

    @Test
    void sinCodigoOTipoDesconocidoNoEntraYNombraColeccionEId() {
        Computadora sinCodigo = desktop("pc-sin", null);
        Computadora mini = new Computadora();
        mini.setUuid("mini-1");
        mini.setCodigoInterno("PC-9");
        mini.setTipoEquipo(tipo("mini_pc"));
        PerifericoManual lote = teclado("lot-1", "TEC-1");
        lote.setCantidad(0);

        List<String> omitidas = new ArrayList<>();
        List<UnidadStockDTO> lista = listar(
                List.of(
                        ProyeccionStock.desdeComputadora(sinCodigo),
                        ProyeccionStock.desdeComputadora(mini),
                        ProyeccionStock.desdePeriferico(lote)),
                omitidas);

        assertTrue(lista.isEmpty());
        assertEquals(3, omitidas.size());
        assertTrue(omitidas.get(0).contains("coleccion=computadoras"));
        assertTrue(omitidas.get(0).contains("id=pc-sin"));
        assertTrue(omitidas.get(1).contains("coleccion=computadoras"));
        assertTrue(omitidas.get(1).contains("id=mini-1"));
        assertTrue(omitidas.get(2).contains("coleccion=perifericos_manuales"));
        assertTrue(omitidas.get(2).contains("id=lot-1"));
    }

    @Test
    void cantidadDistintaDeUnoNoEntra() {
        PerifericoManual cero = teclado("p0", null);
        cero.setCantidad(0);
        PerifericoManual otra = teclado("p2", null);
        otra.setCantidad(3);

        FichaLectura fichaCero = ProyeccionStock.desdePeriferico(cero);
        FichaLectura fichaOtra = ProyeccionStock.desdePeriferico(otra);

        assertFalse(fichaCero.entraEnListado());
        assertFalse(fichaOtra.entraEnListado());
        assertNull(fichaCero.getPrefijo());
        assertEquals("cantidad_distinta_de_1", fichaCero.getMotivoOmitir());
        assertEquals("cantidad_distinta_de_1", fichaOtra.getMotivoOmitir());
    }

    @Test
    void segundaCorridaNoCambiaCodigosYaEscritos() {
        Computadora conCodigo = desktop("pc-vieja", "PC-3");
        Computadora nueva = desktop("pc-nueva", null);
        List<FichaLectura> primeraLectura = List.of(
                ProyeccionStock.desdeComputadora(conCodigo),
                ProyeccionStock.desdeComputadora(nueva));
        List<String> escritos = new ArrayList<>();

        CodigoInternoBackfill.Resultado primera = CodigoInternoBackfill.ejecutar(
                primeraLectura,
                (coleccion, id, codigo) -> escritos.add(id + "=" + codigo));

        assertEquals(1, primera.escritos());
        assertEquals(List.of("pc-nueva=PC-4"), escritos);

        nueva.setCodigoInterno("PC-4");
        List<String> segundaEscritura = new ArrayList<>();
        CodigoInternoBackfill.Resultado segunda = CodigoInternoBackfill.ejecutar(
                List.of(
                        ProyeccionStock.desdeComputadora(conCodigo),
                        ProyeccionStock.desdeComputadora(nueva)),
                (coleccion, id, codigo) -> segundaEscritura.add(codigo));

        assertEquals(0, segunda.escritos());
        assertTrue(segundaEscritura.isEmpty());
        assertEquals("PC-3", conCodigo.getCodigoInterno());
        assertEquals("PC-4", nueva.getCodigoInterno());
    }

    @Test
    void corteDeBackfillNoPisaElRestoDeLaFichaYAlReanudarCompletaSoloSinCodigo() {
        Map<String, Object> primeraFicha = new HashMap<>();
        primeraFicha.put("hostname", "caja-1");
        primeraFicha.put("serial_equipo", "SN-1");
        primeraFicha.put("marca", "Dell");
        Map<String, Object> segundaFicha = new HashMap<>();
        segundaFicha.put("hostname", "caja-2");
        segundaFicha.put("serial_equipo", "SN-2");
        segundaFicha.put("marca", "HP");
        Map<String, Map<String, Object>> documentos = new HashMap<>();
        documentos.put("pc-1", primeraFicha);
        documentos.put("pc-2", segundaFicha);

        Computadora primera = desktop("pc-1", null);
        Computadora segunda = desktop("pc-2", null);
        int[] escrituras = { 0 };

        CodigoInternoBackfill.Resultado cortada = CodigoInternoBackfill.ejecutar(
                List.of(ProyeccionStock.desdeComputadora(primera), ProyeccionStock.desdeComputadora(segunda)),
                (coleccion, id, codigo) -> {
                    assertEquals(Map.of(MergeCodigoInterno.CAMPO, codigo), MergeCodigoInterno.unSoloCampo(codigo));
                    if (escrituras[0] == 1) {
                        throw new IllegalStateException("corte");
                    }
                    MergeCodigoInterno.aplicar(documentos.get(id), codigo);
                    escrituras[0]++;
                });

        assertEquals(1, cortada.escritos());
        assertEquals(List.of("coleccion=computadoras id=pc-2"), cortada.fallos());
        assertEquals("PC-1", primeraFicha.get(MergeCodigoInterno.CAMPO));
        assertEquals("caja-1", primeraFicha.get("hostname"));
        assertEquals("SN-1", primeraFicha.get("serial_equipo"));
        assertEquals("Dell", primeraFicha.get("marca"));
        assertEquals(4, primeraFicha.size());
        assertFalse(segundaFicha.containsKey(MergeCodigoInterno.CAMPO));
        assertEquals("caja-2", segundaFicha.get("hostname"));
        assertEquals("SN-2", segundaFicha.get("serial_equipo"));
        assertEquals("HP", segundaFicha.get("marca"));

        primera.setCodigoInterno("PC-1");
        CodigoInternoBackfill.Resultado reanudada = CodigoInternoBackfill.ejecutar(
                List.of(ProyeccionStock.desdeComputadora(primera), ProyeccionStock.desdeComputadora(segunda)),
                (coleccion, id, codigo) -> MergeCodigoInterno.aplicar(documentos.get(id), codigo));

        assertEquals(1, reanudada.escritos());
        assertEquals("PC-1", primeraFicha.get(MergeCodigoInterno.CAMPO));
        assertEquals("Dell", primeraFicha.get("marca"));
        assertEquals("PC-2", segundaFicha.get(MergeCodigoInterno.CAMPO));
        assertEquals("HP", segundaFicha.get("marca"));
        assertEquals("caja-2", segundaFicha.get("hostname"));
        assertEquals("SN-2", segundaFicha.get("serial_equipo"));
    }

    private static List<UnidadStockDTO> listar(List<FichaLectura> fichas) {
        return listar(fichas, new ArrayList<>());
    }

    private static List<UnidadStockDTO> listar(List<FichaLectura> fichas, List<String> omitidas) {
        List<UnidadStockDTO> salida = new ArrayList<>();
        for (FichaLectura ficha : fichas) {
            if (!ficha.entraEnListado()) {
                omitidas.add(ficha.referencia());
                continue;
            }
            salida.add(ficha.aDto());
        }
        return salida;
    }

    private static List<FichaLectura> unidadesDeCadaTipo() {
        Computadora pc = desktop("pc-1", "PC-1");
        pc.setSerialEquipo("SN-PC");
        pc.setCondicion("usada");
        pc.setUbicacion(Ubicacion.SISTEMAS);
        pc.setEstadoActual(estado("En depósito"));
        EspecificacionStock specPc = new EspecificacionStock();
        specPc.setCondicion("NO-COPIAR-SPEC");
        pc.setEspecificacionEsperada(specPc);

        PerifericoManual teclado = teclado("tec-1", "TEC-4");
        teclado.setFabricante("Logitech");
        teclado.setNumeroSerie("SER-TEC");
        teclado.setFechaAlta("2026-01-02");
        teclado.setUbicacion("sistemas");
        teclado.setEstadoActual(estado("Asignada"));
        EspecificacionStock specPeriferico = new EspecificacionStock();
        specPeriferico.setCondicion("NO-COPIAR-SPEC");
        teclado.setEspecificacionStock(specPeriferico);

        Celular celular = new Celular();
        celular.setId("cel-1");
        celular.setCodigoInterno("CEL-2");
        celular.setMarca("Samsung");
        celular.setModelo("A15");
        celular.setImei("359999");
        celular.setCondicion("NO-COPIAR-CELULAR");
        celular.setEstado("en_stock");
        celular.setArea("NO-COPIAR-AREA");

        Camara camara = new Camara();
        camara.setId("cam-1");
        camara.setCodigoInterno("CAM-1");
        camara.setMarca("Hikvision");
        camara.setTipo("DS-2CD");
        camara.setFechaAlta("2026-03-04");
        camara.setUbicacion("Ingreso");
        camara.setEstadoActual(estado("Activa"));

        Televisor tv = new Televisor();
        tv.setId("tv-1");
        tv.setCodigoInterno("TV-1");
        tv.setMarca("LG");
        tv.setModelo("55UP");
        tv.setNumeroSerie("SER-TV");
        tv.setEstado("activo");
        tv.setArea("NO-COPIAR-AREA");

        Router router = new Router();
        router.setId("rtr-1");
        router.setCodigoInterno("RTR-3");
        router.setMarca("Mikrotik");
        router.setModelo("hAP");
        router.setNumeroSerie("SER-RTR");
        router.setFechaAlta("2026-04-01");
        router.setSitio("NO-COPIAR-SITIO");
        router.setUbicacion(UbicacionRed.RACK_PRINCIPAL);
        router.setEstado("baja");
        router.setEstadoActual(estado("En rack"));

        SwitchRed sw = new SwitchRed();
        sw.setId("sw-1");
        sw.setCodigoInterno("SW-1");
        sw.setTipo("UNMANAGED");
        sw.setMarca("Cisco");
        sw.setModelo("C9200");
        sw.setNumeroSerie("SER-SW");
        sw.setFechaAlta("2026-04-02");
        sw.setSitio("NO-COPIAR-SITIO");
        sw.setUbicacion(UbicacionRed.RACK_SECUNDARIO);
        sw.setEstadoActual(estado("En rack"));

        AccessPoint ap = new AccessPoint();
        ap.setId("ap-1");
        ap.setCodigoInterno("AP-1");
        ap.setMarca("Ubiquiti");
        ap.setModelo("U6");
        ap.setMac("AA:BB:CC:DD:EE:FF");
        ap.setEstado("activo");
        ap.setUbicacion(UbicacionRed.MONITOREO);

        return List.of(
                ProyeccionStock.desdeComputadora(pc),
                ProyeccionStock.desdePeriferico(teclado),
                ProyeccionStock.desdeCelular(celular),
                ProyeccionStock.desdeCamara(camara),
                ProyeccionStock.desdeTelevisor(tv),
                ProyeccionStock.desdeRouter(router),
                ProyeccionStock.desdeSwitch(sw),
                ProyeccionStock.desdeAccessPoint(ap));
    }

    private static void assertUnidad(
            UnidadStockDTO dto,
            String codigo,
            String tipo,
            String marca,
            String modelo,
            String serie,
            String condicion,
            String estado,
            String fecha,
            String ubicacion) {
        assertEquals(codigo, dto.getCodigo());
        assertEquals(tipo, dto.getTipo());
        assertEquals(marca, dto.getMarca());
        assertEquals(modelo, dto.getModelo());
        assertEquals(serie, dto.getSerieOImei());
        assertEquals(condicion, dto.getCondicion());
        assertEquals(estado, dto.getEstadoDeposito());
        assertEquals(fecha, dto.getFechaIngreso());
        assertEquals(ubicacion, dto.getUbicacion());
    }

    private static Computadora desktop(String uuid, String codigo) {
        Computadora computadora = new Computadora();
        computadora.setUuid(uuid);
        computadora.setCodigoInterno(codigo);
        computadora.setTipoEquipo(tipo("desktop"));
        return computadora;
    }

    private static PerifericoManual teclado(String id, String codigo) {
        PerifericoManual periferico = new PerifericoManual();
        periferico.setId(id);
        periferico.setCodigoInterno(codigo);
        periferico.setTipo("Teclado");
        periferico.setCantidad(1);
        return periferico;
    }

    private static TipoEquipo tipo(String tipo) {
        TipoEquipo tipoEquipo = new TipoEquipo();
        tipoEquipo.setTipo(tipo);
        return tipoEquipo;
    }

    private static Estado estado(String nombre) {
        Estado estado = new Estado();
        estado.setNombre(nombre);
        return estado;
    }
}
