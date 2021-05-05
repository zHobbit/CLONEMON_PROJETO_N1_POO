
public class Monstros {
   
    String nome;
    Elementos tipo;
    public int id, vida, forca, defesa, velocidade;
    Ataques ataque;
    Ataques ataqueEspecial;

    public Monstros(int id, String nome, Elementos tipo, int vida, int forca, int defesa, int velocidade, Ataques ataque, Ataques ataqueEspecial){
    	
        this.id = id;
        this.nome = nome;
        this.tipo = tipo;
        this.vida = vida * 10;
        this.forca = forca;
        this.defesa = defesa;
        this.velocidade = velocidade;
        this.ataque = ataque;
        this.ataqueEspecial = ataqueEspecial;

    }
    
    public void PrintMonstro(){
    	
        System.out.println("ID: " + this.id + "\nNome: " + this.nome + "\nElemento: " + this.tipo.descricao + "\nVida: " + this.vida + "\nForca: " + this.forca + "\nDefesa: " + this.defesa + "\nVelocidade: " + this.velocidade + "\nAtaque: " + this.ataque.getNome() + "\nAtaque Especial: " + this.ataqueEspecial.getNome() +"\n");

    }
    
    public boolean EstaVivo(){
    	
    	if (this.vida > 0) {
    		return true;
    		
    	}else  return false;
    	
    }
    
    public int AtacarNormal() {
    	
    	return this.forca * this.ataque.getDano();
    	
    }
    
    public int AtacarEspecial() {
    	
    	return this.forca * this.ataqueEspecial.getDano();
    	
    }
    
}
