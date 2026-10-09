//VERSAO FINAL
public class Monstros {
   
    private String nome;
    private Elementos tipo;
    private int id, forca, velocidade;
    private double vida, defesa;
    private Ataques ataque;
    private Ataques ataqueEspecial;

    public Monstros(int id, String nome, Elementos tipo, int vida, int forca, int defesa, int velocidade, Ataques ataque, Ataques ataqueEspecial){
    	
        this.id = id;
        this.nome = nome;
        this.tipo = tipo;
        this.vida = vida * 10;
        this.forca = forca;
        this.defesa = defesa * 10;
        this.velocidade = velocidade;
        this.ataque = ataque;
        this.ataqueEspecial = ataqueEspecial;

    }
    
    public void PrintMonstro(){
    	
        System.out.println("ID: " + this.id + "\nNome: " + this.nome + "\nElemento: " + this.tipo.descricao + "\nVida: " + this.vida + "\nForca: " + this.forca + 
        "\nDefesa: " + this.defesa + "\nVelocidade: " + this.velocidade + "\nAtaque: " + this.ataque.getNome() + "\nAtaque Especial: " + this.ataqueEspecial.getNome() +"\n");

    }
    
    public boolean EstaVivo(){
    	
    	if (this.vida > 0) {
    		return true;
    		
    	}else  return false;
    	
    }
    
    public float AtacarNormal() {
    
    	return this.forca * this.ataque.getDano();
    	
    }
    
    public float AtacarEspecial() {
    	
    	return this.forca * this.ataqueEspecial.getDano();
    	
    }
    
    public double SofrerDano(double danoSofrido,double vidaRestante, Elementos tipoMonstroAtak, Elementos tipoMnstroDef) {
    	
    	if(tipoMonstroAtak == Elementos.AGUA && tipoMnstroDef == Elementos.ROCHA) {
    		danoSofrido = danoSofrido * 2;
    	}else if(tipoMonstroAtak == Elementos.ROCHA && tipoMnstroDef == Elementos.FOGO) {
    		danoSofrido = danoSofrido * 2;
    	}else if(tipoMonstroAtak == Elementos.FOGO && tipoMnstroDef == Elementos.GELO) {
    		danoSofrido = danoSofrido * 2;
    	}else if(tipoMonstroAtak == Elementos.GELO && tipoMnstroDef == Elementos.GRAMA) {
    		danoSofrido = danoSofrido * 2;
    	}else if(tipoMonstroAtak == Elementos.GRAMA && tipoMnstroDef == Elementos.RAIO) {
    		danoSofrido = danoSofrido * 2;
    	}else if(tipoMonstroAtak == Elementos.RAIO && tipoMnstroDef == Elementos.AGUA) {
    		danoSofrido = danoSofrido * 2;
    	}else if(tipoMonstroAtak == Elementos.RAIO && tipoMnstroDef == Elementos.GRAMA) {
    		danoSofrido = danoSofrido / 2;
    	}else if(tipoMonstroAtak == Elementos.GRAMA && tipoMnstroDef == Elementos.GELO) {
    		danoSofrido = danoSofrido / 2;
    	}else if(tipoMonstroAtak == Elementos.GELO && tipoMnstroDef == Elementos.FOGO) {
    		danoSofrido = danoSofrido / 2;
    	}else if(tipoMonstroAtak == Elementos.FOGO && tipoMnstroDef == Elementos.ROCHA) {
    		danoSofrido = danoSofrido / 2;
    	}else if(tipoMonstroAtak == Elementos.ROCHA && tipoMnstroDef == Elementos.AGUA) {
    		danoSofrido = danoSofrido / 2;
    	}else if(tipoMonstroAtak == Elementos.AGUA && tipoMnstroDef == Elementos.RAIO) {
    		danoSofrido = danoSofrido / 2;
    	}
    	danoSofrido = danoSofrido - this.defesa * 0.15;
		return vidaRestante - danoSofrido;
    	
    }
    
    public boolean SuperEfetivo(Elementos tipoMonstroAtak, Elementos tipoMnstroDef) {
    	
    	if(tipoMonstroAtak == Elementos.AGUA && tipoMnstroDef == Elementos.ROCHA) {
    		return true;
    	}else if(tipoMonstroAtak == Elementos.ROCHA && tipoMnstroDef == Elementos.FOGO) {
    		return true;
    	}else if(tipoMonstroAtak == Elementos.FOGO && tipoMnstroDef == Elementos.GELO) {
    		return true;
    	}else if(tipoMonstroAtak == Elementos.GELO && tipoMnstroDef == Elementos.GRAMA) {
    		return true;
    	}else if(tipoMonstroAtak == Elementos.GRAMA && tipoMnstroDef == Elementos.RAIO) {
    		return true;
    	}else if(tipoMonstroAtak == Elementos.RAIO && tipoMnstroDef == Elementos.AGUA) {
    		return true;
    	}else return false;
    }
    
    public boolean PoucoEfetivo(Elementos tipoMonstroAtak, Elementos tipoMnstroDef) {
    	
    	if(tipoMonstroAtak == Elementos.RAIO && tipoMnstroDef == Elementos.GRAMA) {
    		return true;
    	}else if(tipoMonstroAtak == Elementos.GRAMA && tipoMnstroDef == Elementos.GELO) {
    		return true;
    	}else if(tipoMonstroAtak == Elementos.GELO && tipoMnstroDef == Elementos.FOGO) {
    		return true;
    	}else if(tipoMonstroAtak == Elementos.FOGO && tipoMnstroDef == Elementos.ROCHA) {
    		return true;
    	}else if(tipoMonstroAtak == Elementos.ROCHA && tipoMnstroDef == Elementos.AGUA) {
    		return true;
    	}else if(tipoMonstroAtak == Elementos.AGUA && tipoMnstroDef == Elementos.RAIO) {
    		return true;
    	}else return false;
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

	public double getVida() {
		return vida;
	}

	public void setVida(double vida) {
		this.vida = vida;
	}

	public int getForca() {
		return forca;
	}

	public void setForca(int forca) {
		this.forca = forca;
	}

	public double getDefesa() {
		return defesa;
	}

	public void setDefesa(double defesa) {
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
