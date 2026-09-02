package com.bacarsa.inventario.security;

import java.io.IOException;
import java.util.Set;
import java.util.concurrent.ExecutionException;

import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import com.bacarsa.inventario.models.Rol;
import com.bacarsa.inventario.models.Usuario;
import com.bacarsa.inventario.repository.UsuarioRepository;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;

@Component
public class RoleAuthorizationFilter extends OncePerRequestFilter {

    private static final Set<String> READ_METHODS = Set.of("GET", "HEAD");

    private final UsuarioRepository usuarioRepository;

    public RoleAuthorizationFilter(UsuarioRepository usuarioRepository) {
        this.usuarioRepository = usuarioRepository;
    }

    @Override
    protected void doFilterInternal(HttpServletRequest request,
            HttpServletResponse response,
            FilterChain filterChain) throws ServletException, IOException {

        String uid = (String) request.getAttribute("uid");
        if (uid == null) {
            filterChain.doFilter(request, response);
            return;
        }

        if ("OPTIONS".equalsIgnoreCase(request.getMethod())) {
            filterChain.doFilter(request, response);
            return;
        }

        final Rol rol;
        try {
            rol = resolveRol(uid);
        } catch (ExecutionException | InterruptedException e) {
            Thread.currentThread().interrupt();
            response.sendError(HttpServletResponse.SC_INTERNAL_SERVER_ERROR, "No se pudo verificar el rol");
            return;
        }

        request.setAttribute("rol", rol.name());

        String path = request.getServletPath();
        if (path == null || path.isBlank()) {
            path = request.getRequestURI();
        }
        String method = request.getMethod();

        if (rol == Rol.ADMINISTRADOR) {
            filterChain.doFilter(request, response);
            return;
        }

        if (rol == Rol.VISUALIZADOR) {
            if (isUsuarioManagementPath(path)) {
                response.sendError(HttpServletResponse.SC_FORBIDDEN, "Requiere rol de administrador");
                return;
            }
            if (!isReadMethod(method)) {
                response.sendError(HttpServletResponse.SC_FORBIDDEN, "Solo lectura: no puede modificar datos");
                return;
            }
        }

        if (rol == Rol.USUARIO) {
            if (isAdminPath(path) || isUsuarioManagementPath(path) || isInfraAdminMutation(path, method)
                    || isCacheMutation(path, method)) {
                response.sendError(HttpServletResponse.SC_FORBIDDEN, "Requiere rol de administrador");
                return;
            }
        }

        filterChain.doFilter(request, response);
    }

    private Rol resolveRol(String uid) throws ExecutionException, InterruptedException {
        return usuarioRepository.findById(uid)
                .filter(Usuario::isActivo)
                .map(Usuario::getRol)
                .filter(r -> r != null)
                .orElse(Rol.VISUALIZADOR);
    }

    private static boolean isReadMethod(String method) {
        return READ_METHODS.contains(method.toUpperCase());
    }

    private static boolean isAdminPath(String path) {
        return path.startsWith("/api/admin/");
    }

    private static boolean isUsuarioManagementPath(String path) {
        if ("/api/usuarios/me".equals(path)) {
            return false;
        }
        return path.startsWith("/api/usuarios");
    }

    private static boolean isCacheMutation(String path, String method) {
        return path.startsWith("/api/cache") && !isReadMethod(method);
    }

    private static boolean isInfraAdminMutation(String path, String method) {
        if (isReadMethod(method)) {
            return false;
        }
        return "/api/infraestructura/cambiar-tipo".equals(path)
                || "/api/infraestructura/limpiar-duplicados".equals(path);
    }

    @Override
    protected boolean shouldNotFilter(HttpServletRequest request) {
        return "OPTIONS".equalsIgnoreCase(request.getMethod());
    }
}
