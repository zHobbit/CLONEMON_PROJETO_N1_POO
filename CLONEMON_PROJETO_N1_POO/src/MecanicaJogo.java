//VERSAO FINAL
import java.util.Scanner;

public class MecanicaJogo {
	
    static Ataques cuspe = new Ataques("Cuspe", Elementos.AGUA, 5);
    static Ataques vapPressao = new Ataques("Vap de alta pressao", Elementos.AGUA, 7);
    static Ataques pedrada = new Ataques("Pedrada", Elementos.ROCHA, 5);
    static Ataques meteoro = new Ataques("Meteoro", Elementos.ROCHA, 7);
    static Ataques molotov = new Ataques("Molotov", Elementos.FOGO, 5);
    static Ataques fogoBabilonia = new Ataques("Fogo na Babilonia", Elementos.FOGO, 7);
    static Ataques cuboGelo = new Ataques("Cubo de Gelo", Elementos.GELO, 5);
    static Ataques ficaFrio = new Ataques("Fica frio ai", Elementos.GELO, 7);
    static Ataques papel = new Ataques("Corte de papel A4", Elementos.GRAMA, 5);
    static Ataques cartolinada = new Ataques("Cartolinada", Elementos.GRAMA, 7);
    static Ataques volt = new Ataques("Volt", Elementos.RAIO, 5);
    static Ataques bivolt = new Ataques("Bivolt", Elementos.RAIO, 7);
    
    static Monstros lindoya = new Monstros(1, "Lindoya", Elementos.AGUA, 100, 25, 25, 50, cuspe, vapPressao);      
    static Monstros coiso = new Monstros(2, "Coiso", Elementos.ROCHA, 100, 40, 40, 20, pedrada, meteoro);        
    static Monstros lucifer = new Monstros(3, "Lucifer", Elementos.FOGO, 100, 45, 25, 30, molotov, fogoBabilonia);
    static Monstros olaf = new Monstros(4, "Olaf", Elementos.GELO, 100, 30, 10, 60, cuboGelo, ficaFrio);
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
			olaf.PrintMonstro();
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
		
		MenuInterativo.limpaTela();
		System.out.println("\n\n\nVamos comecar!");
		
