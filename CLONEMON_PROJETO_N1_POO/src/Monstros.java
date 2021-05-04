
public class Monstros {
   
    String nome;
    Elementos tipo;
    int id, vida, forca, defesa, velocidade;
    Ataques ataque;
    Ataques ataqueEspecial;

    public Monstros(int id, String nome, Elementos tipo, int vida, int forca, int defesa, int velocidade, Ataques ataque, Ataques ataqueEspecial){
    	
        this.id = id;
        this.nome = nome;
        this.tipo = tipo;
        this.vida = vida;
        this.forca = forca;
        this.defesa = defesa;
        this.velocidade = velocidade;
        this.ataque = ataque;
        this.ataqueEspecial = ataqueEspecial;

    }
    
}
