package br.clonemon.infrastructure.persistence;

import org.springframework.context.annotation.Configuration;
import org.springframework.data.jpa.repository.config.EnableJpaRepositories;

/** Os repositorios Spring Data ficam aninhados nos adapters, escondidos do resto da aplicacao. */
@Configuration(proxyBeanMethods = false)
@EnableJpaRepositories(considerNestedRepositories = true)
class PersistenceConfig {}
