import java.util.Scanner;

public class MenuInterativo {
	public void MenuInterativoMet() {
		
		boolean isRunning = true;
		int respUsuario;
		Scanner entrada = new Scanner(System.in);
		
		while (isRunning == true) {
		System.out.println("---====Seja bem vindo ao CLONEMON====---");
		System.out.println("\n\n1 - Iniciar partida contra o computador");
		System.out.println("\n2 - Iniciar partida contra um amigo(localmente)");
		System.out.println("\n3 - Sair do jogo");
		System.out.println("\n\nResposta:");
		respUsuario = entrada.nextInt();

		
		switch (respUsuario) {
		
				case 1 : {
					MecanicaJogo newGameBot = new MecanicaJogo();
					newGameBot.PartidaBot();
					break;
				}
				case 2 : {
					MecanicaJogo newGamePlayer = new MecanicaJogo();
					newGamePlayer.PartidaPlayer();
					break;
				}
				case 3 : {
					System.out.println("\nAte a proxima, treinador CLONEMON! ^^");
					isRunning = false;
					break;
				}
				default : {
					System.out.println("\nOpcao nao encontrada. Digite outra"); break;
				}
			}
		}
	
	}
	
}
