//VERSAO FINAL
public enum Elementos {
	
    AGUA(1,"Agua"),
    ROCHA(2,"Rocha"),
    FOGO(3,"Fogo"),
    GELO(4,"Gelo"),
    GRAMA(5,"Grama"),
    RAIO(6,"Raio");

    public int valor;
    public String descricao;

    private Elementos(int valor, String descricao) {
    	this.valor = valor;
    	this.descricao = descricao;
	}

}
