package br.clonemon.web;

import br.clonemon.application.port.SpeciesCatalog;
import br.clonemon.web.dto.SpeciesDto;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/species")
class SpeciesController {
    private final SpeciesCatalog catalog;

    SpeciesController(SpeciesCatalog catalog) { this.catalog = catalog; }

    @GetMapping
    List<SpeciesDto> all() {
        return catalog.findAll().stream().map(SpeciesDto::of).toList();
    }
}
