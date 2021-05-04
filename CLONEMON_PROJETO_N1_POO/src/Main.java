
public class Main {
	
	public static void main(String []args) {
		
        Ataques cuspe = new Ataques("Cuspe", Elementos.AGUA, 5);
        Ataques vapPressao = new Ataques("Vap de alta pressao", Elementos.AGUA, 10);
        Ataques pedrada = new Ataques("Pedrada", Elementos.ROCHA, 5);
        Ataques meteoro = new Ataques("Meteoro", Elementos.ROCHA, 10);
        Ataques molotov = new Ataques("Molotov", Elementos.FOGO, 5);
        Ataques fogoBabilonia = new Ataques("Fogo na Babilonia", Elementos.FOGO, 10);
        Ataques cuboGelo = new Ataques("Cubo de Gelo", Elementos.GELO, 5);
        Ataques ficaFrio = new Ataques("Fica frio ai", Elementos.GELO, 10);
        Ataques papel = new Ataques("Corte de papel A4", Elementos.GRAMA, 5);
        Ataques cartolinada = new Ataques("Cartolinada", Elementos.GRAMA, 10);
        Ataques volt = new Ataques("Volt", Elementos.RAIO, 5);
        Ataques bivolt = new Ataques("Bivolt", Elementos.RAIO, 10);
        
        Monstros Lindoya = new Monstros(1, "Lindoya", Elementos.AGUA, 0, 0, 0, 0, cuspe, vapPressao);      
        Monstros Coiso = new Monstros(2, "Coiso", Elementos.ROCHA, 0, 0, 0, 0, pedrada, meteoro);        
        Monstros Lucifer = new Monstros(3, "Lucifer", Elementos.FOGO, 0, 0, 0, 0, molotov, fogoBabilonia);
        Monstros Gelado = new Monstros(4, "Gelado", Elementos.GELO, 0, 0, 0, 0, cuboGelo, ficaFrio);
        Monstros Groot = new Monstros(5, "Groot", Elementos.GRAMA, 0, 0, 0, 0, papel, cartolinada);
        Monstros EletroPaulo = new Monstros(6, "EletroPaulo", Elementos.RAIO, 0, 0, 0, 0, volt, bivolt);
        
	}

}
