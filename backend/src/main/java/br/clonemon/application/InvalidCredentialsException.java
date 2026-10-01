package br.clonemon.application;

public class InvalidCredentialsException extends RuntimeException {
    public InvalidCredentialsException() { super("Invalid username or password"); }
}
