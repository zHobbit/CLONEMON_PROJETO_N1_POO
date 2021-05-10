

public class Player {

	
	public int[] monstrosPlayer = new int [3];
	public Monstros[] monstroEquipe = new Monstros [3];
	
	public void PrintEquipe() {
		
		System.out.println("\nOs CLONEMONS escolhidos foram: " + monstroEquipe[0].getNome() + " " + monstroEquipe[1].getNome() + " " + monstroEquipe[2].getNome());
		
	}
	
	public void ConverteID() {
		
		for(int i = 0;i < 3;i++) {
			
				switch (monstrosPlayer[i]) {
	
	            case 1 : 
	                monstroEquipe[i] = MecanicaJogo.lindoya;
	                break;
	            
	            case 2 : 
	                monstroEquipe[i] = MecanicaJogo.coiso;
	                break;
	            
	            case 3 : 
	                monstroEquipe[i] = MecanicaJogo.lucifer;
	                break;
	            
	            case 4 : 
	                monstroEquipe[i] = MecanicaJogo.olaf;
	                break;
	          
	            case 5 : 
	                monstroEquipe[i] = MecanicaJogo.groot;
	                break;
	            
	            case 6 : 
	                monstroEquipe[i] = MecanicaJogo.eletroPaulo;
	                break;
	            
			}
		}
		
	}
	
	public boolean TemMonstros() {
		
		if (monstroEquipe[0].EstaVivo() == false && monstroEquipe[1].EstaVivo() == false  && monstroEquipe[2].EstaVivo() == false) {
			
			return false;
			
		}else return true;
		
	}
	
}