		for(int i = 0;i < 3;i++) {
		
			System.out.println("\nEscolha seu "+ indiceClonemonP2 + "th CLONEMON treinador 2:\n");
			lindoya.PrintMonstro();
			coiso.PrintMonstro();
			lucifer.PrintMonstro();
			olaf.PrintMonstro();
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
		
		int clonemonBatalha;
		
		MenuInterativo.limpaTela();
		System.out.println("\nA batalha CLONEMON ira comecar!");
		System.out.println("\n\nTreinador 1 escolha o seu primeiro CLONEMON que ira a batalha!");
		System.out.println("\n" + player1.monstroEquipe[0].getNome() + ", " + player1.monstroEquipe[1].getNome() + " ou " + player1.monstroEquipe[2].getNome());
		System.out.println("\nDigite 1, 2 ou 3 para escolher seu CLONEMON, de acordo com a ordem que ele aparece:");
		clonemonBatalha = escolhaClonemon.nextInt();
		while(clonemonBatalha < 1 || clonemonBatalha > 3) {
			System.out.println("\nEscolha invalida! Digite novamente:");
			clonemonBatalha = escolhaClonemon.nextInt();
		}
			switch (clonemonBatalha) {
				
				case 1:
					System.out.println("\nVoce escolheu " + player1.monstroEquipe[0].getNome() + " para a primeira batalha!");
					break;
						
				case 2:
					System.out.println("\nVoce escolheu " + player1.monstroEquipe[1].getNome() + " para a primeira batalha!");
					break;
						
				case 3:
					System.out.println("\nVoce escolheu " + player1.monstroEquipe[2].getNome() + " para a primeira batalha!");
					break;
			}
			
			MenuInterativo.limpaTela();
			int clonemonBatalhaP2;
			System.out.println("\nA batalha CLONEMON ira comecar!");
			System.out.println("\n\nTreinador 2 escolha o seu primeiro CLONEMON que ira a batalha!");
			System.out.println("\n" + player2.monstroEquipe[0].getNome() + ", " + player2.monstroEquipe[1].getNome() + " ou " + player2.monstroEquipe[2].getNome());
			System.out.println("\nDigite 1, 2 ou 3 para escolher seu CLONEMON, de acordo com a ordem que ele aparece:");
			clonemonBatalhaP2 = escolhaClonemon.nextInt();
			while(clonemonBatalhaP2 < 1 || clonemonBatalhaP2 > 3) {
				System.out.println("\nEscolha invalida! Digite novamente:");
				clonemonBatalhaP2 = escolhaClonemon.nextInt();
			}
				switch (clonemonBatalhaP2) {
					
					case 1:
						System.out.println("\nVoce escolheu " + player2.monstroEquipe[0].getNome() + " para a primeira batalha!");
						break;
							
					case 2:
						System.out.println("\nVoce escolheu " + player2.monstroEquipe[1].getNome() + " para a primeira batalha!");
						break;
							
					case 3:
						System.out.println("\nVoce escolheu " + player2.monstroEquipe[2].getNome() + " para a primeira batalha!");
						break;
				}
				MenuInterativo.limpaTela();
			int movimentoRound = 0, movimentoRoundP2 = 0, clonemonTroca, clonemonTrocaP2, p1AtkRound = 0, p2AtkRound = 0;
			Scanner movRound = new Scanner(System.in);
				
			while(player1.TemMonstros()== true && player2.TemMonstros() == true) {
				p1AtkRound = 0;
				p2AtkRound = 0;
				clonemonTroca = 4;
				while(clonemonTroca == 4) {
					System.out.println("\nTreinador 1 escolha seus movimentos:");
					System.out.println("\n\n" + player1.monstroEquipe[clonemonBatalha-1].getNome() + "\n1- " + player1.monstroEquipe[clonemonBatalha-1].getAtaque().getNome()
					+ "   2- "+ player1.monstroEquipe[clonemonBatalha-1].getAtaqueEspecial().getNome() + "   3- Trocar de CLONEMON\n");
					do{
					   movimentoRound = movRound.nextInt();
					   if(movimentoRound < 1 || movimentoRound > 3) {
							System.out.println("\nEscolha invalida! Escolha outro:");
					   }
					}while(movimentoRound < 1 || movimentoRound > 3);
					if(movimentoRound == 3) {
						System.out.println("\n\nEscolha por qual CLONEMON voce ira trocar " + player1.monstroEquipe[clonemonBatalha-1].getNome());
						System.out.println("\n1- " + player1.monstroEquipe[0].getNome() + "   2- " + player1.monstroEquipe[1].getNome() + "   3- " + player1.monstroEquipe[2].getNome() + "   4- Cancelar a troca");
						clonemonTroca = escolhaClonemon.nextInt();
						do {
							if(clonemonTroca < 1 || clonemonTroca > 4) {
							System.out.println("\nEscolha invalida! Digite novamente:");
							clonemonTroca = escolhaClonemon.nextInt();
							}if(clonemonTroca < 3 && clonemonTroca > 1) {
								while(player1.monstroEquipe[clonemonTroca-1].EstaVivo() == false) {
									System.out.println("\nEsse CLONEMON ja foi derrotado! Escolha outro: ");
									clonemonTroca = escolhaClonemon.nextInt();
								}
							}while(clonemonTroca == clonemonBatalha) {
								System.out.println("\nEsse CLONEMON ja esta na batalha! Escolha outro ou cancele a troca:");
								clonemonTroca = escolhaClonemon.nextInt();
							}
					}while(clonemonTroca < 1 || clonemonTroca > 4);
							switch (clonemonTroca) {
								
								case 1:
									System.out.println("\nVoce escolheu " + player1.monstroEquipe[0].getNome() + " para a troca!");
									break;
										
								case 2:
									System.out.println("\nVoce escolheu " + player1.monstroEquipe[1].getNome() + " para a troca!");
									break;
										
								case 3:
									System.out.println("\nVoce escolheu " + player1.monstroEquipe[2].getNome() + " para a troca!");
									break;
								
								case 4:
									System.out.println("\nTroca cancelada!");
									break;
									
							}if(clonemonTroca > 1 && clonemonTroca < 4) {
								clonemonTroca = clonemonBatalha;
							}
					}else clonemonTroca = 0;
				}
				
				clonemonTrocaP2 = 4;
				while(clonemonTrocaP2 == 4) {
					System.out.println("\nTreinador 2 escolha seus movimentos:");
					System.out.println("\n\n" + player2.monstroEquipe[clonemonBatalhaP2-1].getNome() + "\n1- " + player2.monstroEquipe[clonemonBatalhaP2-1].getAtaque().getNome()
					+ "   2- "+ player2.monstroEquipe[clonemonBatalhaP2-1].getAtaqueEspecial().getNome() + "   3- Trocar de CLONEMON\n");
					do{
					   movimentoRoundP2 = movRound.nextInt();
					   if(movimentoRoundP2 < 1 || movimentoRoundP2 > 3) {
							System.out.println("\nEscolha invalida! Escolha outro:");
					   }
					}while(movimentoRoundP2 < 1 || movimentoRoundP2 > 3);
					if(movimentoRoundP2 == 3) {
						System.out.println("\n\nEscolha por qual CLONEMON voce ira trocar " + player2.monstroEquipe[clonemonBatalhaP2-1].getNome());
						System.out.println("\n1- " + player2.monstroEquipe[0].getNome() + "   2- " + player2.monstroEquipe[1].getNome() + "   3- " + player2.monstroEquipe[2].getNome() + "   4- Cancelar a troca");
						clonemonTrocaP2 = escolhaClonemon.nextInt();
						do {
							if(clonemonTrocaP2 < 1 || clonemonTrocaP2 > 4) {
							System.out.println("\nEscolha invalida! Digite novamente:");
							clonemonTrocaP2 = escolhaClonemon.nextInt();
							}if(clonemonTrocaP2 <= 3 && clonemonTrocaP2 > 1) {
								while(player2.monstroEquipe[clonemonTrocaP2-1].EstaVivo() == false) {
									System.out.println("\nEsse CLONEMON ja foi derrotado! Escolha outro: ");
									clonemonTrocaP2 = escolhaClonemon.nextInt();
								}
							}while(clonemonTrocaP2 == clonemonBatalhaP2) {
								System.out.println("\nEsse CLONEMON ja esta na batalha! Escolha outro ou cancele a troca:");
								clonemonTrocaP2 = escolhaClonemon.nextInt();
							}
						}while(clonemonTrocaP2 < 1 || clonemonTrocaP2 > 4);
						
							switch (clonemonTrocaP2) {
								
								case 1:
									System.out.println("\nVoce escolheu " + player2.monstroEquipe[0].getNome() + " para a troca!");
									break;
										
								case 2:
									System.out.println("\nVoce escolheu " + player2.monstroEquipe[1].getNome() + " para a troca!");
									break;
										
								case 3:
									System.out.println("\nVoce escolheu " + player2.monstroEquipe[2].getNome() + " para a troca!");
									break;
								
								case 4:
									System.out.println("\nTroca cancelada!");
									break;
									
							}if(clonemonTrocaP2 > 1 && clonemonTrocaP2 < 4) {
								clonemonTrocaP2 = clonemonBatalhaP2;
							}
					}else clonemonTrocaP2 = 0;
				}
				if(movimentoRound == 1 && movimentoRoundP2 == 1) {
	                    if(player2.monstroEquipe[clonemonBatalhaP2-1].getVelocidade() < player1.monstroEquipe[clonemonBatalha-1].getVelocidade()) {
	                    	if(player1.monstroEquipe[clonemonBatalha-1].EstaVivo() == true) {
	                    		if(player2.monstroEquipe[clonemonBatalhaP2-1].EstaVivo() == true) {
	                    	p1AtkRound++;
	                        player2.monstroEquipe[clonemonBatalhaP2-1].setVida(player2.monstroEquipe[clonemonBatalhaP2-1].SofrerDano(player1.monstroEquipe[clonemonBatalha-1].AtacarNormal(),
	                        player2.monstroEquipe[clonemonBatalhaP2-1].getVida(), player1.monstroEquipe[clonemonBatalha-1].getTipo(), player2.monstroEquipe[clonemonBatalhaP2-1].getTipo()));
	                        if(player1.monstroEquipe[clonemonBatalha-1].SuperEfetivo(player1.monstroEquipe[clonemonBatalha-1].getTipo(), player2.monstroEquipe[clonemonBatalhaP2-1].getTipo()) == true) {
	                        	System.out.println("\nO ataque " + player1.monstroEquipe[clonemonBatalha-1].getAtaque().getNome() + " de " + player1.monstroEquipe[clonemonBatalha-1].getNome() + " eh SUPER EFETIVO em " + player2.monstroEquipe[clonemonBatalhaP2-1].getNome() + " e ele ficou com " + player2.monstroEquipe[clonemonBatalhaP2-1].getVida() + " de vida!");
	                        }else if(player1.monstroEquipe[clonemonBatalha-1].PoucoEfetivo(player1.monstroEquipe[clonemonBatalha-1].getTipo(), player2.monstroEquipe[clonemonBatalhaP2-1].getTipo()) == true) {
	                        	System.out.println("\nO ataque " + player1.monstroEquipe[clonemonBatalha-1].getAtaque().getNome() + " de " + player1.monstroEquipe[clonemonBatalha-1].getNome() + " eh POUCO EFETIVO em " + player2.monstroEquipe[clonemonBatalhaP2-1].getNome() + " e ele ficou com " + player2.monstroEquipe[clonemonBatalhaP2-1].getVida() + " de vida!");
	                        }else System.out.println("\n " + player2.monstroEquipe[clonemonBatalhaP2-1].getNome() + " ficou com " + player2.monstroEquipe[clonemonBatalhaP2-1].getVida() + " de vida!");
	                    	}else {
	                    		if(player2.TemMonstros() == true) {
	                            	System.out.println("\nSeu CLONEMON " + player2.monstroEquipe[clonemonBatalhaP2-1].getNome() + " esta FORA DE COMBATE!!");
	                        		System.out.println("\nEscolha outro CLONEMON da sua equipe para substituilo:");
	        						System.out.println("\n1- " + player2.monstroEquipe[0].getNome() + "   2- " + player2.monstroEquipe[1].getNome() + "   3- " + player2.monstroEquipe[2].getNome());
	        						clonemonTrocaP2 = escolhaClonemon.nextInt();
	        						do {
	        							if(clonemonTrocaP2 < 1 || clonemonTrocaP2 > 3) {
	        							System.out.println("\nEscolha invalida! Digite novamente:");
	        							clonemonTrocaP2 = escolhaClonemon.nextInt();
	        							}
	        								while(player2.monstroEquipe[clonemonTrocaP2-1].EstaVivo() == false) {
	        									System.out.println("\nEsse CLONEMON ja foi derrotado! Escolha outro: ");
	        									clonemonTrocaP2 = escolhaClonemon.nextInt();
	        								}
	        							
	        						}while(clonemonTrocaP2 < 1 || clonemonTrocaP2 > 3);
	        						
	        							switch (clonemonTrocaP2) {
	        								
	        								case 1:
	        									System.out.println("\nVoce escolheu " + player2.monstroEquipe[0].getNome() + " para a troca!");
	        									clonemonBatalhaP2 = clonemonTrocaP2;
	        									break;
	        										
	        								case 2:
	        									System.out.println("\nVoce escolheu " + player2.monstroEquipe[1].getNome() + " para a troca!");
	        									clonemonBatalhaP2 = clonemonTrocaP2;
	        									break;
	        										
	        								case 3:
	        									System.out.println("\nVoce escolheu " + player2.monstroEquipe[2].getNome() + " para a troca!");
	        									clonemonBatalhaP2 = clonemonTrocaP2;
	        									break;
	        		
	        							}clonemonTrocaP2 = 4;
	                            	
	                            }
	                    	}
	                    	}else {
	                    		if(player1.TemMonstros() == true) {
	                            	System.out.println("\nSeu CLONEMON " + player1.monstroEquipe[clonemonBatalha-1].getNome() + " esta FORA DE COMBATE!!");
	                        		System.out.println("\nEscolha outro CLONEMON da sua equipe para substituilo:");
	        						System.out.println("\n1- " + player1.monstroEquipe[0].getNome() + "   2- " + player1.monstroEquipe[1].getNome() + "   3- " + player1.monstroEquipe[2].getNome());
	        						clonemonTroca = escolhaClonemon.nextInt();
	        						do {
	        							if(clonemonTroca < 1 || clonemonTroca > 3) {
	        							System.out.println("\nEscolha invalida! Digite novamente:");
	        							clonemonTroca = escolhaClonemon.nextInt();
	        							}
	        								while(player1.monstroEquipe[clonemonTroca-1].EstaVivo() == false) {
	        									System.out.println("\nEsse CLONEMON ja foi derrotado! Escolha outro: ");
	        									clonemonTroca = escolhaClonemon.nextInt();
	        								}
	        							
	        						}while(clonemonTroca < 1 || clonemonTroca > 3);
	        						
	        							switch (clonemonTroca) {
	        								
	        								case 1:
	        									System.out.println("\nVoce escolheu " + player1.monstroEquipe[0].getNome() + " para a troca!");
	        									clonemonBatalha = clonemonTroca;
	        									break;
	        										
	        								case 2:
	        									System.out.println("\nVoce escolheu " + player1.monstroEquipe[1].getNome() + " para a troca!");
	        									clonemonBatalha = clonemonTroca;
	        									break;
	        										
	        								case 3:
	        									System.out.println("\nVoce escolheu " + player1.monstroEquipe[2].getNome() + " para a troca!");
	        									clonemonBatalha = clonemonTroca;
	        									break;
	        		
	        							}clonemonTroca = 4;
	                            }
                    	}
	                    }else {
	                    	if(player2.monstroEquipe[clonemonBatalhaP2-1].EstaVivo() == true) {
	                    		if(player1.monstroEquipe[clonemonBatalha-1].EstaVivo() == true) {
	                    	p2AtkRound++;
	                    	player1.monstroEquipe[clonemonBatalha-1].setVida(player1.monstroEquipe[clonemonBatalha-1].SofrerDano(player2.monstroEquipe[clonemonBatalhaP2-1].AtacarNormal(),
	    	                player1.monstroEquipe[clonemonBatalha-1].getVida(), player2.monstroEquipe[clonemonBatalhaP2-1].getTipo(), player1.monstroEquipe[clonemonBatalha-1].getTipo()));
	                    	if(player2.monstroEquipe[clonemonBatalhaP2-1].SuperEfetivo(player2.monstroEquipe[clonemonBatalhaP2-1].getTipo(), player1.monstroEquipe[clonemonBatalha-1].getTipo()) == true) {
	                        	System.out.println("\nO ataque " + player2.monstroEquipe[clonemonBatalhaP2-1].getAtaque().getNome() + " de " + player2.monstroEquipe[clonemonBatalhaP2-1].getNome() + " eh SUPER EFETIVO em " + player1.monstroEquipe[clonemonBatalha-1].getNome() + " e ele ficou com " + player1.monstroEquipe[clonemonBatalha-1].getVida() + " de vida!");
	                        }else if(player2.monstroEquipe[clonemonBatalhaP2-1].PoucoEfetivo(player2.monstroEquipe[clonemonBatalhaP2-1].getTipo(), player1.monstroEquipe[clonemonBatalha-1].getTipo()) == true) {
	                        	System.out.println("\nO ataque " + player2.monstroEquipe[clonemonBatalhaP2-1].getAtaque().getNome() + " de " + player2.monstroEquipe[clonemonBatalhaP2-1].getNome() + " eh POUCO EFETIVO em " + player1.monstroEquipe[clonemonBatalha-1].getNome() + " e ele ficou com " + player1.monstroEquipe[clonemonBatalha-1].getVida() + " de vida!");
	                        }else System.out.println("\nO " + player1.monstroEquipe[clonemonBatalha-1].getNome() + " ficou com " + player1.monstroEquipe[clonemonBatalha-1].getVida() + " de vida!");
	                    		}else {
	                    			if(player1.TemMonstros() == true) {
	                                	System.out.println("\nSeu CLONEMON " + player1.monstroEquipe[clonemonBatalha-1].getNome() + " esta FORA DE COMBATE!!");
	                            		System.out.println("\nEscolha outro CLONEMON da sua equipe para substituilo:");
	            						System.out.println("\n1- " + player1.monstroEquipe[0].getNome() + "   2- " + player1.monstroEquipe[1].getNome() + "   3- " + player1.monstroEquipe[2].getNome());
	            						clonemonTroca = escolhaClonemon.nextInt();
	            						do {
	            							if(clonemonTroca < 1 || clonemonTroca > 3) {
	            							System.out.println("\nEscolha invalida! Digite novamente:");
	            							clonemonTroca = escolhaClonemon.nextInt();
	            							}
	            								while(player1.monstroEquipe[clonemonTroca-1].EstaVivo() == false) {
	            									System.out.println("\nEsse CLONEMON ja foi derrotado! Escolha outro: ");
	            									clonemonTroca = escolhaClonemon.nextInt();
	            								}
	            							
	            						}while(clonemonTroca < 1 || clonemonTroca > 3);
	            						
	            							switch (clonemonTroca) {
	            								
	            								case 1:
	            									System.out.println("\nVoce escolheu " + player1.monstroEquipe[0].getNome() + " para a troca!");
	            									clonemonBatalha = clonemonTroca;
	            									break;
	            										
	            								case 2:
	            									System.out.println("\nVoce escolheu " + player1.monstroEquipe[1].getNome() + " para a troca!");
	            									clonemonBatalha = clonemonTroca;
	            									break;
	            										
	            								case 3:
	            									System.out.println("\nVoce escolheu " + player1.monstroEquipe[2].getNome() + " para a troca!");
	            									clonemonBatalha = clonemonTroca;
	            									break;
	            		
	            							}clonemonTroca = 4;
	                                }
	                        	}
	                    		}else {
	                    			if(player2.TemMonstros() == true) {
	                                	System.out.println("\nSeu CLONEMON " + player2.monstroEquipe[clonemonBatalhaP2-1].getNome() + " esta FORA DE COMBATE!!");
	                            		System.out.println("\nEscolha outro CLONEMON da sua equipe para substituilo:");
	            						System.out.println("\n1- " + player2.monstroEquipe[0].getNome() + "   2- " + player2.monstroEquipe[1].getNome() + "   3- " + player2.monstroEquipe[2].getNome());
	            						clonemonTrocaP2 = escolhaClonemon.nextInt();
	            						do {
	            							if(clonemonTrocaP2 < 1 || clonemonTrocaP2 > 3) {
	            							System.out.println("\nEscolha invalida! Digite novamente:");
	            							clonemonTrocaP2 = escolhaClonemon.nextInt();
	            							}
	            								while(player2.monstroEquipe[clonemonTrocaP2-1].EstaVivo() == false) {
	            									System.out.println("\nEsse CLONEMON ja foi derrotado! Escolha outro: ");
	            									clonemonTrocaP2 = escolhaClonemon.nextInt();
	            								}
	            							
	            						}while(clonemonTrocaP2 < 1 || clonemonTrocaP2 > 3);
	            						
	            							switch (clonemonTrocaP2) {
	            								
	            								case 1:
	            									System.out.println("\nVoce escolheu " + player2.monstroEquipe[0].getNome() + " para a troca!");
	            									clonemonBatalhaP2 = clonemonTrocaP2;
	            									break;
	            										
	            								case 2:
	            									System.out.println("\nVoce escolheu " + player2.monstroEquipe[1].getNome() + " para a troca!");
	            									clonemonBatalhaP2 = clonemonTrocaP2;
	            									break;
	            										
	            								case 3:
	            									System.out.println("\nVoce escolheu " + player2.monstroEquipe[2].getNome() + " para a troca!");
	            									clonemonBatalhaP2 = clonemonTrocaP2;
	            									break;
	            		
	            							}clonemonTrocaP2 = 4;
	                                	
	                                }
                    	}
	                    }if(p1AtkRound > p2AtkRound) {
	                    	if(player2.monstroEquipe[clonemonBatalhaP2-1].EstaVivo() == true) {
	                    		if(player1.monstroEquipe[clonemonBatalha-1].EstaVivo() == true) {
		                    	player1.monstroEquipe[clonemonBatalha-1].setVida(player1.monstroEquipe[clonemonBatalha-1].SofrerDano(player2.monstroEquipe[clonemonBatalhaP2-1].AtacarNormal(),
		    	    	                player1.monstroEquipe[clonemonBatalha-1].getVida(), player2.monstroEquipe[clonemonBatalhaP2-1].getTipo(), player1.monstroEquipe[clonemonBatalha-1].getTipo()));
		    	                    	if(player2.monstroEquipe[clonemonBatalhaP2-1].SuperEfetivo(player2.monstroEquipe[clonemonBatalhaP2-1].getTipo(), player1.monstroEquipe[clonemonBatalha-1].getTipo()) == true) {
		    	                        	System.out.println("\nO ataque " + player2.monstroEquipe[clonemonBatalhaP2-1].getAtaque().getNome() + " de " + player2.monstroEquipe[clonemonBatalhaP2-1].getNome() + " eh SUPER EFETIVO em " + player1.monstroEquipe[clonemonBatalha-1].getNome() + " e ele ficou com " + player1.monstroEquipe[clonemonBatalha-1].getVida() + " de vida!");
		    	                        }else if(player2.monstroEquipe[clonemonBatalhaP2-1].PoucoEfetivo(player2.monstroEquipe[clonemonBatalhaP2-1].getTipo(), player1.monstroEquipe[clonemonBatalha-1].getTipo()) == true) {
		    	                        	System.out.println("\nO ataque " + player2.monstroEquipe[clonemonBatalhaP2-1].getAtaque().getNome() + " de " + player2.monstroEquipe[clonemonBatalhaP2-1].getNome() + " eh POUCO EFETIVO em " + player1.monstroEquipe[clonemonBatalha-1].getNome() + " e ele ficou com " + player1.monstroEquipe[clonemonBatalha-1].getVida() + " de vida!");
		    	                        }else System.out.println("\n " + player1.monstroEquipe[clonemonBatalha-1].getNome() + " ficou com " + player1.monstroEquipe[clonemonBatalha-1].getVida() + " de vida!");
	                    		}else {
	                    			if(player1.TemMonstros() == true) {
	                                	System.out.println("\nSeu CLONEMON " + player1.monstroEquipe[clonemonBatalha-1].getNome() + " esta FORA DE COMBATE!!");
	                            		System.out.println("\nEscolha outro CLONEMON da sua equipe para substituilo:");
	            						System.out.println("\n1- " + player1.monstroEquipe[0].getNome() + "   2- " + player1.monstroEquipe[1].getNome() + "   3- " + player1.monstroEquipe[2].getNome());
	            						clonemonTroca = escolhaClonemon.nextInt();
	            						do {
	            							if(clonemonTroca < 1 || clonemonTroca > 3) {
	            							System.out.println("\nEscolha invalida! Digite novamente:");
	            							clonemonTroca = escolhaClonemon.nextInt();
	            							}
	            								while(player1.monstroEquipe[clonemonTroca-1].EstaVivo() == false) {
	            									System.out.println("\nEsse CLONEMON ja foi derrotado! Escolha outro: ");
	            									clonemonTroca = escolhaClonemon.nextInt();
	            								}
	            							
	            						}while(clonemonTroca < 1 || clonemonTroca > 3);
	            						
	            							switch (clonemonTroca) {
	            								
	            								case 1:
	            									System.out.println("\nVoce escolheu " + player1.monstroEquipe[0].getNome() + " para a troca!");
	            									clonemonBatalha = clonemonTroca;
	            									break;
	            										
	            								case 2:
	            									System.out.println("\nVoce escolheu " + player1.monstroEquipe[1].getNome() + " para a troca!");
	            									clonemonBatalha = clonemonTroca;
	            									break;
	            										
	            								case 3:
	            									System.out.println("\nVoce escolheu " + player1.monstroEquipe[2].getNome() + " para a troca!");
	            									clonemonBatalha = clonemonTroca;
	            									break;
	            		
	            							}clonemonTroca = 4;
	                                }
	                        	}
	                    		}else {
	                    			if(player2.TemMonstros() == true) {
	                                	System.out.println("\nSeu CLONEMON " + player2.monstroEquipe[clonemonBatalhaP2-1].getNome() + " esta FORA DE COMBATE!!");
	                            		System.out.println("\nEscolha outro CLONEMON da sua equipe para substituilo:");
	            						System.out.println("\n1- " + player2.monstroEquipe[0].getNome() + "   2- " + player2.monstroEquipe[1].getNome() + "   3- " + player2.monstroEquipe[2].getNome());
	            						clonemonTrocaP2 = escolhaClonemon.nextInt();
	            						do {
	            							if(clonemonTrocaP2 < 1 || clonemonTrocaP2 > 3) {
	            							System.out.println("\nEscolha invalida! Digite novamente:");
	            							clonemonTrocaP2 = escolhaClonemon.nextInt();
	            							}
	            								while(player2.monstroEquipe[clonemonTrocaP2-1].EstaVivo() == false) {
	            									System.out.println("\nEsse CLONEMON ja foi derrotado! Escolha outro: ");
	            									clonemonTrocaP2 = escolhaClonemon.nextInt();
	            								}
	            							
	            						}while(clonemonTrocaP2 < 1 || clonemonTrocaP2 > 3);
	            						
	            							switch (clonemonTrocaP2) {
	            								
	            								case 1:
	            									System.out.println("\nVoce escolheu " + player2.monstroEquipe[0].getNome() + " para a troca!");
	            									clonemonBatalhaP2 = clonemonTrocaP2;
	            									break;
	            										
	            								case 2:
	            									System.out.println("\nVoce escolheu " + player2.monstroEquipe[1].getNome() + " para a troca!");
	            									clonemonBatalhaP2 = clonemonTrocaP2;
	            									break;
	            										
	            								case 3:
	            									System.out.println("\nVoce escolheu " + player2.monstroEquipe[2].getNome() + " para a troca!");
	            									clonemonBatalhaP2 = clonemonTrocaP2;
	            									break;
	            		
	            							}clonemonTrocaP2 = 4;
	                                	
	                                }
	                    	}
	                    	}else {
	                    		if(player1.monstroEquipe[clonemonBatalha-1].EstaVivo() == true) {
	                    			if(player2.monstroEquipe[clonemonBatalhaP2-1].EstaVivo() == true) {
	                    	player2.monstroEquipe[clonemonBatalhaP2-1].setVida(player2.monstroEquipe[clonemonBatalhaP2-1].SofrerDano(player1.monstroEquipe[clonemonBatalha-1].AtacarNormal(),
	    	                        player2.monstroEquipe[clonemonBatalhaP2-1].getVida(), player1.monstroEquipe[clonemonBatalha-1].getTipo(), player2.monstroEquipe[clonemonBatalhaP2-1].getTipo()));
	    	                        if(player1.monstroEquipe[clonemonBatalha-1].SuperEfetivo(player1.monstroEquipe[clonemonBatalha-1].getTipo(), player2.monstroEquipe[clonemonBatalhaP2-1].getTipo()) == true) {
	    	                        	System.out.println("\nO ataque " + player1.monstroEquipe[clonemonBatalha-1].getAtaque().getNome() + " de " + player1.monstroEquipe[clonemonBatalha-1].getNome() + " eh SUPER EFETIVO em " + player2.monstroEquipe[clonemonBatalhaP2-1].getNome() + " e ele ficou com " + player2.monstroEquipe[clonemonBatalhaP2-1].getVida() + " de vida!");
	    	                        }else if(player1.monstroEquipe[clonemonBatalha-1].PoucoEfetivo(player1.monstroEquipe[clonemonBatalha-1].getTipo(), player2.monstroEquipe[clonemonBatalhaP2-1].getTipo()) == true) {
	    	                        	System.out.println("\nO ataque " + player1.monstroEquipe[clonemonBatalha-1].getAtaque().getNome() + " de " + player1.monstroEquipe[clonemonBatalha-1].getNome() + " eh POUCO EFETIVO em " + player2.monstroEquipe[clonemonBatalhaP2-1].getNome() + " e ele ficou com " + player2.monstroEquipe[clonemonBatalhaP2-1].getVida() + " de vida!");
	    	                        }else System.out.println("\nO " + player2.monstroEquipe[clonemonBatalhaP2-1].getNome() + " ficou com " + player2.monstroEquipe[clonemonBatalhaP2-1].getVida() + " de vida!");
	                    		}else {
	                    			if(player2.TemMonstros() == true) {
	                                	System.out.println("\nSeu CLONEMON " + player2.monstroEquipe[clonemonBatalhaP2-1].getNome() + " esta FORA DE COMBATE!!");
	                            		System.out.println("\nEscolha outro CLONEMON da sua equipe para substituilo:");
	            						System.out.println("\n1- " + player2.monstroEquipe[0].getNome() + "   2- " + player2.monstroEquipe[1].getNome() + "   3- " + player2.monstroEquipe[2].getNome());
	            						clonemonTrocaP2 = escolhaClonemon.nextInt();
	            						do {
	            							if(clonemonTrocaP2 < 1 || clonemonTrocaP2 > 3) {
	            							System.out.println("\nEscolha invalida! Digite novamente:");
	            							clonemonTrocaP2 = escolhaClonemon.nextInt();
	            							}
	            								while(player2.monstroEquipe[clonemonTrocaP2-1].EstaVivo() == false) {
	            									System.out.println("\nEsse CLONEMON ja foi derrotado! Escolha outro: ");
	            									clonemonTrocaP2 = escolhaClonemon.nextInt();
	            								}
	            							
	            						}while(clonemonTrocaP2 < 1 || clonemonTrocaP2 > 3);
	            						
	            							switch (clonemonTrocaP2) {
	            								
	            								case 1:
	            									System.out.println("\nVoce escolheu " + player2.monstroEquipe[0].getNome() + " para a troca!");
	            									clonemonBatalhaP2 = clonemonTrocaP2;
	            									break;
	            										
	            								case 2:
	            									System.out.println("\nVoce escolheu " + player2.monstroEquipe[1].getNome() + " para a troca!");
	            									clonemonBatalhaP2 = clonemonTrocaP2;
	            									break;
	            										
	            								case 3:
	            									System.out.println("\nVoce escolheu " + player2.monstroEquipe[2].getNome() + " para a troca!");
	            									clonemonBatalhaP2 = clonemonTrocaP2;
	            									break;
	            		
	            							}clonemonTrocaP2 = 4;
	                                	
	                                }
	                        	}
	                    		}else {
	                    			if(player1.TemMonstros() == true) {
	                                	System.out.println("\nSeu CLONEMON " + player1.monstroEquipe[clonemonBatalha-1].getNome() + " esta FORA DE COMBATE!!");
	                            		System.out.println("\nEscolha outro CLONEMON da sua equipe para substituilo:");
	            						System.out.println("\n1- " + player1.monstroEquipe[0].getNome() + "   2- " + player1.monstroEquipe[1].getNome() + "   3- " + player1.monstroEquipe[2].getNome());
	            						clonemonTroca = escolhaClonemon.nextInt();
	            						do {
	            							if(clonemonTroca < 1 || clonemonTroca > 3) {
	            							System.out.println("\nEscolha invalida! Digite novamente:");
	            							clonemonTroca = escolhaClonemon.nextInt();
	            							}
	            								while(player1.monstroEquipe[clonemonTroca-1].EstaVivo() == false) {
	            									System.out.println("\nEsse CLONEMON ja foi derrotado! Escolha outro: ");
	            									clonemonTroca = escolhaClonemon.nextInt();
	            								}
	            							
	            						}while(clonemonTroca < 1 || clonemonTroca > 3);
	            						
	            							switch (clonemonTroca) {
	            								
	            								case 1:
	            									System.out.println("\nVoce escolheu " + player1.monstroEquipe[0].getNome() + " para a troca!");
	            									clonemonBatalha = clonemonTroca;
	            									break;
	            										
	            								case 2:
	            									System.out.println("\nVoce escolheu " + player1.monstroEquipe[1].getNome() + " para a troca!");
	            									clonemonBatalha = clonemonTroca;
	            									break;
	            										
	            								case 3:
	            									System.out.println("\nVoce escolheu " + player1.monstroEquipe[2].getNome() + " para a troca!");
	            									clonemonBatalha = clonemonTroca;
	            									break;
	            		
	            							}clonemonTroca = 4;
	                                }
		                    	}
	                    	} 
	                    if(player1.monstroEquipe[clonemonBatalha-1].EstaVivo() == false) {
							if(player1.TemMonstros() == true) {
	                    	System.out.println("\nSeu CLONEMON " + player1.monstroEquipe[clonemonBatalha-1].getNome() + " esta FORA DE COMBATE!!");
	                		System.out.println("\nEscolha outro CLONEMON da sua equipe para substituilo:");
							System.out.println("\n1- " + player1.monstroEquipe[0].getNome() + "   2- " + player1.monstroEquipe[1].getNome() + "   3- " + player1.monstroEquipe[2].getNome());
							clonemonTroca = escolhaClonemon.nextInt();
							do {
								if(clonemonTroca < 1 || clonemonTroca > 3) {
								System.out.println("\nEscolha invalida! Digite novamente:");
								clonemonTroca = escolhaClonemon.nextInt();
								}
									while(player1.monstroEquipe[clonemonTroca-1].EstaVivo() == false) {
										System.out.println("\nEsse CLONEMON ja foi derrotado! Escolha outro: ");
										clonemonTroca = escolhaClonemon.nextInt();
									}
								
							}while(clonemonTroca < 1 || clonemonTroca > 3);
							
								switch (clonemonTroca) {
									
									case 1:
										System.out.println("\nVoce escolheu " + player1.monstroEquipe[0].getNome() + " para a troca!");
										clonemonBatalha = clonemonTroca;
										break;
											
									case 2:
										System.out.println("\nVoce escolheu " + player1.monstroEquipe[1].getNome() + " para a troca!");
										clonemonBatalha = clonemonTroca;
										break;
											
									case 3:
										System.out.println("\nVoce escolheu " + player1.monstroEquipe[2].getNome() + " para a troca!");
										clonemonBatalha = clonemonTroca;
										break;
			
								}clonemonTroca = 4;
	                    }
					}
	                    if(player2.monstroEquipe[clonemonBatalhaP2-1].EstaVivo() == false) {
	                    	if(player2.TemMonstros() == true) {
	                        	System.out.println("\nSeu CLONEMON " + player2.monstroEquipe[clonemonBatalhaP2-1].getNome() + " esta FORA DE COMBATE!!");
	                    		System.out.println("\nEscolha outro CLONEMON da sua equipe para substituilo:");
	    						System.out.println("\n1- " + player2.monstroEquipe[0].getNome() + "   2- " + player2.monstroEquipe[1].getNome() + "   3- " + player2.monstroEquipe[2].getNome());
	    						clonemonTrocaP2 = escolhaClonemon.nextInt();
	    						do {
	    							if(clonemonTrocaP2 < 1 || clonemonTrocaP2 > 3) {
	    							System.out.println("\nEscolha invalida! Digite novamente:");
	    							clonemonTrocaP2 = escolhaClonemon.nextInt();
	    							}
	    								while(player2.monstroEquipe[clonemonTrocaP2-1].EstaVivo() == false) {
	    									System.out.println("\nEsse CLONEMON ja foi derrotado! Escolha outro: ");
	    									clonemonTrocaP2 = escolhaClonemon.nextInt();
	    								}
	    							
	    						}while(clonemonTrocaP2 < 1 || clonemonTrocaP2 > 3);
	    						
	    							switch (clonemonTrocaP2) {
	    								
	    								case 1:
	    									System.out.println("\nVoce escolheu " + player2.monstroEquipe[0].getNome() + " para a troca!");
	    									clonemonBatalhaP2 = clonemonTrocaP2;
	    									break;
	    										
	    								case 2:
	    									System.out.println("\nVoce escolheu " + player2.monstroEquipe[1].getNome() + " para a troca!");
	    									clonemonBatalhaP2 = clonemonTrocaP2;
	    									break;
	    										
	    								case 3:
	    									System.out.println("\nVoce escolheu " + player2.monstroEquipe[2].getNome() + " para a troca!");
	    									clonemonBatalhaP2 = clonemonTrocaP2;
	    									break;
	    		
	    							}clonemonTrocaP2 = 4;
	                        	
	                        }
	                    }
	                    		
				}
				if(movimentoRound == 2 && movimentoRoundP2 == 2) {
					if(player2.monstroEquipe[clonemonBatalhaP2-1].getVelocidade() < player1.monstroEquipe[clonemonBatalha-1].getVelocidade()) {
						if(player1.monstroEquipe[clonemonBatalha-1].EstaVivo() == true) {
							if(player2.monstroEquipe[clonemonBatalhaP2-1].EstaVivo() == true) {
                    	p1AtkRound++;
                        player2.monstroEquipe[clonemonBatalhaP2-1].setVida(player2.monstroEquipe[clonemonBatalhaP2-1].SofrerDano(player1.monstroEquipe[clonemonBatalha-1].AtacarEspecial(),
                        player2.monstroEquipe[clonemonBatalhaP2-1].getVida(), player1.monstroEquipe[clonemonBatalha-1].getTipo(), player2.monstroEquipe[clonemonBatalhaP2-1].getTipo()));
                        if(player1.monstroEquipe[clonemonBatalha-1].SuperEfetivo(player1.monstroEquipe[clonemonBatalha-1].getTipo(), player2.monstroEquipe[clonemonBatalhaP2-1].getTipo()) == true) {
                        	System.out.println("\nO ataque " + player1.monstroEquipe[clonemonBatalha-1].getAtaqueEspecial().getNome() + " de " + player1.monstroEquipe[clonemonBatalha-1].getNome() + " eh SUPER EFETIVO em " + player2.monstroEquipe[clonemonBatalhaP2-1].getNome() + " e ele ficou com " + player2.monstroEquipe[clonemonBatalhaP2-1].getVida() + " de vida!");
                        }else if(player1.monstroEquipe[clonemonBatalha-1].PoucoEfetivo(player1.monstroEquipe[clonemonBatalha-1].getTipo(), player2.monstroEquipe[clonemonBatalhaP2-1].getTipo()) == true) {
                        	System.out.println("\nO ataque " + player1.monstroEquipe[clonemonBatalha-1].getAtaqueEspecial().getNome() + " de " + player1.monstroEquipe[clonemonBatalha-1].getNome() + " eh POUCO EFETIVO em " + player2.monstroEquipe[clonemonBatalhaP2-1].getNome() + " e ele ficou com " + player2.monstroEquipe[clonemonBatalhaP2-1].getVida() + " de vida!");
                        }else System.out.println("\n " + player2.monstroEquipe[clonemonBatalhaP2-1].getNome() + " ficou com " + player2.monstroEquipe[clonemonBatalhaP2-1].getVida() + " de vida!");
						}else {
							if(player2.TemMonstros() == true) {
	                        	System.out.println("\nSeu CLONEMON " + player2.monstroEquipe[clonemonBatalhaP2-1].getNome() + " esta FORA DE COMBATE!!");
	                    		System.out.println("\nEscolha outro CLONEMON da sua equipe para substituilo:");
	    						System.out.println("\n1- " + player2.monstroEquipe[0].getNome() + "   2- " + player2.monstroEquipe[1].getNome() + "   3- " + player2.monstroEquipe[2].getNome());
	    						clonemonTrocaP2 = escolhaClonemon.nextInt();
	    						do {
	    							if(clonemonTrocaP2 < 1 || clonemonTrocaP2 > 3) {
	    							System.out.println("\nEscolha invalida! Digite novamente:");
	    							clonemonTrocaP2 = escolhaClonemon.nextInt();
	    							}
	    								while(player2.monstroEquipe[clonemonTrocaP2-1].EstaVivo() == false) {
	    									System.out.println("\nEsse CLONEMON ja foi derrotado! Escolha outro: ");
	    									clonemonTrocaP2 = escolhaClonemon.nextInt();
	    								}
	    							
	    						}while(clonemonTrocaP2 < 1 || clonemonTrocaP2 > 3);
	    						
	    							switch (clonemonTrocaP2) {
	    								
	    								case 1:
	    									System.out.println("\nVoce escolheu " + player2.monstroEquipe[0].getNome() + " para a troca!");
	    									clonemonBatalhaP2 = clonemonTrocaP2;
	    									break;
	    										
	    								case 2:
	    									System.out.println("\nVoce escolheu " + player2.monstroEquipe[1].getNome() + " para a troca!");
	    									clonemonBatalhaP2 = clonemonTrocaP2;
	    									break;
	    										
	    								case 3:
	    									System.out.println("\nVoce escolheu " + player2.monstroEquipe[2].getNome() + " para a troca!");
	    									clonemonBatalhaP2 = clonemonTrocaP2;
	    									break;
	    		
	    							}clonemonTrocaP2 = 4;
	                        	
	                        }
	                	}
						}else {
							if(player1.TemMonstros() == true) {
		                    	System.out.println("\nSeu CLONEMON " + player1.monstroEquipe[clonemonBatalha-1].getNome() + " esta FORA DE COMBATE!!");
		                		System.out.println("\nEscolha outro CLONEMON da sua equipe para substituilo:");
								System.out.println("\n1- " + player1.monstroEquipe[0].getNome() + "   2- " + player1.monstroEquipe[1].getNome() + "   3- " + player1.monstroEquipe[2].getNome());
								clonemonTroca = escolhaClonemon.nextInt();
								do {
									if(clonemonTroca < 1 || clonemonTroca > 3) {
									System.out.println("\nEscolha invalida! Digite novamente:");
									clonemonTroca = escolhaClonemon.nextInt();
									}
										while(player1.monstroEquipe[clonemonTroca-1].EstaVivo() == false) {
											System.out.println("\nEsse CLONEMON ja foi derrotado! Escolha outro: ");
											clonemonTroca = escolhaClonemon.nextInt();
										}
									
								}while(clonemonTroca < 1 || clonemonTroca > 3);
								
									switch (clonemonTroca) {
										
										case 1:
											System.out.println("\nVoce escolheu " + player1.monstroEquipe[0].getNome() + " para a troca!");
											clonemonBatalha = clonemonTroca;
											break;
												
										case 2:
											System.out.println("\nVoce escolheu " + player1.monstroEquipe[1].getNome() + " para a troca!");
											clonemonBatalha = clonemonTroca;
											break;
												
										case 3:
											System.out.println("\nVoce escolheu " + player1.monstroEquipe[2].getNome() + " para a troca!");
											clonemonBatalha = clonemonTroca;
											break;
				
									}clonemonTroca = 4;
		                    }
                	}
					}else {
						if(player2.monstroEquipe[clonemonBatalhaP2-1].EstaVivo() == true) {
							if(player1.monstroEquipe[clonemonBatalha-1].EstaVivo() == true) {
                    	p2AtkRound++;
                    	player1.monstroEquipe[clonemonBatalha-1].setVida(player1.monstroEquipe[clonemonBatalha-1].SofrerDano(player2.monstroEquipe[clonemonBatalhaP2-1].AtacarEspecial(),
    	                player1.monstroEquipe[clonemonBatalha-1].getVida(), player2.monstroEquipe[clonemonBatalhaP2-1].getTipo(), player1.monstroEquipe[clonemonBatalha-1].getTipo()));
                    	if(player2.monstroEquipe[clonemonBatalhaP2-1].SuperEfetivo(player2.monstroEquipe[clonemonBatalhaP2-1].getTipo(), player1.monstroEquipe[clonemonBatalha-1].getTipo()) == true) {
                        	System.out.println("\nO ataque " + player2.monstroEquipe[clonemonBatalhaP2-1].getAtaqueEspecial().getNome() + " de " + player2.monstroEquipe[clonemonBatalhaP2-1].getNome() + " eh SUPER EFETIVO em " + player1.monstroEquipe[clonemonBatalha-1].getNome() + " e ele ficou com " + player1.monstroEquipe[clonemonBatalha-1].getVida() + " de vida!");
                        }else if(player2.monstroEquipe[clonemonBatalhaP2-1].PoucoEfetivo(player2.monstroEquipe[clonemonBatalhaP2-1].getTipo(), player1.monstroEquipe[clonemonBatalha-1].getTipo()) == true) {
                        	System.out.println("\nO ataque " + player2.monstroEquipe[clonemonBatalhaP2-1].getAtaqueEspecial().getNome() + " de " + player2.monstroEquipe[clonemonBatalhaP2-1].getNome() + " eh POUCO EFETIVO em " + player1.monstroEquipe[clonemonBatalha-1].getNome() + " e ele ficou com " + player1.monstroEquipe[clonemonBatalha-1].getVida() + " de vida!");
                        }else System.out.println("\nO " + player1.monstroEquipe[clonemonBatalha-1].getNome() + " ficou com " + player1.monstroEquipe[clonemonBatalha-1].getVida() + " de vida!");
							}else {
								if(player1.TemMonstros() == true) {
			                    	System.out.println("\nSeu CLONEMON " + player1.monstroEquipe[clonemonBatalha-1].getNome() + " esta FORA DE COMBATE!!");
			                		System.out.println("\nEscolha outro CLONEMON da sua equipe para substituilo:");
									System.out.println("\n1- " + player1.monstroEquipe[0].getNome() + "   2- " + player1.monstroEquipe[1].getNome() + "   3- " + player1.monstroEquipe[2].getNome());
									clonemonTroca = escolhaClonemon.nextInt();
									do {
										if(clonemonTroca < 1 || clonemonTroca > 3) {
										System.out.println("\nEscolha invalida! Digite novamente:");
										clonemonTroca = escolhaClonemon.nextInt();
										}
											while(player1.monstroEquipe[clonemonTroca-1].EstaVivo() == false) {
												System.out.println("\nEsse CLONEMON ja foi derrotado! Escolha outro: ");
												clonemonTroca = escolhaClonemon.nextInt();
											}
										
									}while(clonemonTroca < 1 || clonemonTroca > 3);
									
										switch (clonemonTroca) {
											
											case 1:
												System.out.println("\nVoce escolheu " + player1.monstroEquipe[0].getNome() + " para a troca!");
												clonemonBatalha = clonemonTroca;
												break;
													
											case 2:
												System.out.println("\nVoce escolheu " + player1.monstroEquipe[1].getNome() + " para a troca!");
												clonemonBatalha = clonemonTroca;
												break;
													
											case 3:
												System.out.println("\nVoce escolheu " + player1.monstroEquipe[2].getNome() + " para a troca!");
												clonemonBatalha = clonemonTroca;
												break;
					
										}clonemonTroca = 4;
			                    }
	                    	}
							}else {
								if(player2.TemMonstros() == true) {
		                        	System.out.println("\nSeu CLONEMON " + player2.monstroEquipe[clonemonBatalhaP2-1].getNome() + " esta FORA DE COMBATE!!");
		                    		System.out.println("\nEscolha outro CLONEMON da sua equipe para substituilo:");
		    						System.out.println("\n1- " + player2.monstroEquipe[0].getNome() + "   2- " + player2.monstroEquipe[1].getNome() + "   3- " + player2.monstroEquipe[2].getNome());
		    						clonemonTrocaP2 = escolhaClonemon.nextInt();
		    						do {
		    							if(clonemonTrocaP2 < 1 || clonemonTrocaP2 > 3) {
		    							System.out.println("\nEscolha invalida! Digite novamente:");
		    							clonemonTrocaP2 = escolhaClonemon.nextInt();
		    							}
		    								while(player2.monstroEquipe[clonemonTrocaP2-1].EstaVivo() == false) {
		    									System.out.println("\nEsse CLONEMON ja foi derrotado! Escolha outro: ");
		    									clonemonTrocaP2 = escolhaClonemon.nextInt();
		    								}
		    							
		    						}while(clonemonTrocaP2 < 1 || clonemonTrocaP2 > 3);
		    						
		    							switch (clonemonTrocaP2) {
		    								
		    								case 1:
		    									System.out.println("\nVoce escolheu " + player2.monstroEquipe[0].getNome() + " para a troca!");
		    									clonemonBatalhaP2 = clonemonTrocaP2;
		    									break;
		    										
		    								case 2:
		    									System.out.println("\nVoce escolheu " + player2.monstroEquipe[1].getNome() + " para a troca!");
		    									clonemonBatalhaP2 = clonemonTrocaP2;
		    									break;
		    										
		    								case 3:
		    									System.out.println("\nVoce escolheu " + player2.monstroEquipe[2].getNome() + " para a troca!");
		    									clonemonBatalhaP2 = clonemonTrocaP2;
		    									break;
		    		
		    							}clonemonTrocaP2 = 4;
		                        	
		                        }
                	}
					}if(p1AtkRound > p2AtkRound) {
						if(player2.monstroEquipe[clonemonBatalhaP2-1].EstaVivo() == true) {
							if(player1.monstroEquipe[clonemonBatalha-1].EstaVivo() == true) {
                    	player1.monstroEquipe[clonemonBatalha-1].setVida(player1.monstroEquipe[clonemonBatalha-1].SofrerDano(player2.monstroEquipe[clonemonBatalhaP2-1].AtacarEspecial(),
    	    	                player1.monstroEquipe[clonemonBatalha-1].getVida(), player2.monstroEquipe[clonemonBatalhaP2-1].getTipo(), player1.monstroEquipe[clonemonBatalha-1].getTipo()));
    	                    	if(player2.monstroEquipe[clonemonBatalhaP2-1].SuperEfetivo(player2.monstroEquipe[clonemonBatalhaP2-1].getTipo(), player1.monstroEquipe[clonemonBatalha-1].getTipo()) == true) {
    	                        	System.out.println("\nO ataque " + player2.monstroEquipe[clonemonBatalhaP2-1].getAtaqueEspecial().getNome() + " de " + player2.monstroEquipe[clonemonBatalhaP2-1].getNome() + " eh SUPER EFETIVO em " + player1.monstroEquipe[clonemonBatalha-1].getNome() + " e ele ficou com " + player1.monstroEquipe[clonemonBatalha-1].getVida() + " de vida!");
    	                        }else if(player2.monstroEquipe[clonemonBatalhaP2-1].PoucoEfetivo(player2.monstroEquipe[clonemonBatalhaP2-1].getTipo(), player1.monstroEquipe[clonemonBatalha-1].getTipo()) == true) {
    	                        	System.out.println("\nO ataque " + player2.monstroEquipe[clonemonBatalhaP2-1].getAtaqueEspecial().getNome() + " de " + player2.monstroEquipe[clonemonBatalhaP2-1].getNome() + " eh POUCO EFETIVO em " + player1.monstroEquipe[clonemonBatalha-1].getNome() + " e ele ficou com " + player1.monstroEquipe[clonemonBatalha-1].getVida() + " de vida!");
    	                        }else System.out.println("\nO " + player1.monstroEquipe[clonemonBatalha-1].getNome() + " ficou com " + player1.monstroEquipe[clonemonBatalha-1].getVida() + " de vida!");
							}else {
								if(player1.TemMonstros() == true) {
			                    	System.out.println("\nSeu CLONEMON " + player1.monstroEquipe[clonemonBatalha-1].getNome() + " esta FORA DE COMBATE!!");
			                		System.out.println("\nEscolha outro CLONEMON da sua equipe para substituilo:");
									System.out.println("\n1- " + player1.monstroEquipe[0].getNome() + "   2- " + player1.monstroEquipe[1].getNome() + "   3- " + player1.monstroEquipe[2].getNome());
									clonemonTroca = escolhaClonemon.nextInt();
									do {
										if(clonemonTroca < 1 || clonemonTroca > 3) {
										System.out.println("\nEscolha invalida! Digite novamente:");
										clonemonTroca = escolhaClonemon.nextInt();
										}
											while(player1.monstroEquipe[clonemonTroca-1].EstaVivo() == false) {
												System.out.println("\nEsse CLONEMON ja foi derrotado! Escolha outro: ");
												clonemonTroca = escolhaClonemon.nextInt();
											}
										
									}while(clonemonTroca < 1 || clonemonTroca > 3);
									
										switch (clonemonTroca) {
											
											case 1:
												System.out.println("\nVoce escolheu " + player1.monstroEquipe[0].getNome() + " para a troca!");
												clonemonBatalha = clonemonTroca;
												break;
													
											case 2:
												System.out.println("\nVoce escolheu " + player1.monstroEquipe[1].getNome() + " para a troca!");
												clonemonBatalha = clonemonTroca;
												break;
													
											case 3:
												System.out.println("\nVoce escolheu " + player1.monstroEquipe[2].getNome() + " para a troca!");
												clonemonBatalha = clonemonTroca;
												break;
					
										}clonemonTroca = 4;
			                    }
	                    	}
							}else {
                		System.out.println("\nSeu CLONEMON " + player2.monstroEquipe[clonemonBatalhaP2-1].getNome() + " esta FORA DE COMBATE!!");
                		System.out.println("\nEscolha outro CLONEMON da sua equipe para substituilo:");
						System.out.println("\n1- " + player2.monstroEquipe[0].getNome() + "   2- " + player2.monstroEquipe[1].getNome() + "   3- " + player2.monstroEquipe[2].getNome());
						clonemonTrocaP2 = escolhaClonemon.nextInt();
						do {
							if(clonemonTrocaP2 < 1 || clonemonTrocaP2 > 3) {
							System.out.println("\nEscolha invalida! Digite novamente:");
							clonemonTrocaP2 = escolhaClonemon.nextInt();
							}
								while(player2.monstroEquipe[clonemonTrocaP2-1].EstaVivo() == false) {
									System.out.println("\nEsse CLONEMON ja foi derrotado! Escolha outro: ");
									clonemonTrocaP2 = escolhaClonemon.nextInt();
								}
							
						}while(clonemonTrocaP2 < 1 || clonemonTrocaP2 > 3);
						
							switch (clonemonTrocaP2) {
								
								case 1:
									System.out.println("\nVoce escolheu " + player2.monstroEquipe[0].getNome() + " para a troca!");
									clonemonBatalhaP2 = clonemonTrocaP2;
									break;
										
								case 2:
									System.out.println("\nVoce escolheu " + player2.monstroEquipe[1].getNome() + " para a troca!");
									clonemonBatalhaP2 = clonemonTrocaP2;
									break;
										
								case 3:
									System.out.println("\nVoce escolheu " + player2.monstroEquipe[2].getNome() + " para a troca!");
									clonemonBatalhaP2 = clonemonTrocaP2;
									break;
		
							}clonemonTrocaP2 = 4;
                	}
					}else {
                    	if(player1.monstroEquipe[clonemonBatalha-1].EstaVivo() == true) {
                    		if(player2.monstroEquipe[clonemonBatalhaP2-1].EstaVivo() == true) {
                    	player2.monstroEquipe[clonemonBatalhaP2-1].setVida(player2.monstroEquipe[clonemonBatalhaP2-1].SofrerDano(player1.monstroEquipe[clonemonBatalha-1].AtacarEspecial(),
    	                        player2.monstroEquipe[clonemonBatalhaP2-1].getVida(), player1.monstroEquipe[clonemonBatalha-1].getTipo(), player2.monstroEquipe[clonemonBatalhaP2-1].getTipo()));
    	                        if(player1.monstroEquipe[clonemonBatalha-1].SuperEfetivo(player1.monstroEquipe[clonemonBatalha-1].getTipo(), player2.monstroEquipe[clonemonBatalhaP2-1].getTipo()) == true) {
    	                        	System.out.println("\nO ataque " + player1.monstroEquipe[clonemonBatalha-1].getAtaqueEspecial().getNome() + " de " + player1.monstroEquipe[clonemonBatalha-1].getNome() + " eh SUPER EFETIVO em " + player2.monstroEquipe[clonemonBatalhaP2-1].getNome() + " e ele ficou com " + player2.monstroEquipe[clonemonBatalhaP2-1].getVida() + " de vida!");
    	                        }else if(player1.monstroEquipe[clonemonBatalha-1].PoucoEfetivo(player1.monstroEquipe[clonemonBatalha-1].getTipo(), player2.monstroEquipe[clonemonBatalhaP2-1].getTipo()) == true) {
    	                        	System.out.println("\nO ataque " + player1.monstroEquipe[clonemonBatalha-1].getAtaqueEspecial().getNome() + " de " + player1.monstroEquipe[clonemonBatalha-1].getNome() + " eh POUCO EFETIVO em " + player2.monstroEquipe[clonemonBatalhaP2-1].getNome() + " e ele ficou com " + player2.monstroEquipe[clonemonBatalhaP2-1].getVida() + " de vida!");
    	                        }else System.out.println("\n " + player2.monstroEquipe[clonemonBatalhaP2-1].getNome() + " ficou com " + player2.monstroEquipe[clonemonBatalhaP2-1].getVida() + " de vida!");
                    	}else {
                    		if(player2.TemMonstros() == true) {
                            	System.out.println("\nSeu CLONEMON " + player2.monstroEquipe[clonemonBatalhaP2-1].getNome() + " esta FORA DE COMBATE!!");
                        		System.out.println("\nEscolha outro CLONEMON da sua equipe para substituilo:");
        						System.out.println("\n1- " + player2.monstroEquipe[0].getNome() + "   2- " + player2.monstroEquipe[1].getNome() + "   3- " + player2.monstroEquipe[2].getNome());
        						clonemonTrocaP2 = escolhaClonemon.nextInt();
        						do {
        							if(clonemonTrocaP2 < 1 || clonemonTrocaP2 > 3) {
        							System.out.println("\nEscolha invalida! Digite novamente:");
        							clonemonTrocaP2 = escolhaClonemon.nextInt();
        							}
        								while(player2.monstroEquipe[clonemonTrocaP2-1].EstaVivo() == false) {
        									System.out.println("\nEsse CLONEMON ja foi derrotado! Escolha outro: ");
        									clonemonTrocaP2 = escolhaClonemon.nextInt();
        								}
        							
        						}while(clonemonTrocaP2 < 1 || clonemonTrocaP2 > 3);
        						
        							switch (clonemonTrocaP2) {
        								
        								case 1:
        									System.out.println("\nVoce escolheu " + player2.monstroEquipe[0].getNome() + " para a troca!");
        									clonemonBatalhaP2 = clonemonTrocaP2;
        									break;
        										
        								case 2:
        									System.out.println("\nVoce escolheu " + player2.monstroEquipe[1].getNome() + " para a troca!");
        									clonemonBatalhaP2 = clonemonTrocaP2;
        									break;
        										
        								case 3:
        									System.out.println("\nVoce escolheu " + player2.monstroEquipe[2].getNome() + " para a troca!");
        									clonemonBatalhaP2 = clonemonTrocaP2;
        									break;
        		
        							}clonemonTrocaP2 = 4;
                            	
                            }
                    	}
                    	}else {
                    		if(player1.TemMonstros() == true) {
                            	System.out.println("\nSeu CLONEMON " + player1.monstroEquipe[clonemonBatalha-1].getNome() + " esta FORA DE COMBATE!!");
                        		System.out.println("\nEscolha outro CLONEMON da sua equipe para substituilo:");
        						System.out.println("\n1- " + player1.monstroEquipe[0].getNome() + "   2- " + player1.monstroEquipe[1].getNome() + "   3- " + player1.monstroEquipe[2].getNome());
        						clonemonTroca = escolhaClonemon.nextInt();
        						do {
        							if(clonemonTroca < 1 || clonemonTroca > 3) {
        							System.out.println("\nEscolha invalida! Digite novamente:");
        							clonemonTroca = escolhaClonemon.nextInt();
        							}
        								while(player1.monstroEquipe[clonemonTroca-1].EstaVivo() == false) {
        									System.out.println("\nEsse CLONEMON ja foi derrotado! Escolha outro: ");
        									clonemonTroca = escolhaClonemon.nextInt();
        								}
        							
        						}while(clonemonTroca < 1 || clonemonTroca > 3);
        						
        							switch (clonemonTroca) {
        								
        								case 1:
        									System.out.println("\nVoce escolheu " + player1.monstroEquipe[0].getNome() + " para a troca!");
        									clonemonBatalha = clonemonTroca;
        									break;
        										
        								case 2:
        									System.out.println("\nVoce escolheu " + player1.monstroEquipe[1].getNome() + " para a troca!");
        									clonemonBatalha = clonemonTroca;
        									break;
        										
        								case 3:
        									System.out.println("\nVoce escolheu " + player1.monstroEquipe[2].getNome() + " para a troca!");
        									clonemonBatalha = clonemonTroca;
        									break;
        		
        							}clonemonTroca = 4;
                            }
                	}
                    }
					if(player1.monstroEquipe[clonemonBatalha-1].EstaVivo() == false) {
						if(player1.TemMonstros() == true) {
	                    	System.out.println("\nSeu CLONEMON " + player1.monstroEquipe[clonemonBatalha-1].getNome() + " esta FORA DE COMBATE!!");
	                		System.out.println("\nEscolha outro CLONEMON da sua equipe para substituilo:");
							System.out.println("\n1- " + player1.monstroEquipe[0].getNome() + "   2- " + player1.monstroEquipe[1].getNome() + "   3- " + player1.monstroEquipe[2].getNome());
							clonemonTroca = escolhaClonemon.nextInt();
							do {
								if(clonemonTroca < 1 || clonemonTroca > 3) {
								System.out.println("\nEscolha invalida! Digite novamente:");
								clonemonTroca = escolhaClonemon.nextInt();
								}
									while(player1.monstroEquipe[clonemonTroca-1].EstaVivo() == false) {
										System.out.println("\nEsse CLONEMON ja foi derrotado! Escolha outro: ");
										clonemonTroca = escolhaClonemon.nextInt();
									}
								
							}while(clonemonTroca < 1 || clonemonTroca > 3);
							
								switch (clonemonTroca) {
									
									case 1:
										System.out.println("\nVoce escolheu " + player1.monstroEquipe[0].getNome() + " para a troca!");
										clonemonBatalha = clonemonTroca;
										break;
											
									case 2:
										System.out.println("\nVoce escolheu " + player1.monstroEquipe[1].getNome() + " para a troca!");
										clonemonBatalha = clonemonTroca;
										break;
											
									case 3:
										System.out.println("\nVoce escolheu " + player1.monstroEquipe[2].getNome() + " para a troca!");
										clonemonBatalha = clonemonTroca;
										break;
			
								}clonemonTroca = 4;
	                    }
				}
                    if(player2.monstroEquipe[clonemonBatalhaP2-1].EstaVivo() == false) {
                    	if(player2.TemMonstros() == true) {
                        	System.out.println("\nSeu CLONEMON " + player2.monstroEquipe[clonemonBatalhaP2-1].getNome() + " esta FORA DE COMBATE!!");
                    		System.out.println("\nEscolha outro CLONEMON da sua equipe para substituilo:");
    						System.out.println("\n1- " + player2.monstroEquipe[0].getNome() + "   2- " + player2.monstroEquipe[1].getNome() + "   3- " + player2.monstroEquipe[2].getNome());
    						clonemonTrocaP2 = escolhaClonemon.nextInt();
    						do {
    							if(clonemonTrocaP2 < 1 || clonemonTrocaP2 > 3) {
    							System.out.println("\nEscolha invalida! Digite novamente:");
    							clonemonTrocaP2 = escolhaClonemon.nextInt();
    							}
    								while(player2.monstroEquipe[clonemonTrocaP2-1].EstaVivo() == false) {
    									System.out.println("\nEsse CLONEMON ja foi derrotado! Escolha outro: ");
    									clonemonTrocaP2 = escolhaClonemon.nextInt();
    								}
    							
    						}while(clonemonTrocaP2 < 1 || clonemonTrocaP2 > 3);
    						
    							switch (clonemonTrocaP2) {
    								
    								case 1:
    									System.out.println("\nVoce escolheu " + player2.monstroEquipe[0].getNome() + " para a troca!");
    									clonemonBatalhaP2 = clonemonTrocaP2;
    									break;
    										
    								case 2:
    									System.out.println("\nVoce escolheu " + player2.monstroEquipe[1].getNome() + " para a troca!");
    									clonemonBatalhaP2 = clonemonTrocaP2;
    									break;
    										
    								case 3:
    									System.out.println("\nVoce escolheu " + player2.monstroEquipe[2].getNome() + " para a troca!");
    									clonemonBatalhaP2 = clonemonTrocaP2;
    									break;
    		
    							}clonemonTrocaP2 = 4;
                        	
                        }
                    }
				}
				if(movimentoRound == 2 && movimentoRoundP2 == 1) {
					if(player2.monstroEquipe[clonemonBatalhaP2-1].getVelocidade() < player1.monstroEquipe[clonemonBatalha-1].getVelocidade()) {
						if(player1.monstroEquipe[clonemonBatalha-1].EstaVivo() == true) {
							if(player2.monstroEquipe[clonemonBatalhaP2-1].EstaVivo() == true) {
                    	p1AtkRound++;
                        player2.monstroEquipe[clonemonBatalhaP2-1].setVida(player2.monstroEquipe[clonemonBatalhaP2-1].SofrerDano(player1.monstroEquipe[clonemonBatalha-1].AtacarEspecial(),
                        player2.monstroEquipe[clonemonBatalhaP2-1].getVida(), player1.monstroEquipe[clonemonBatalha-1].getTipo(), player2.monstroEquipe[clonemonBatalhaP2-1].getTipo()));
                        if(player1.monstroEquipe[clonemonBatalha-1].SuperEfetivo(player1.monstroEquipe[clonemonBatalha-1].getTipo(), player2.monstroEquipe[clonemonBatalhaP2-1].getTipo()) == true) {
                        	System.out.println("\nO ataque " + player1.monstroEquipe[clonemonBatalha-1].getAtaqueEspecial().getNome() + " de " + player1.monstroEquipe[clonemonBatalha-1].getNome() + " eh SUPER EFETIVO em " + player2.monstroEquipe[clonemonBatalhaP2-1].getNome() + " e ele ficou com " + player2.monstroEquipe[clonemonBatalhaP2-1].getVida() + " de vida!");
                        }else if(player1.monstroEquipe[clonemonBatalha-1].PoucoEfetivo(player1.monstroEquipe[clonemonBatalha-1].getTipo(), player2.monstroEquipe[clonemonBatalhaP2-1].getTipo()) == true) {
                        	System.out.println("\nO ataque " + player1.monstroEquipe[clonemonBatalha-1].getAtaqueEspecial().getNome() + " de " + player1.monstroEquipe[clonemonBatalha-1].getNome() + " eh POUCO EFETIVO em " + player2.monstroEquipe[clonemonBatalhaP2-1].getNome() + " e ele ficou com " + player2.monstroEquipe[clonemonBatalhaP2-1].getVida() + " de vida!");
                        }else System.out.println("\n " + player2.monstroEquipe[clonemonBatalhaP2-1].getNome() + " ficou com " + player2.monstroEquipe[clonemonBatalhaP2-1].getVida() + " de vida!");
							}else {
								if(player2.TemMonstros() == true) {
		                        	System.out.println("\nSeu CLONEMON " + player2.monstroEquipe[clonemonBatalhaP2-1].getNome() + " esta FORA DE COMBATE!!");
		                    		System.out.println("\nEscolha outro CLONEMON da sua equipe para substituilo:");
		    						System.out.println("\n1- " + player2.monstroEquipe[0].getNome() + "   2- " + player2.monstroEquipe[1].getNome() + "   3- " + player2.monstroEquipe[2].getNome());
		    						clonemonTrocaP2 = escolhaClonemon.nextInt();
		    						do {
		    							if(clonemonTrocaP2 < 1 || clonemonTrocaP2 > 3) {
		    							System.out.println("\nEscolha invalida! Digite novamente:");
		    							clonemonTrocaP2 = escolhaClonemon.nextInt();
		    							}
		    								while(player2.monstroEquipe[clonemonTrocaP2-1].EstaVivo() == false) {
		    									System.out.println("\nEsse CLONEMON ja foi derrotado! Escolha outro: ");
		    									clonemonTrocaP2 = escolhaClonemon.nextInt();
		    								}
		    							
		    						}while(clonemonTrocaP2 < 1 || clonemonTrocaP2 > 3);
		    						
		    							switch (clonemonTrocaP2) {
		    								
		    								case 1:
		    									System.out.println("\nVoce escolheu " + player2.monstroEquipe[0].getNome() + " para a troca!");
		    									clonemonBatalhaP2 = clonemonTrocaP2;
		    									break;
		    										
		    								case 2:
		    									System.out.println("\nVoce escolheu " + player2.monstroEquipe[1].getNome() + " para a troca!");
		    									clonemonBatalhaP2 = clonemonTrocaP2;
		    									break;
		    										
		    								case 3:
		    									System.out.println("\nVoce escolheu " + player2.monstroEquipe[2].getNome() + " para a troca!");
		    									clonemonBatalhaP2 = clonemonTrocaP2;
		    									break;
		    		
		    							}clonemonTrocaP2 = 4;
		                        	
		                        }
		                	}
							}else {
								if(player1.TemMonstros() == true) {
			                    	System.out.println("\nSeu CLONEMON " + player1.monstroEquipe[clonemonBatalha-1].getNome() + " esta FORA DE COMBATE!!");
			                		System.out.println("\nEscolha outro CLONEMON da sua equipe para substituilo:");
									System.out.println("\n1- " + player1.monstroEquipe[0].getNome() + "   2- " + player1.monstroEquipe[1].getNome() + "   3- " + player1.monstroEquipe[2].getNome());
									clonemonTroca = escolhaClonemon.nextInt();
									do {
										if(clonemonTroca < 1 || clonemonTroca > 3) {
										System.out.println("\nEscolha invalida! Digite novamente:");
										clonemonTroca = escolhaClonemon.nextInt();
										}
											while(player1.monstroEquipe[clonemonTroca-1].EstaVivo() == false) {
												System.out.println("\nEsse CLONEMON ja foi derrotado! Escolha outro: ");
												clonemonTroca = escolhaClonemon.nextInt();
											}
										
									}while(clonemonTroca < 1 || clonemonTroca > 3);
									
										switch (clonemonTroca) {
											
											case 1:
												System.out.println("\nVoce escolheu " + player1.monstroEquipe[0].getNome() + " para a troca!");
												clonemonBatalha = clonemonTroca;
												break;
													
											case 2:
												System.out.println("\nVoce escolheu " + player1.monstroEquipe[1].getNome() + " para a troca!");
												clonemonBatalha = clonemonTroca;
												break;
													
											case 3:
												System.out.println("\nVoce escolheu " + player1.monstroEquipe[2].getNome() + " para a troca!");
												clonemonBatalha = clonemonTroca;
												break;
					
										}clonemonTroca = 4;
			                    }
                	}
					}else {
						if(player2.monstroEquipe[clonemonBatalhaP2-1].EstaVivo() == true) {
							if(player1.monstroEquipe[clonemonBatalha-1].EstaVivo() == true) {
                    	p2AtkRound++;
                    	player1.monstroEquipe[clonemonBatalha-1].setVida(player1.monstroEquipe[clonemonBatalha-1].SofrerDano(player2.monstroEquipe[clonemonBatalhaP2-1].AtacarNormal(),
    	                player1.monstroEquipe[clonemonBatalha-1].getVida(), player2.monstroEquipe[clonemonBatalhaP2-1].getTipo(), player1.monstroEquipe[clonemonBatalha-1].getTipo()));
                    	if(player2.monstroEquipe[clonemonBatalhaP2-1].SuperEfetivo(player2.monstroEquipe[clonemonBatalhaP2-1].getTipo(), player1.monstroEquipe[clonemonBatalha-1].getTipo()) == true) {
                        	System.out.println("\nO ataque " + player2.monstroEquipe[clonemonBatalhaP2-1].getAtaque().getNome() + " de " + player2.monstroEquipe[clonemonBatalhaP2-1].getNome() + " eh SUPER EFETIVO em " + player1.monstroEquipe[clonemonBatalha-1].getNome() + " e ele ficou com " + player1.monstroEquipe[clonemonBatalha-1].getVida() + " de vida!");
                        }else if(player2.monstroEquipe[clonemonBatalhaP2-1].PoucoEfetivo(player2.monstroEquipe[clonemonBatalhaP2-1].getTipo(), player1.monstroEquipe[clonemonBatalha-1].getTipo()) == true) {
                        	System.out.println("\nO ataque " + player2.monstroEquipe[clonemonBatalhaP2-1].getAtaque().getNome() + " de " + player2.monstroEquipe[clonemonBatalhaP2-1].getNome() + " eh POUCO EFETIVO em " + player1.monstroEquipe[clonemonBatalha-1].getNome() + " e ele ficou com " + player1.monstroEquipe[clonemonBatalha-1].getVida() + " de vida!");
                        }else System.out.println("\nO " + player1.monstroEquipe[clonemonBatalha-1].getNome() + " ficou com " + player1.monstroEquipe[clonemonBatalha-1].getVida() + " de vida!");
							}else {
								if(player1.TemMonstros() == true) {
			                    	System.out.println("\nSeu CLONEMON " + player1.monstroEquipe[clonemonBatalha-1].getNome() + " esta FORA DE COMBATE!!");
			                		System.out.println("\nEscolha outro CLONEMON da sua equipe para substituilo:");
									System.out.println("\n1- " + player1.monstroEquipe[0].getNome() + "   2- " + player1.monstroEquipe[1].getNome() + "   3- " + player1.monstroEquipe[2].getNome());
									clonemonTroca = escolhaClonemon.nextInt();
									do {
										if(clonemonTroca < 1 || clonemonTroca > 3) {
										System.out.println("\nEscolha invalida! Digite novamente:");
										clonemonTroca = escolhaClonemon.nextInt();
										}
											while(player1.monstroEquipe[clonemonTroca-1].EstaVivo() == false) {
												System.out.println("\nEsse CLONEMON ja foi derrotado! Escolha outro: ");
												clonemonTroca = escolhaClonemon.nextInt();
											}
										
									}while(clonemonTroca < 1 || clonemonTroca > 3);
									
										switch (clonemonTroca) {
											
											case 1:
												System.out.println("\nVoce escolheu " + player1.monstroEquipe[0].getNome() + " para a troca!");
												clonemonBatalha = clonemonTroca;
												break;
													
											case 2:
												System.out.println("\nVoce escolheu " + player1.monstroEquipe[1].getNome() + " para a troca!");
												clonemonBatalha = clonemonTroca;
												break;
													
											case 3:
												System.out.println("\nVoce escolheu " + player1.monstroEquipe[2].getNome() + " para a troca!");
												clonemonBatalha = clonemonTroca;
												break;
					
										}clonemonTroca = 4;
			                    }
	                    	}
							}else {
								if(player2.TemMonstros() == true) {
		                        	System.out.println("\nSeu CLONEMON " + player2.monstroEquipe[clonemonBatalhaP2-1].getNome() + " esta FORA DE COMBATE!!");
		                    		System.out.println("\nEscolha outro CLONEMON da sua equipe para substituilo:");
		    						System.out.println("\n1- " + player2.monstroEquipe[0].getNome() + "   2- " + player2.monstroEquipe[1].getNome() + "   3- " + player2.monstroEquipe[2].getNome());
		    						clonemonTrocaP2 = escolhaClonemon.nextInt();
		    						do {
		    							if(clonemonTrocaP2 < 1 || clonemonTrocaP2 > 3) {
		    							System.out.println("\nEscolha invalida! Digite novamente:");
		    							clonemonTrocaP2 = escolhaClonemon.nextInt();
		    							}
		    								while(player2.monstroEquipe[clonemonTrocaP2-1].EstaVivo() == false) {
		    									System.out.println("\nEsse CLONEMON ja foi derrotado! Escolha outro: ");
		    									clonemonTrocaP2 = escolhaClonemon.nextInt();
		    								}
		    							
		    						}while(clonemonTrocaP2 < 1 || clonemonTrocaP2 > 3);
		    						
		    							switch (clonemonTrocaP2) {
		    								
		    								case 1:
		    									System.out.println("\nVoce escolheu " + player2.monstroEquipe[0].getNome() + " para a troca!");
		    									clonemonBatalhaP2 = clonemonTrocaP2;
		    									break;
		    										
		    								case 2:
		    									System.out.println("\nVoce escolheu " + player2.monstroEquipe[1].getNome() + " para a troca!");
		    									clonemonBatalhaP2 = clonemonTrocaP2;
		    									break;
		    										
		    								case 3:
		    									System.out.println("\nVoce escolheu " + player2.monstroEquipe[2].getNome() + " para a troca!");
		    									clonemonBatalhaP2 = clonemonTrocaP2;
		    									break;
		    		
		    							}clonemonTrocaP2 = 4;
		                        	
		                        }
                	}
					}if(p1AtkRound > p2AtkRound) {
						if(player2.monstroEquipe[clonemonBatalhaP2-1].EstaVivo() == true) {
							if(player1.monstroEquipe[clonemonBatalha-1].EstaVivo() == true) {
                    	player1.monstroEquipe[clonemonBatalha-1].setVida(player1.monstroEquipe[clonemonBatalha-1].SofrerDano(player2.monstroEquipe[clonemonBatalhaP2-1].AtacarNormal(),
    	    	                player1.monstroEquipe[clonemonBatalha-1].getVida(), player2.monstroEquipe[clonemonBatalhaP2-1].getTipo(), player1.monstroEquipe[clonemonBatalha-1].getTipo()));
    	                    	if(player2.monstroEquipe[clonemonBatalhaP2-1].SuperEfetivo(player2.monstroEquipe[clonemonBatalhaP2-1].getTipo(), player1.monstroEquipe[clonemonBatalha-1].getTipo()) == true) {
    	                        	System.out.println("\nO ataque " + player2.monstroEquipe[clonemonBatalhaP2-1].getAtaque().getNome() + " de " + player2.monstroEquipe[clonemonBatalhaP2-1].getNome() + " eh SUPER EFETIVO em " + player1.monstroEquipe[clonemonBatalha-1].getNome() + " e ele ficou com " + player1.monstroEquipe[clonemonBatalha-1].getVida() + " de vida!");
    	                        }else if(player2.monstroEquipe[clonemonBatalhaP2-1].PoucoEfetivo(player2.monstroEquipe[clonemonBatalhaP2-1].getTipo(), player1.monstroEquipe[clonemonBatalha-1].getTipo()) == true) {
    	                        	System.out.println("\nO ataque " + player2.monstroEquipe[clonemonBatalhaP2-1].getAtaque().getNome() + " de " + player2.monstroEquipe[clonemonBatalhaP2-1].getNome() + " eh POUCO EFETIVO em " + player1.monstroEquipe[clonemonBatalha-1].getNome() + " e ele ficou com " + player1.monstroEquipe[clonemonBatalha-1].getVida() + " de vida!");
    	                        }else System.out.println("\nO " + player1.monstroEquipe[clonemonBatalha-1].getNome() + " ficou com " + player1.monstroEquipe[clonemonBatalha-1].getVida() + " de vida!");
							}else {
								if(player1.TemMonstros() == true) {
			                    	System.out.println("\nSeu CLONEMON " + player1.monstroEquipe[clonemonBatalha-1].getNome() + " esta FORA DE COMBATE!!");
			                		System.out.println("\nEscolha outro CLONEMON da sua equipe para substituilo:");
									System.out.println("\n1- " + player1.monstroEquipe[0].getNome() + "   2- " + player1.monstroEquipe[1].getNome() + "   3- " + player1.monstroEquipe[2].getNome());
									clonemonTroca = escolhaClonemon.nextInt();
									do {
										if(clonemonTroca < 1 || clonemonTroca > 3) {
										System.out.println("\nEscolha invalida! Digite novamente:");
										clonemonTroca = escolhaClonemon.nextInt();
										}
											while(player1.monstroEquipe[clonemonTroca-1].EstaVivo() == false) {
												System.out.println("\nEsse CLONEMON ja foi derrotado! Escolha outro: ");
												clonemonTroca = escolhaClonemon.nextInt();
											}
										
									}while(clonemonTroca < 1 || clonemonTroca > 3);
									
										switch (clonemonTroca) {
											
											case 1:
												System.out.println("\nVoce escolheu " + player1.monstroEquipe[0].getNome() + " para a troca!");
												clonemonBatalha = clonemonTroca;
												break;
													
											case 2:
												System.out.println("\nVoce escolheu " + player1.monstroEquipe[1].getNome() + " para a troca!");
												clonemonBatalha = clonemonTroca;
												break;
													
											case 3:
												System.out.println("\nVoce escolheu " + player1.monstroEquipe[2].getNome() + " para a troca!");
												clonemonBatalha = clonemonTroca;
												break;
					
										}clonemonTroca = 4;
			                    }
	                    	}
							}else {
								if(player2.TemMonstros() == true) {
		                        	System.out.println("\nSeu CLONEMON " + player2.monstroEquipe[clonemonBatalhaP2-1].getNome() + " esta FORA DE COMBATE!!");
		                    		System.out.println("\nEscolha outro CLONEMON da sua equipe para substituilo:");
		    						System.out.println("\n1- " + player2.monstroEquipe[0].getNome() + "   2- " + player2.monstroEquipe[1].getNome() + "   3- " + player2.monstroEquipe[2].getNome());
		    						clonemonTrocaP2 = escolhaClonemon.nextInt();
		    						do {
		    							if(clonemonTrocaP2 < 1 || clonemonTrocaP2 > 3) {
		    							System.out.println("\nEscolha invalida! Digite novamente:");
		    							clonemonTrocaP2 = escolhaClonemon.nextInt();
		    							}
		    								while(player2.monstroEquipe[clonemonTrocaP2-1].EstaVivo() == false) {
		    									System.out.println("\nEsse CLONEMON ja foi derrotado! Escolha outro: ");
		    									clonemonTrocaP2 = escolhaClonemon.nextInt();
		    								}
		    							
		    						}while(clonemonTrocaP2 < 1 || clonemonTrocaP2 > 3);
		    						
		    							switch (clonemonTrocaP2) {
		    								
		    								case 1:
		    									System.out.println("\nVoce escolheu " + player2.monstroEquipe[0].getNome() + " para a troca!");
		    									clonemonBatalhaP2 = clonemonTrocaP2;
		    									break;
		    										
		    								case 2:
		    									System.out.println("\nVoce escolheu " + player2.monstroEquipe[1].getNome() + " para a troca!");
		    									clonemonBatalhaP2 = clonemonTrocaP2;
		    									break;
		    										
		    								case 3:
		    									System.out.println("\nVoce escolheu " + player2.monstroEquipe[2].getNome() + " para a troca!");
		    									clonemonBatalhaP2 = clonemonTrocaP2;
		    									break;
		    		
		    							}clonemonTrocaP2 = 4;
		                        	
		                        }
                	}
					}else {
                    	if(player1.monstroEquipe[clonemonBatalha-1].EstaVivo() == true) {
                    		if(player2.monstroEquipe[clonemonBatalhaP2-1].EstaVivo() == true) {
                    	player2.monstroEquipe[clonemonBatalhaP2-1].setVida(player2.monstroEquipe[clonemonBatalhaP2-1].SofrerDano(player1.monstroEquipe[clonemonBatalha-1].AtacarEspecial(),
    	                        player2.monstroEquipe[clonemonBatalhaP2-1].getVida(), player1.monstroEquipe[clonemonBatalha-1].getTipo(), player2.monstroEquipe[clonemonBatalhaP2-1].getTipo()));
    	                        if(player1.monstroEquipe[clonemonBatalha-1].SuperEfetivo(player1.monstroEquipe[clonemonBatalha-1].getTipo(), player2.monstroEquipe[clonemonBatalhaP2-1].getTipo()) == true) {
    	                        	System.out.println("\nO ataque " + player1.monstroEquipe[clonemonBatalha-1].getAtaqueEspecial().getNome() + " de " + player1.monstroEquipe[clonemonBatalha-1].getNome() + " eh SUPER EFETIVO em " + player2.monstroEquipe[clonemonBatalhaP2-1].getNome() + " e ele ficou com " + player2.monstroEquipe[clonemonBatalhaP2-1].getVida() + " de vida!");
    	                        }else if(player1.monstroEquipe[clonemonBatalha-1].PoucoEfetivo(player1.monstroEquipe[clonemonBatalha-1].getTipo(), player2.monstroEquipe[clonemonBatalhaP2-1].getTipo()) == true) {
    	                        	System.out.println("\nO ataque " + player1.monstroEquipe[clonemonBatalha-1].getAtaqueEspecial().getNome() + " de " + player1.monstroEquipe[clonemonBatalha-1].getNome() + " eh POUCO EFETIVO em " + player2.monstroEquipe[clonemonBatalhaP2-1].getNome() + " e ele ficou com " + player2.monstroEquipe[clonemonBatalhaP2-1].getVida() + " de vida!");
    	                        }else System.out.println("\n " + player2.monstroEquipe[clonemonBatalhaP2-1].getNome() + " ficou com " + player2.monstroEquipe[clonemonBatalhaP2-1].getVida() + " de vida!");
                    		}else {
                    			if(player2.TemMonstros() == true) {
                                	System.out.println("\nSeu CLONEMON " + player2.monstroEquipe[clonemonBatalhaP2-1].getNome() + " esta FORA DE COMBATE!!");
                            		System.out.println("\nEscolha outro CLONEMON da sua equipe para substituilo:");
            						System.out.println("\n1- " + player2.monstroEquipe[0].getNome() + "   2- " + player2.monstroEquipe[1].getNome() + "   3- " + player2.monstroEquipe[2].getNome());
            						clonemonTrocaP2 = escolhaClonemon.nextInt();
            						do {
            							if(clonemonTrocaP2 < 1 || clonemonTrocaP2 > 3) {
            							System.out.println("\nEscolha invalida! Digite novamente:");
            							clonemonTrocaP2 = escolhaClonemon.nextInt();
            							}
            								while(player2.monstroEquipe[clonemonTrocaP2-1].EstaVivo() == false) {
            									System.out.println("\nEsse CLONEMON ja foi derrotado! Escolha outro: ");
            									clonemonTrocaP2 = escolhaClonemon.nextInt();
            								}
            							
            						}while(clonemonTrocaP2 < 1 || clonemonTrocaP2 > 3);
            						
            							switch (clonemonTrocaP2) {
            								
            								case 1:
            									System.out.println("\nVoce escolheu " + player2.monstroEquipe[0].getNome() + " para a troca!");
            									clonemonBatalhaP2 = clonemonTrocaP2;
            									break;
            										
            								case 2:
            									System.out.println("\nVoce escolheu " + player2.monstroEquipe[1].getNome() + " para a troca!");
            									clonemonBatalhaP2 = clonemonTrocaP2;
            									break;
            										
            								case 3:
            									System.out.println("\nVoce escolheu " + player2.monstroEquipe[2].getNome() + " para a troca!");
            									clonemonBatalhaP2 = clonemonTrocaP2;
            									break;
            		
            							}clonemonTrocaP2 = 4;
                                	
                                }
                        	}
                    		}else {
                    			if(player1.TemMonstros() == true) {
                                	System.out.println("\nSeu CLONEMON " + player1.monstroEquipe[clonemonBatalha-1].getNome() + " esta FORA DE COMBATE!!");
                            		System.out.println("\nEscolha outro CLONEMON da sua equipe para substituilo:");
            						System.out.println("\n1- " + player1.monstroEquipe[0].getNome() + "   2- " + player1.monstroEquipe[1].getNome() + "   3- " + player1.monstroEquipe[2].getNome());
            						clonemonTroca = escolhaClonemon.nextInt();
            						do {
            							if(clonemonTroca < 1 || clonemonTroca > 3) {
            							System.out.println("\nEscolha invalida! Digite novamente:");
            							clonemonTroca = escolhaClonemon.nextInt();
            							}
            								while(player1.monstroEquipe[clonemonTroca-1].EstaVivo() == false) {
            									System.out.println("\nEsse CLONEMON ja foi derrotado! Escolha outro: ");
            									clonemonTroca = escolhaClonemon.nextInt();
            								}
            							
            						}while(clonemonTroca < 1 || clonemonTroca > 3);
            						
            							switch (clonemonTroca) {
            								
            								case 1:
            									System.out.println("\nVoce escolheu " + player1.monstroEquipe[0].getNome() + " para a troca!");
            									clonemonBatalha = clonemonTroca;
            									break;
            										
            								case 2:
            									System.out.println("\nVoce escolheu " + player1.monstroEquipe[1].getNome() + " para a troca!");
            									clonemonBatalha = clonemonTroca;
            									break;
            										
            								case 3:
            									System.out.println("\nVoce escolheu " + player1.monstroEquipe[2].getNome() + " para a troca!");
            									clonemonBatalha = clonemonTroca;
            									break;
            		
            							}clonemonTroca = 4;
                                }
                	}
                    }	
					if(player1.monstroEquipe[clonemonBatalha-1].EstaVivo() == false) {
						if(player1.TemMonstros() == true) {
	                    	System.out.println("\nSeu CLONEMON " + player1.monstroEquipe[clonemonBatalha-1].getNome() + " esta FORA DE COMBATE!!");
	                		System.out.println("\nEscolha outro CLONEMON da sua equipe para substituilo:");
							System.out.println("\n1- " + player1.monstroEquipe[0].getNome() + "   2- " + player1.monstroEquipe[1].getNome() + "   3- " + player1.monstroEquipe[2].getNome());
							clonemonTroca = escolhaClonemon.nextInt();
							do {
								if(clonemonTroca < 1 || clonemonTroca > 3) {
								System.out.println("\nEscolha invalida! Digite novamente:");
								clonemonTroca = escolhaClonemon.nextInt();
								}
									while(player1.monstroEquipe[clonemonTroca-1].EstaVivo() == false) {
										System.out.println("\nEsse CLONEMON ja foi derrotado! Escolha outro: ");
										clonemonTroca = escolhaClonemon.nextInt();
									}
								
							}while(clonemonTroca < 1 || clonemonTroca > 3);
							
								switch (clonemonTroca) {
									
									case 1:
										System.out.println("\nVoce escolheu " + player1.monstroEquipe[0].getNome() + " para a troca!");
										clonemonBatalha = clonemonTroca;
										break;
											
									case 2:
										System.out.println("\nVoce escolheu " + player1.monstroEquipe[1].getNome() + " para a troca!");
										clonemonBatalha = clonemonTroca;
										break;
											
									case 3:
										System.out.println("\nVoce escolheu " + player1.monstroEquipe[2].getNome() + " para a troca!");
										clonemonBatalha = clonemonTroca;
										break;
			
								}clonemonTroca = 4;
	                    }
				}
                    if(player2.monstroEquipe[clonemonBatalhaP2-1].EstaVivo() == false) {
                    	if(player2.TemMonstros() == true) {
                        	System.out.println("\nSeu CLONEMON " + player2.monstroEquipe[clonemonBatalhaP2-1].getNome() + " esta FORA DE COMBATE!!");
                    		System.out.println("\nEscolha outro CLONEMON da sua equipe para substituilo:");
    						System.out.println("\n1- " + player2.monstroEquipe[0].getNome() + "   2- " + player2.monstroEquipe[1].getNome() + "   3- " + player2.monstroEquipe[2].getNome());
    						clonemonTrocaP2 = escolhaClonemon.nextInt();
    						do {
    							if(clonemonTrocaP2 < 1 || clonemonTrocaP2 > 3) {
    							System.out.println("\nEscolha invalida! Digite novamente:");
    							clonemonTrocaP2 = escolhaClonemon.nextInt();
    							}
    								while(player2.monstroEquipe[clonemonTrocaP2-1].EstaVivo() == false) {
    									System.out.println("\nEsse CLONEMON ja foi derrotado! Escolha outro: ");
    									clonemonTrocaP2 = escolhaClonemon.nextInt();
    								}
    							
    						}while(clonemonTrocaP2 < 1 || clonemonTrocaP2 > 3);
    						
    							switch (clonemonTrocaP2) {
    								
    								case 1:
    									System.out.println("\nVoce escolheu " + player2.monstroEquipe[0].getNome() + " para a troca!");
    									clonemonBatalhaP2 = clonemonTrocaP2;
    									break;
    										
    								case 2:
    									System.out.println("\nVoce escolheu " + player2.monstroEquipe[1].getNome() + " para a troca!");
    									clonemonBatalhaP2 = clonemonTrocaP2;
    									break;
    										
    								case 3:
    									System.out.println("\nVoce escolheu " + player2.monstroEquipe[2].getNome() + " para a troca!");
    									clonemonBatalhaP2 = clonemonTrocaP2;
    									break;
    		
    							}clonemonTrocaP2 = 4;
                        	
                        }
            		
                    }
				}
				if(movimentoRound == 1 && movimentoRoundP2 == 2) {
					if(player2.monstroEquipe[clonemonBatalhaP2-1].getVelocidade() < player1.monstroEquipe[clonemonBatalha-1].getVelocidade()) {
						if(player1.monstroEquipe[clonemonBatalha-1].EstaVivo() == true) {
							if(player2.monstroEquipe[clonemonBatalhaP2-1].EstaVivo() == true) {
                    	p1AtkRound++;
                        player2.monstroEquipe[clonemonBatalhaP2-1].setVida(player2.monstroEquipe[clonemonBatalhaP2-1].SofrerDano(player1.monstroEquipe[clonemonBatalha-1].AtacarNormal(),
                        player2.monstroEquipe[clonemonBatalhaP2-1].getVida(), player1.monstroEquipe[clonemonBatalha-1].getTipo(), player2.monstroEquipe[clonemonBatalhaP2-1].getTipo()));
                        if(player1.monstroEquipe[clonemonBatalha-1].SuperEfetivo(player1.monstroEquipe[clonemonBatalha-1].getTipo(), player2.monstroEquipe[clonemonBatalhaP2-1].getTipo()) == true) {
                        	System.out.println("\nO ataque " + player1.monstroEquipe[clonemonBatalha-1].getAtaque().getNome() + " de " + player1.monstroEquipe[clonemonBatalha-1].getNome() + " eh SUPER EFETIVO em " + player2.monstroEquipe[clonemonBatalhaP2-1].getNome() + " e ele ficou com " + player2.monstroEquipe[clonemonBatalhaP2-1].getVida() + " de vida!");
                        }else if(player1.monstroEquipe[clonemonBatalha-1].PoucoEfetivo(player1.monstroEquipe[clonemonBatalha-1].getTipo(), player2.monstroEquipe[clonemonBatalhaP2-1].getTipo()) == true) {
                        	System.out.println("\nO ataque " + player1.monstroEquipe[clonemonBatalha-1].getAtaque().getNome() + " de " + player1.monstroEquipe[clonemonBatalha-1].getNome() + " eh POUCO EFETIVO em " + player2.monstroEquipe[clonemonBatalhaP2-1].getNome() + " e ele ficou com " + player2.monstroEquipe[clonemonBatalhaP2-1].getVida() + " de vida!");
                        }else System.out.println("\n " + player2.monstroEquipe[clonemonBatalhaP2-1].getNome() + " ficou com " + player2.monstroEquipe[clonemonBatalhaP2-1].getVida() + " de vida!");
							}else {
								if(player2.TemMonstros() == true) {
                                	System.out.println("\nSeu CLONEMON " + player2.monstroEquipe[clonemonBatalhaP2-1].getNome() + " esta FORA DE COMBATE!!");
                            		System.out.println("\nEscolha outro CLONEMON da sua equipe para substituilo:");
            						System.out.println("\n1- " + player2.monstroEquipe[0].getNome() + "   2- " + player2.monstroEquipe[1].getNome() + "   3- " + player2.monstroEquipe[2].getNome());
            						clonemonTrocaP2 = escolhaClonemon.nextInt();
            						do {
            							if(clonemonTrocaP2 < 1 || clonemonTrocaP2 > 3) {
            							System.out.println("\nEscolha invalida! Digite novamente:");
            							clonemonTrocaP2 = escolhaClonemon.nextInt();
            							}
            								while(player2.monstroEquipe[clonemonTrocaP2-1].EstaVivo() == false) {
            									System.out.println("\nEsse CLONEMON ja foi derrotado! Escolha outro: ");
            									clonemonTrocaP2 = escolhaClonemon.nextInt();
            								}
            							
            						}while(clonemonTrocaP2 < 1 || clonemonTrocaP2 > 3);
            						
            							switch (clonemonTrocaP2) {
            								
            								case 1:
            									System.out.println("\nVoce escolheu " + player2.monstroEquipe[0].getNome() + " para a troca!");
            									clonemonBatalhaP2 = clonemonTrocaP2;
            									break;
            										
            								case 2:
            									System.out.println("\nVoce escolheu " + player2.monstroEquipe[1].getNome() + " para a troca!");
            									clonemonBatalhaP2 = clonemonTrocaP2;
            									break;
            										
            								case 3:
            									System.out.println("\nVoce escolheu " + player2.monstroEquipe[2].getNome() + " para a troca!");
            									clonemonBatalhaP2 = clonemonTrocaP2;
            									break;
            		
            							}clonemonTrocaP2 = 4;
                                	
                                }
                    		}
							}else {
								if(player1.TemMonstros() == true) {
			                    	System.out.println("\nSeu CLONEMON " + player1.monstroEquipe[clonemonBatalha-1].getNome() + " esta FORA DE COMBATE!!");
			                		System.out.println("\nEscolha outro CLONEMON da sua equipe para substituilo:");
									System.out.println("\n1- " + player1.monstroEquipe[0].getNome() + "   2- " + player1.monstroEquipe[1].getNome() + "   3- " + player1.monstroEquipe[2].getNome());
									clonemonTroca = escolhaClonemon.nextInt();
									do {
										if(clonemonTroca < 1 || clonemonTroca > 3) {
										System.out.println("\nEscolha invalida! Digite novamente:");
										clonemonTroca = escolhaClonemon.nextInt();
										}
											while(player1.monstroEquipe[clonemonTroca-1].EstaVivo() == false) {
												System.out.println("\nEsse CLONEMON ja foi derrotado! Escolha outro: ");
												clonemonTroca = escolhaClonemon.nextInt();
											}
										
									}while(clonemonTroca < 1 || clonemonTroca > 3);
									
										switch (clonemonTroca) {
											
											case 1:
												System.out.println("\nVoce escolheu " + player1.monstroEquipe[0].getNome() + " para a troca!");
												clonemonBatalha = clonemonTroca;
												break;
													
											case 2:
												System.out.println("\nVoce escolheu " + player1.monstroEquipe[1].getNome() + " para a troca!");
												clonemonBatalha = clonemonTroca;
												break;
													
											case 3:
												System.out.println("\nVoce escolheu " + player1.monstroEquipe[2].getNome() + " para a troca!");
												clonemonBatalha = clonemonTroca;
												break;
					
										}clonemonTroca = 4;
			                    }
                	}
					}else {
						if(player2.monstroEquipe[clonemonBatalhaP2-1].EstaVivo() == true) {
							if(player1.monstroEquipe[clonemonBatalha-1].EstaVivo() == true) {
                    	p2AtkRound++;
                    	player1.monstroEquipe[clonemonBatalha-1].setVida(player1.monstroEquipe[clonemonBatalha-1].SofrerDano(player2.monstroEquipe[clonemonBatalhaP2-1].AtacarEspecial(),
    	                player1.monstroEquipe[clonemonBatalha-1].getVida(), player2.monstroEquipe[clonemonBatalhaP2-1].getTipo(), player1.monstroEquipe[clonemonBatalha-1].getTipo()));
                    	if(player2.monstroEquipe[clonemonBatalhaP2-1].SuperEfetivo(player2.monstroEquipe[clonemonBatalhaP2-1].getTipo(), player1.monstroEquipe[clonemonBatalha-1].getTipo()) == true) {
                        	System.out.println("\nO ataque " + player2.monstroEquipe[clonemonBatalhaP2-1].getAtaqueEspecial().getNome() + " de " + player2.monstroEquipe[clonemonBatalhaP2-1].getNome() + " eh SUPER EFETIVO em " + player1.monstroEquipe[clonemonBatalha-1].getNome() + " e ele ficou com " + player1.monstroEquipe[clonemonBatalha-1].getVida() + " de vida!");
                        }else if(player2.monstroEquipe[clonemonBatalhaP2-1].PoucoEfetivo(player2.monstroEquipe[clonemonBatalhaP2-1].getTipo(), player1.monstroEquipe[clonemonBatalha-1].getTipo()) == true) {
                        	System.out.println("\nO ataque " + player2.monstroEquipe[clonemonBatalhaP2-1].getAtaqueEspecial().getNome() + " de " + player2.monstroEquipe[clonemonBatalhaP2-1].getNome() + " eh POUCO EFETIVO em " + player1.monstroEquipe[clonemonBatalha-1].getNome() + " e ele ficou com " + player1.monstroEquipe[clonemonBatalha-1].getVida() + " de vida!");
                        }else System.out.println("\nO " + player1.monstroEquipe[clonemonBatalha-1].getNome() + " ficou com " + player1.monstroEquipe[clonemonBatalha-1].getVida() + " de vida!");
							}else {
								if(player1.TemMonstros() == true) {
			                    	System.out.println("\nSeu CLONEMON " + player1.monstroEquipe[clonemonBatalha-1].getNome() + " esta FORA DE COMBATE!!");
			                		System.out.println("\nEscolha outro CLONEMON da sua equipe para substituilo:");
									System.out.println("\n1- " + player1.monstroEquipe[0].getNome() + "   2- " + player1.monstroEquipe[1].getNome() + "   3- " + player1.monstroEquipe[2].getNome());
									clonemonTroca = escolhaClonemon.nextInt();
									do {
										if(clonemonTroca < 1 || clonemonTroca > 3) {
										System.out.println("\nEscolha invalida! Digite novamente:");
										clonemonTroca = escolhaClonemon.nextInt();
										}
											while(player1.monstroEquipe[clonemonTroca-1].EstaVivo() == false) {
												System.out.println("\nEsse CLONEMON ja foi derrotado! Escolha outro: ");
												clonemonTroca = escolhaClonemon.nextInt();
											}
										
									}while(clonemonTroca < 1 || clonemonTroca > 3);
									
										switch (clonemonTroca) {
											
											case 1:
												System.out.println("\nVoce escolheu " + player1.monstroEquipe[0].getNome() + " para a troca!");
												clonemonBatalha = clonemonTroca;
												break;
													
											case 2:
												System.out.println("\nVoce escolheu " + player1.monstroEquipe[1].getNome() + " para a troca!");
												clonemonBatalha = clonemonTroca;
												break;
													
											case 3:
												System.out.println("\nVoce escolheu " + player1.monstroEquipe[2].getNome() + " para a troca!");
												clonemonBatalha = clonemonTroca;
												break;
					
										}clonemonTroca = 4;
			                    }
	                    	}
							}else {
								if(player2.TemMonstros() == true) {
                                	System.out.println("\nSeu CLONEMON " + player2.monstroEquipe[clonemonBatalhaP2-1].getNome() + " esta FORA DE COMBATE!!");
                            		System.out.println("\nEscolha outro CLONEMON da sua equipe para substituilo:");
            						System.out.println("\n1- " + player2.monstroEquipe[0].getNome() + "   2- " + player2.monstroEquipe[1].getNome() + "   3- " + player2.monstroEquipe[2].getNome());
            						clonemonTrocaP2 = escolhaClonemon.nextInt();
            						do {
            							if(clonemonTrocaP2 < 1 || clonemonTrocaP2 > 3) {
            							System.out.println("\nEscolha invalida! Digite novamente:");
            							clonemonTrocaP2 = escolhaClonemon.nextInt();
            							}
            								while(player2.monstroEquipe[clonemonTrocaP2-1].EstaVivo() == false) {
            									System.out.println("\nEsse CLONEMON ja foi derrotado! Escolha outro: ");
            									clonemonTrocaP2 = escolhaClonemon.nextInt();
            								}
            							
            						}while(clonemonTrocaP2 < 1 || clonemonTrocaP2 > 3);
            						
            							switch (clonemonTrocaP2) {
            								
            								case 1:
            									System.out.println("\nVoce escolheu " + player2.monstroEquipe[0].getNome() + " para a troca!");
            									clonemonBatalhaP2 = clonemonTrocaP2;
            									break;
            										
            								case 2:
            									System.out.println("\nVoce escolheu " + player2.monstroEquipe[1].getNome() + " para a troca!");
            									clonemonBatalhaP2 = clonemonTrocaP2;
            									break;
            										
            								case 3:
            									System.out.println("\nVoce escolheu " + player2.monstroEquipe[2].getNome() + " para a troca!");
            									clonemonBatalhaP2 = clonemonTrocaP2;
            									break;
            		
            							}clonemonTrocaP2 = 4;
                                	
                                }
                    		}
					}if(p1AtkRound > p2AtkRound) {
						if(player2.monstroEquipe[clonemonBatalhaP2-1].EstaVivo() == true) {
							if(player1.monstroEquipe[clonemonBatalha-1].EstaVivo() == true) {
                    	player1.monstroEquipe[clonemonBatalha-1].setVida(player1.monstroEquipe[clonemonBatalha-1].SofrerDano(player2.monstroEquipe[clonemonBatalhaP2-1].AtacarEspecial(),
    	    	                player1.monstroEquipe[clonemonBatalha-1].getVida(), player2.monstroEquipe[clonemonBatalhaP2-1].getTipo(), player1.monstroEquipe[clonemonBatalha-1].getTipo()));
    	                    	if(player2.monstroEquipe[clonemonBatalhaP2-1].SuperEfetivo(player2.monstroEquipe[clonemonBatalhaP2-1].getTipo(), player1.monstroEquipe[clonemonBatalha-1].getTipo()) == true) {
    	                        	System.out.println("\nO ataque " + player2.monstroEquipe[clonemonBatalhaP2-1].getAtaqueEspecial().getNome() + " de " + player2.monstroEquipe[clonemonBatalhaP2-1].getNome() + " eh SUPER EFETIVO em " + player1.monstroEquipe[clonemonBatalha-1].getNome() + " e ele ficou com " + player1.monstroEquipe[clonemonBatalha-1].getVida() + " de vida!");
    	                        }else if(player2.monstroEquipe[clonemonBatalhaP2-1].PoucoEfetivo(player2.monstroEquipe[clonemonBatalhaP2-1].getTipo(), player1.monstroEquipe[clonemonBatalha-1].getTipo()) == true) {
    	                        	System.out.println("\nO ataque " + player2.monstroEquipe[clonemonBatalhaP2-1].getAtaqueEspecial().getNome() + " de " + player2.monstroEquipe[clonemonBatalhaP2-1].getNome() + " eh POUCO EFETIVO em " + player1.monstroEquipe[clonemonBatalha-1].getNome() + " e ele ficou com " + player1.monstroEquipe[clonemonBatalha-1].getVida() + " de vida!");
    	                        }else System.out.println("\nO " + player1.monstroEquipe[clonemonBatalha-1].getNome() + " ficou com " + player1.monstroEquipe[clonemonBatalha-1].getVida() + " de vida!");
							}else {
								if(player1.TemMonstros() == true) {
			                    	System.out.println("\nSeu CLONEMON " + player1.monstroEquipe[clonemonBatalha-1].getNome() + " esta FORA DE COMBATE!!");
			                		System.out.println("\nEscolha outro CLONEMON da sua equipe para substituilo:");
									System.out.println("\n1- " + player1.monstroEquipe[0].getNome() + "   2- " + player1.monstroEquipe[1].getNome() + "   3- " + player1.monstroEquipe[2].getNome());
									clonemonTroca = escolhaClonemon.nextInt();
									do {
										if(clonemonTroca < 1 || clonemonTroca > 3) {
										System.out.println("\nEscolha invalida! Digite novamente:");
										clonemonTroca = escolhaClonemon.nextInt();
										}
											while(player1.monstroEquipe[clonemonTroca-1].EstaVivo() == false) {
												System.out.println("\nEsse CLONEMON ja foi derrotado! Escolha outro: ");
												clonemonTroca = escolhaClonemon.nextInt();
											}
										
									}while(clonemonTroca < 1 || clonemonTroca > 3);
									
										switch (clonemonTroca) {
											
											case 1:
												System.out.println("\nVoce escolheu " + player1.monstroEquipe[0].getNome() + " para a troca!");
												clonemonBatalha = clonemonTroca;
												break;
													
											case 2:
												System.out.println("\nVoce escolheu " + player1.monstroEquipe[1].getNome() + " para a troca!");
												clonemonBatalha = clonemonTroca;
												break;
													
											case 3:
												System.out.println("\nVoce escolheu " + player1.monstroEquipe[2].getNome() + " para a troca!");
												clonemonBatalha = clonemonTroca;
												break;
					
										}clonemonTroca = 4;
			                    }
	                    	}
							}else {
								if(player2.TemMonstros() == true) {
                                	System.out.println("\nSeu CLONEMON " + player2.monstroEquipe[clonemonBatalhaP2-1].getNome() + " esta FORA DE COMBATE!!");
                            		System.out.println("\nEscolha outro CLONEMON da sua equipe para substituilo:");
            						System.out.println("\n1- " + player2.monstroEquipe[0].getNome() + "   2- " + player2.monstroEquipe[1].getNome() + "   3- " + player2.monstroEquipe[2].getNome());
            						clonemonTrocaP2 = escolhaClonemon.nextInt();
            						do {
            							if(clonemonTrocaP2 < 1 || clonemonTrocaP2 > 3) {
            							System.out.println("\nEscolha invalida! Digite novamente:");
            							clonemonTrocaP2 = escolhaClonemon.nextInt();
            							}
            								while(player2.monstroEquipe[clonemonTrocaP2-1].EstaVivo() == false) {
            									System.out.println("\nEsse CLONEMON ja foi derrotado! Escolha outro: ");
            									clonemonTrocaP2 = escolhaClonemon.nextInt();
            								}
            							
            						}while(clonemonTrocaP2 < 1 || clonemonTrocaP2 > 3);
            						
            							switch (clonemonTrocaP2) {
            								
            								case 1:
            									System.out.println("\nVoce escolheu " + player2.monstroEquipe[0].getNome() + " para a troca!");
            									clonemonBatalhaP2 = clonemonTrocaP2;
            									break;
            										
            								case 2:
            									System.out.println("\nVoce escolheu " + player2.monstroEquipe[1].getNome() + " para a troca!");
            									clonemonBatalhaP2 = clonemonTrocaP2;
            									break;
            										
            								case 3:
            									System.out.println("\nVoce escolheu " + player2.monstroEquipe[2].getNome() + " para a troca!");
            									clonemonBatalhaP2 = clonemonTrocaP2;
            									break;
            		
            							}clonemonTrocaP2 = 4;
                                	
                                }
                    		}
					}else {
                    	if(player1.monstroEquipe[clonemonBatalha-1].EstaVivo() == true) {
                    		if(player2.monstroEquipe[clonemonBatalhaP2-1].EstaVivo() == true) {
                    	player2.monstroEquipe[clonemonBatalhaP2-1].setVida(player2.monstroEquipe[clonemonBatalhaP2-1].SofrerDano(player1.monstroEquipe[clonemonBatalha-1].AtacarNormal(),
    	                        player2.monstroEquipe[clonemonBatalhaP2-1].getVida(), player1.monstroEquipe[clonemonBatalha-1].getTipo(), player2.monstroEquipe[clonemonBatalhaP2-1].getTipo()));
    	                        if(player1.monstroEquipe[clonemonBatalha-1].SuperEfetivo(player1.monstroEquipe[clonemonBatalha-1].getTipo(), player2.monstroEquipe[clonemonBatalhaP2-1].getTipo()) == true) {
    	                        	System.out.println("\nO ataque " + player1.monstroEquipe[clonemonBatalha-1].getAtaque().getNome() + " de " + player1.monstroEquipe[clonemonBatalha-1].getNome() + " eh SUPER EFETIVO em " + player2.monstroEquipe[clonemonBatalhaP2-1].getNome() + " e ele ficou com " + player2.monstroEquipe[clonemonBatalhaP2-1].getVida() + " de vida!");
    	                        }else if(player1.monstroEquipe[clonemonBatalha-1].PoucoEfetivo(player1.monstroEquipe[clonemonBatalha-1].getTipo(), player2.monstroEquipe[clonemonBatalhaP2-1].getTipo()) == true) {
    	                        	System.out.println("\nO ataque " + player1.monstroEquipe[clonemonBatalha-1].getAtaque().getNome() + " de " + player1.monstroEquipe[clonemonBatalha-1].getNome() + " eh POUCO EFETIVO em " + player2.monstroEquipe[clonemonBatalhaP2-1].getNome() + " e ele ficou com " + player2.monstroEquipe[clonemonBatalhaP2-1].getVida() + " de vida!");
    	                        }else System.out.println("\n " + player2.monstroEquipe[clonemonBatalhaP2-1].getNome() + " ficou com " + player2.monstroEquipe[clonemonBatalhaP2-1].getVida() + " de vida!");
                    		}else {
                    			if(player2.TemMonstros() == true) {
                                	System.out.println("\nSeu CLONEMON " + player2.monstroEquipe[clonemonBatalhaP2-1].getNome() + " esta FORA DE COMBATE!!");
                            		System.out.println("\nEscolha outro CLONEMON da sua equipe para substituilo:");
            						System.out.println("\n1- " + player2.monstroEquipe[0].getNome() + "   2- " + player2.monstroEquipe[1].getNome() + "   3- " + player2.monstroEquipe[2].getNome());
            						clonemonTrocaP2 = escolhaClonemon.nextInt();
            						do {
            							if(clonemonTrocaP2 < 1 || clonemonTrocaP2 > 3) {
            							System.out.println("\nEscolha invalida! Digite novamente:");
            							clonemonTrocaP2 = escolhaClonemon.nextInt();
            							}
            								while(player2.monstroEquipe[clonemonTrocaP2-1].EstaVivo() == false) {
            									System.out.println("\nEsse CLONEMON ja foi derrotado! Escolha outro: ");
            									clonemonTrocaP2 = escolhaClonemon.nextInt();
            								}
            							
            						}while(clonemonTrocaP2 < 1 || clonemonTrocaP2 > 3);
            						
            							switch (clonemonTrocaP2) {
            								
            								case 1:
            									System.out.println("\nVoce escolheu " + player2.monstroEquipe[0].getNome() + " para a troca!");
            									clonemonBatalhaP2 = clonemonTrocaP2;
            									break;
            										
            								case 2:
            									System.out.println("\nVoce escolheu " + player2.monstroEquipe[1].getNome() + " para a troca!");
            									clonemonBatalhaP2 = clonemonTrocaP2;
            									break;
            										
            								case 3:
            									System.out.println("\nVoce escolheu " + player2.monstroEquipe[2].getNome() + " para a troca!");
            									clonemonBatalhaP2 = clonemonTrocaP2;
            									break;
            		
            							}clonemonTrocaP2 = 4;
                                	
                                }
                    		}
                    		}else {
                    			if(player1.TemMonstros() == true) {
                                	System.out.println("\nSeu CLONEMON " + player1.monstroEquipe[clonemonBatalha-1].getNome() + " esta FORA DE COMBATE!!");
                            		System.out.println("\nEscolha outro CLONEMON da sua equipe para substituilo:");
            						System.out.println("\n1- " + player1.monstroEquipe[0].getNome() + "   2- " + player1.monstroEquipe[1].getNome() + "   3- " + player1.monstroEquipe[2].getNome());
            						clonemonTroca = escolhaClonemon.nextInt();
            						do {
            							if(clonemonTroca < 1 || clonemonTroca > 3) {
            							System.out.println("\nEscolha invalida! Digite novamente:");
            							clonemonTroca = escolhaClonemon.nextInt();
            							}
            								while(player1.monstroEquipe[clonemonTroca-1].EstaVivo() == false) {
            									System.out.println("\nEsse CLONEMON ja foi derrotado! Escolha outro: ");
            									clonemonTroca = escolhaClonemon.nextInt();
            								}
            							
            						}while(clonemonTroca < 1 || clonemonTroca > 3);
            						
            							switch (clonemonTroca) {
            								
            								case 1:
            									System.out.println("\nVoce escolheu " + player1.monstroEquipe[0].getNome() + " para a troca!");
            									clonemonBatalha = clonemonTroca;
            									break;
            										
            								case 2:
            									System.out.println("\nVoce escolheu " + player1.monstroEquipe[1].getNome() + " para a troca!");
            									clonemonBatalha = clonemonTroca;
            									break;
            										
            								case 3:
            									System.out.println("\nVoce escolheu " + player1.monstroEquipe[2].getNome() + " para a troca!");
            									clonemonBatalha = clonemonTroca;
            									break;
            		
            							}clonemonTroca = 4;
                                }
                	}
                    }
					if(player1.monstroEquipe[clonemonBatalha-1].EstaVivo() == false) {
						if(player1.TemMonstros() == true) {
                    	System.out.println("\nSeu CLONEMON " + player1.monstroEquipe[clonemonBatalha-1].getNome() + " esta FORA DE COMBATE!!");
                		System.out.println("\nEscolha outro CLONEMON da sua equipe para substituilo:");
						System.out.println("\n1- " + player1.monstroEquipe[0].getNome() + "   2- " + player1.monstroEquipe[1].getNome() + "   3- " + player1.monstroEquipe[2].getNome());
						clonemonTroca = escolhaClonemon.nextInt();
						do {
							if(clonemonTroca < 1 || clonemonTroca > 3) {
							System.out.println("\nEscolha invalida! Digite novamente:");
							clonemonTroca = escolhaClonemon.nextInt();
							}
								while(player1.monstroEquipe[clonemonTroca-1].EstaVivo() == false) {
									System.out.println("\nEsse CLONEMON ja foi derrotado! Escolha outro: ");
									clonemonTroca = escolhaClonemon.nextInt();
								}
							
						}while(clonemonTroca < 1 || clonemonTroca > 3);
						
							switch (clonemonTroca) {
								
								case 1:
									System.out.println("\nVoce escolheu " + player1.monstroEquipe[0].getNome() + " para a troca!");
									clonemonBatalha = clonemonTroca;
									break;
										
								case 2:
									System.out.println("\nVoce escolheu " + player1.monstroEquipe[1].getNome() + " para a troca!");
									clonemonBatalha = clonemonTroca;
									break;
										
								case 3:
									System.out.println("\nVoce escolheu " + player1.monstroEquipe[2].getNome() + " para a troca!");
									clonemonBatalha = clonemonTroca;
									break;
		
							}clonemonTroca = 4;
                    }
				}
                    if(player2.monstroEquipe[clonemonBatalhaP2-1].EstaVivo() == false) {
                    	if(player2.TemMonstros() == true) {
                    	System.out.println("\nSeu CLONEMON " + player2.monstroEquipe[clonemonBatalhaP2-1].getNome() + " esta FORA DE COMBATE!!");
                		System.out.println("\nEscolha outro CLONEMON da sua equipe para substituilo:");
						System.out.println("\n1- " + player2.monstroEquipe[0].getNome() + "   2- " + player2.monstroEquipe[1].getNome() + "   3- " + player2.monstroEquipe[2].getNome());
						clonemonTrocaP2 = escolhaClonemon.nextInt();
						do {
							if(clonemonTrocaP2 < 1 || clonemonTrocaP2 > 3) {
							System.out.println("\nEscolha invalida! Digite novamente:");
							clonemonTrocaP2 = escolhaClonemon.nextInt();
							}
								while(player2.monstroEquipe[clonemonTrocaP2-1].EstaVivo() == false) {
									System.out.println("\nEsse CLONEMON ja foi derrotado! Escolha outro: ");
									clonemonTrocaP2 = escolhaClonemon.nextInt();
								}
							
						}while(clonemonTrocaP2 < 1 || clonemonTrocaP2 > 3);
						
							switch (clonemonTrocaP2) {
								
								case 1:
									System.out.println("\nVoce escolheu " + player2.monstroEquipe[0].getNome() + " para a troca!");
									clonemonBatalhaP2 = clonemonTrocaP2;
									break;
										
								case 2:
									System.out.println("\nVoce escolheu " + player2.monstroEquipe[1].getNome() + " para a troca!");
									clonemonBatalhaP2 = clonemonTrocaP2;
									break;
										
								case 3:
									System.out.println("\nVoce escolheu " + player2.monstroEquipe[2].getNome() + " para a troca!");
									clonemonBatalhaP2 = clonemonTrocaP2;
									break;
		
							}clonemonTrocaP2 = 4;
                    	
                    }
                    }    	
					
				}
				if(player1.TemMonstros() == false) {
					System.out.println("\n\n\nPARABENS TREINADOR 2, VOCE VENCEU A BATALHA!!!");
				} else if(player2.TemMonstros() == false) {
					System.out.println("\n\n\nPARABENS TREINADOR 1, VOCE VENCEU A BATALHA!!!");
				}
			}
				
		}
			
	

}
