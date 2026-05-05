package com.bacarsa.inventario.config;

import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.boot.web.servlet.FilterRegistrationBean;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import com.bacarsa.inventario.security.FirebaseTokenFilter;

@Configuration
public class FilterConfig {

    @Bean
    @ConditionalOnProperty(name = "app.security.firebase-filter.enabled", havingValue = "true")
    public FilterRegistrationBean<FirebaseTokenFilter> firebaseTokenFilter() {
        FilterRegistrationBean<FirebaseTokenFilter> bean = new FilterRegistrationBean<>(new FirebaseTokenFilter());
        bean.addUrlPatterns("/api/*");
        return bean;
    }
}
