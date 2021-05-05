
public class Player extends MecanicaJogo {

	public int monstrosPlayer[];
	
	Monstros monstro[];
	
	public void PrintEquipe() {
		
		System.out.println("\nOs clonemons escolhidos foram:" + monstro[0] + "\n" + monstro[1] + "\n" + monstro[2]);
		
	}
	
	public void ConverteID() {
		
		for(int i = 0;i > 3;i++) {
			
			switch (monstrosPlayer[i]) {
			
				case 1 : {
					Player.this.monstro[i] = MecanicaJogo.lindoya;
					break;
				}			
				case 2 : {
					Player.this.monstro[i] = MecanicaJogo.coiso;
					break;
				}			
				case 3 : {
					Player.this.monstro[i] = MecanicaJogo.lucifer;
					break;
				}			
				case 4 : {
					Player.this.monstro[i] = MecanicaJogo.gelado;
					break;
				}			
				case 5 : {
					Player.this.monstro[i] = MecanicaJogo.groot;
					break;
				}			
				case 6 : {
					Player.this.monstro[i] = MecanicaJogo.eletroPaulo;
					break;
				}	
			}
		}
		
	}
	
	public boolean TemMonstros() {
		
		if (monstro[0].EstaVivo() == false && monstro[1].EstaVivo() == false  && monstro[2].EstaVivo() == false) {
			
			return false;
			
		}else return true;
		
	}
	
}
