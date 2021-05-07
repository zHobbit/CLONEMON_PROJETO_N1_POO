
public class Monstros {
   
    private String nome;
    private Elementos tipo;
    private int id, vida, forca, defesa, velocidade;
    private Ataques ataque;
    private Ataques ataqueEspecial;

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

	public String getNome() {
		return nome;
	}

	public void setNome(String nome) {
		this.nome = nome;
	}

	public Elementos getTipo() {
		return tipo;
	}

	public void setTipo(Elementos tipo) {
		this.tipo = tipo;
	}

	public int getId() {
		return id;
	}

	public void setId(int id) {
		this.id = id;
	}

	public int getVida() {
		return vida;
	}

	public void setVida(int vida) {
		this.vida = vida;
	}

	public int getForca() {
		return forca;
	}

	public void setForca(int forca) {
		this.forca = forca;
	}

	public int getDefesa() {
		return defesa;
	}

	public void setDefesa(int defesa) {
		this.defesa = defesa;
	}

	public int getVelocidade() {
		return velocidade;
	}

	public void setVelocidade(int velocidade) {
		this.velocidade = velocidade;
	}

	public Ataques getAtaque() {
		return ataque;
	}

	public void setAtaque(Ataques ataque) {
		this.ataque = ataque;
	}

	public Ataques getAtaqueEspecial() {
		return ataqueEspecial;
	}

	public void setAtaqueEspecial(Ataques ataqueEspecial) {
		this.ataqueEspecial = ataqueEspecial;
	}
    
    
    
}
