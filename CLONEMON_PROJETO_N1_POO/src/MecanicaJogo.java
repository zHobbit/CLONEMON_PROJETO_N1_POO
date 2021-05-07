import java.util.Scanner;

public class MecanicaJogo {
	
    static Ataques cuspe = new Ataques("Cuspe", Elementos.AGUA, 5);
    static Ataques vapPressao = new Ataques("Vap de alta pressao", Elementos.AGUA, 10);
    static Ataques pedrada = new Ataques("Pedrada", Elementos.ROCHA, 5);
    static Ataques meteoro = new Ataques("Meteoro", Elementos.ROCHA, 10);
    static Ataques molotov = new Ataques("Molotov", Elementos.FOGO, 5);
    static Ataques fogoBabilonia = new Ataques("Fogo na Babilonia", Elementos.FOGO, 10);
    static Ataques cuboGelo = new Ataques("Cubo de Gelo", Elementos.GELO, 5);
    static Ataques ficaFrio = new Ataques("Fica frio ai", Elementos.GELO, 10);
    static Ataques papel = new Ataques("Corte de papel A4", Elementos.GRAMA, 5);
    static Ataques cartolinada = new Ataques("Cartolinada", Elementos.GRAMA, 10);
    static Ataques volt = new Ataques("Volt", Elementos.RAIO, 5);
    static Ataques bivolt = new Ataques("Bivolt", Elementos.RAIO, 10);
    
    static Monstros lindoya = new Monstros(1, "Lindoya", Elementos.AGUA, 100, 25, 25, 50, cuspe, vapPressao);      
    static Monstros coiso = new Monstros(2, "Coiso", Elementos.ROCHA, 100, 40, 40, 20, pedrada, meteoro);        
    static Monstros lucifer = new Monstros(3, "Lucifer", Elementos.FOGO, 100, 45, 25, 30, molotov, fogoBabilonia);
    static Monstros gelado = new Monstros(4, "Gelado", Elementos.GELO, 100, 30, 10, 60, cuboGelo, ficaFrio);
    static Monstros groot = new Monstros(5, "Groot", Elementos.GRAMA, 120, 35, 15, 30, papel, cartolinada);
    static Monstros eletroPaulo = new Monstros(6, "EletroPaulo", Elementos.RAIO, 100, 25, 20, 55, volt, bivolt);
    
	
	public void NovaPartida() {
		
		Player player1 = new Player();
		Scanner escolhaClonemon = new Scanner(System.in);
		int indiceClonemon = 1;
		boolean monstroRepetido = false;
		
		System.out.println("\n\n\nVamos comecar!");
		
		for(int i = 0;i < 3;i++) {
		
			System.out.println("\nEscolha seu "+ indiceClonemon + "th CLONEMON treinador 1:\n");
			lindoya.PrintMonstro();
			coiso.PrintMonstro();
			lucifer.PrintMonstro();
			gelado.PrintMonstro();
			groot.PrintMonstro();
			eletroPaulo.PrintMonstro();
			do {
				do {
					System.out.println("\n\nDigite o ID do CLONEMON que deseja escolher para sua equipe treinador 1:");
					player1.monstrosPlayer[i]= escolhaClonemon.nextInt();
						if (player1.monstrosPlayer[i] < 1 || player1.monstrosPlayer[i] > 6) {
							System.out.println("\nO ID escolhido nao existe! Escolha outro.");
						}
				}while(player1.monstrosPlayer[i] < 1 || player1.monstrosPlayer[i] > 6);
					if (i >= 1) {
						if (player1.monstrosPlayer[0] == player1.monstrosPlayer[1] || player1.monstrosPlayer[0] == 
							player1.monstrosPlayer[2] || player1.monstrosPlayer[1] == player1.monstrosPlayer[2]) {
							monstroRepetido = true;
							System.out.println("\nVoce ja escolheu um CLONEMON igual a este! Escolha outro.");
						}else monstroRepetido = false;
					}
			}while(monstroRepetido == true);	
		indiceClonemon++;

		}
		
		player1.ConverteID();
		player1.PrintEquipe();
		
		Player player2 = new Player();
		int indiceClonemonP2 = 1;
		
		System.out.println("\n\n\nVamos comecar!");
		
		for(int i = 0;i < 3;i++) {
		
			System.out.println("\nEscolha seu "+ indiceClonemonP2 + "th CLONEMON treinador 2:\n");
			lindoya.PrintMonstro();
			coiso.PrintMonstro();
			lucifer.PrintMonstro();
			gelado.PrintMonstro();
			groot.PrintMonstro();
			eletroPaulo.PrintMonstro();
			do {
				do {
					System.out.println("\n\nDigite o ID do CLONEMON que deseja escolher para sua equipe treinador 2:");
					player2.monstrosPlayer[i]= escolhaClonemon.nextInt();
						if (player2.monstrosPlayer[i] < 1 || player2.monstrosPlayer[i] > 6) {
							System.out.println("\nO ID escolhido nao existe! Escolha outro.");
						}
				}while(player2.monstrosPlayer[i] < 1 || player2.monstrosPlayer[i] > 6);
					if (i >= 1) {
						if (player2.monstrosPlayer[0] == player2.monstrosPlayer[1] || player2.monstrosPlayer[0] == 
								player2.monstrosPlayer[2] || player2.monstrosPlayer[1] == player2.monstrosPlayer[2]) {
							monstroRepetido = true;
							System.out.println("\nVoce ja escolheu um CLONEMON igual a este! Escolha outro.");
						}else monstroRepetido = false;
					}
			}while(monstroRepetido == true);	
		indiceClonemonP2++;

		}
		
		player2.ConverteID();
		player2.PrintEquipe();
	}

}
