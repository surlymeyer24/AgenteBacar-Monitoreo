package com.bacarsa.inventario.config;

import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.boot.web.servlet.FilterRegistrationBean;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.core.Ordered;

import com.bacarsa.inventario.security.FirebaseTokenFilter;
import com.bacarsa.inventario.security.RoleAuthorizationFilter;

@Configuration
public class FilterConfig {

    @Bean
    @ConditionalOnProperty(name = "app.security.firebase-filter.enabled", havingValue = "true")
    public FilterRegistrationBean<FirebaseTokenFilter> firebaseTokenFilter() {
        FilterRegistrationBean<FirebaseTokenFilter> bean = new FilterRegistrationBean<>(new FirebaseTokenFilter());
        bean.addUrlPatterns("/api/*");
        bean.setOrder(Ordered.HIGHEST_PRECEDENCE + 1);
        return bean;
    }

    @Bean
    @ConditionalOnProperty(name = "app.security.firebase-filter.enabled", havingValue = "true")
    public FilterRegistrationBean<RoleAuthorizationFilter> roleAuthorizationFilterRegistration(
            RoleAuthorizationFilter filter) {
        FilterRegistrationBean<RoleAuthorizationFilter> bean = new FilterRegistrationBean<>(filter);
        bean.addUrlPatterns("/api/*");
        bean.setOrder(Ordered.HIGHEST_PRECEDENCE + 2);
        return bean;
    }
}
