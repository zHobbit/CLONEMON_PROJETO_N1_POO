//VERSAO FINAL
public class Ataques {
	
    private String nome;
    private Elementos tipo;
	private int dano;
	
	public Ataques(String nome, Elementos tipo, int dano){
		
		this.nome = nome;
        this.tipo = tipo;
		this.dano = dano;
		
	}
		public String getNome(){
			return nome;
		}
		public Elementos getTipo(){
			return tipo;
		}
		public int getDano(){
			return dano;
		}

}