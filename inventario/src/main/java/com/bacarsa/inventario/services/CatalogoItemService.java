package com.bacarsa.inventario.services;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.concurrent.ExecutionException;
import java.util.regex.Pattern;
import java.util.stream.Collectors;

import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import com.bacarsa.inventario.dto.CatalogoItemCreateDTO;
import com.bacarsa.inventario.dto.CatalogoItemDTO;
import com.bacarsa.inventario.dto.CatalogoItemUpdateDTO;
import com.bacarsa.inventario.mapper.CatalogoItemMapper;
import com.bacarsa.inventario.models.CatalogoItem;
import com.bacarsa.inventario.repository.CatalogoItemRepository;

@Service
public class CatalogoItemService {

    private static final Pattern CODIGO_PATTERN = Pattern.compile("^[a-z][a-z0-9]*(_[a-z0-9]+)*$");

    private final CatalogoItemRepository repository;

    public CatalogoItemService(CatalogoItemRepository repository) {
        this.repository = repository;
    }

    public List<CatalogoItemDTO> listar(String catalogo, boolean incluirInactivos)
            throws ExecutionException, InterruptedException {
        List<CatalogoItem> items = incluirInactivos
                ? repository.findByCatalogo(catalogo)
                : repository.findByCatalogoActivos(catalogo);
        return items.stream().map(CatalogoItemMapper::toDTO).collect(Collectors.toList());
    }

    public CatalogoItemDTO obtener(String catalogo, String codigo)
            throws ExecutionException, InterruptedException {
        String id = catalogo + "_" + codigo;
        return repository.findById(id)
                .map(CatalogoItemMapper::toDTO)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND,
                        "Item no encontrado: " + catalogo + "/" + codigo));
    }

    public CatalogoItemDTO crear(String catalogo, CatalogoItemCreateDTO dto)
            throws ExecutionException, InterruptedException {
        String codigo = dto.getCodigo().trim().toLowerCase();
        validarCodigo(codigo);

        String id = catalogo + "_" + codigo;
        if (repository.findById(id).isPresent()) {
            throw new ResponseStatusException(HttpStatus.CONFLICT,
                    "Ya existe un item con código '" + codigo + "' en el catálogo '" + catalogo + "'");
        }

        CatalogoItem item = CatalogoItemMapper.toModel(catalogo, dto);

        if (dto.getOrden() != null) {
            item.setOrden(dto.getOrden());
        } else {
            item.setOrden(calcularSiguienteOrden(catalogo));
        }

        repository.save(item);
        return CatalogoItemMapper.toDTO(item);
    }

    public CatalogoItemDTO actualizar(String catalogo, String codigo, CatalogoItemUpdateDTO dto)
            throws ExecutionException, InterruptedException {
        String id = catalogo + "_" + codigo;
        CatalogoItem existente = repository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND,
                        "Item no encontrado: " + catalogo + "/" + codigo));

        Map<String, Object> campos = new HashMap<>();
        if (dto.getLabel() != null && !dto.getLabel().isBlank()) {
            campos.put("label", dto.getLabel().trim());
            existente.setLabel(dto.getLabel().trim());
        }
        if (dto.getActivo() != null) {
            campos.put("activo", dto.getActivo());
            existente.setActivo(dto.getActivo());
        }
        if (dto.getOrden() != null) {
            campos.put("orden", dto.getOrden());
            existente.setOrden(dto.getOrden());
        }
        if (dto.getIcono() != null) {
            campos.put("icono", dto.getIcono().isBlank() ? null : dto.getIcono().trim());
            existente.setIcono(dto.getIcono().isBlank() ? null : dto.getIcono().trim());
        }

        if (!campos.isEmpty()) {
            repository.actualizar(id, campos);
        }
        return CatalogoItemMapper.toDTO(existente);
    }

    public CatalogoItemDTO cambiarActivo(String catalogo, String codigo, boolean activo)
            throws ExecutionException, InterruptedException {
        String id = catalogo + "_" + codigo;
        CatalogoItem existente = repository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND,
                        "Item no encontrado: " + catalogo + "/" + codigo));

        Map<String, Object> campos = new HashMap<>();
        campos.put("activo", activo);
        repository.actualizar(id, campos);
        existente.setActivo(activo);
        return CatalogoItemMapper.toDTO(existente);
    }

    private static void validarCodigo(String codigo) {
        if (!CODIGO_PATTERN.matcher(codigo).matches()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                    "Código inválido: solo letras minúsculas, números y guión bajo (ej: 'auricular', 'camara_ip')");
        }
    }

    private int calcularSiguienteOrden(String catalogo) throws ExecutionException, InterruptedException {
        List<CatalogoItem> items = repository.findByCatalogo(catalogo);
        return items.stream()
                .mapToInt(CatalogoItem::getOrden)
                .max()
                .orElse(0) + 1;
    }
}
