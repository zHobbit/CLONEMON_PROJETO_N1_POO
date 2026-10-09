package br.clonemon;

import org.springframework.boot.SpringApplication;

public class TestClonemonApplication {

	public static void main(String[] args) {
		SpringApplication.from(ClonemonApplication::main).with(TestcontainersConfiguration.class).run(args);
	}

}
