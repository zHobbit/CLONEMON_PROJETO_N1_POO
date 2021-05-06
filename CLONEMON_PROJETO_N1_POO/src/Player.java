

public class Player extends MecanicaJogo {

	
	public int[] monstrosPlayer = new int [3];
	
	public Monstros[] monstroEquipe = new Monstros [3];
	
	public void PrintEquipe() {
		
		System.out.println("\nOs CLONEMONS escolhidos foram: " + monstroEquipe[0] + " " + monstroEquipe[1] + " " + monstroEquipe[2]);
		
	}
	
	public void ConverteID() {
		
		for(int i = 0;i > 3;i++) {
			
			switch (monstrosPlayer[i]) {
			
				case 1 : {
					Player.this.monstroEquipe[i] = MecanicaJogo.lindoya;
					break;
				}			
				case 2 : {
					Player.this.monstroEquipe[i] = MecanicaJogo.coiso;
					break;
				}			
				case 3 : {
					Player.this.monstroEquipe[i] = MecanicaJogo.lucifer;
					break;
				}			
				case 4 : {
					Player.this.monstroEquipe[i] = MecanicaJogo.gelado;
					break;
				}			
				case 5 : {
					Player.this.monstroEquipe[i] = MecanicaJogo.groot;
					break;
				}			
				case 6 : {
					Player.this.monstroEquipe[i] = MecanicaJogo.eletroPaulo;
					break;
				}	
			}
		}
		
	}
	
	public boolean TemMonstros() {
		
		if (monstroEquipe[0].EstaVivo() == false && monstroEquipe[1].EstaVivo() == false  && monstroEquipe[2].EstaVivo() == false) {
			
			return false;
			
		}else return true;
		
	}
	
}
