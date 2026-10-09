package br.clonemon.application;

/** A requisicao e valida mas conflita com o estado atual (ex.: batalha ja em andamento). */
public class ConflictException extends RuntimeException {
    public ConflictException(String message) { super(message); }
}
