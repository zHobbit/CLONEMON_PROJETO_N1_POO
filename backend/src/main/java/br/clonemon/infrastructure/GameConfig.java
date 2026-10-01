package br.clonemon.infrastructure;

import br.clonemon.domain.AiStrategy;
import br.clonemon.domain.DamageCalculator;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import java.util.Random;
import java.util.random.RandomGenerator;

@Configuration(proxyBeanMethods = false)
class GameConfig {

    /** {@link Random} e thread-safe, ao contrario da maioria dos RandomGenerator. */
    @Bean
    RandomGenerator gameRandom() {
        return new Random();
    }

    @Bean
    DamageCalculator damageCalculator(RandomGenerator rng) {
        return new DamageCalculator(rng);
    }

    /** Clonemons selvagens escolhem golpes ao acaso. */
    @Bean
    AiStrategy wildAi(RandomGenerator rng) {
        return AiStrategy.random(rng);
    }
}
