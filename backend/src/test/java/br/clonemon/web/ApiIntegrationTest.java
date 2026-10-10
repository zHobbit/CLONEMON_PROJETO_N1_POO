package br.clonemon.web;

import br.clonemon.TestcontainersConfiguration;
import com.jayway.jsonpath.JsonPath;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.context.annotation.Import;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.assertj.MockMvcTester;
import org.springframework.test.web.servlet.assertj.MvcTestResult;

import java.util.List;
import java.util.Map;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;

/** Fluxos da API de ponta a ponta: HTTP + seguranca + servicos + Postgres. */
@SpringBootTest
@AutoConfigureMockMvc
@Import(TestcontainersConfiguration.class)
class ApiIntegrationTest {

    @Autowired MockMvcTester mvc;

    private static String uniqueName() {
        return "u" + UUID.randomUUID().toString().replace("-", "").substring(0, 12);
    }

    private MvcTestResult post(String uri, String token, String body) {
        var req = mvc.post().uri(uri).contentType(MediaType.APPLICATION_JSON).content(body);
        if (token != null) req = req.header(HttpHeaders.AUTHORIZATION, "Bearer " + token);
        return req.exchange();
    }

    private MvcTestResult get(String uri, String token) {
        return mvc.get().uri(uri).header(HttpHeaders.AUTHORIZATION, "Bearer " + token).exchange();
    }

    private static <T> T read(MvcTestResult r, String path) {
        try {
            return JsonPath.read(r.getResponse().getContentAsString(), path);
        } catch (java.io.UnsupportedEncodingException e) {
            throw new IllegalStateException(e);
        }
    }

    private String register(String username) {
        MvcTestResult r = post("/api/auth/register", null, "{\"username\":\"%s\",\"password\":\"secret123\"}".formatted(username));
        assertThat(r).hasStatus(HttpStatus.CREATED);
        return read(r, "$.token");
    }

    private String trainerWithStarter(int speciesId) {
        String token = register(uniqueName());
        assertThat(post("/api/team/starter", token, "{\"speciesId\":" + speciesId + "}")).hasStatus(HttpStatus.CREATED);
        return token;
    }

    // --- Auth ---

    @Test
    void registerAndLogin() {
        String name = uniqueName();
        register(name);

        MvcTestResult login = post("/api/auth/login", null, "{\"username\":\"%s\",\"password\":\"secret123\"}".formatted(name));
        assertThat(login).hasStatusOk().bodyJson().extractingPath("$.username").isEqualTo(name);
    }

    @Test
    void duplicateUsernameIsConflict() {
        String name = uniqueName();
        register(name);
        assertThat(post("/api/auth/register", null, "{\"username\":\"%s\",\"password\":\"secret123\"}".formatted(name)))
                .hasStatus(HttpStatus.CONFLICT);
    }

    @Test
    void invalidRegistrationIsBadRequestProblem() {
        assertThat(post("/api/auth/register", null, "{\"username\":\"a b\",\"password\":\"123\"}"))
                .hasStatus(HttpStatus.BAD_REQUEST)
                .hasContentType(MediaType.APPLICATION_PROBLEM_JSON);
    }

    @Test
    void wrongPasswordIsUnauthorized() {
        String name = uniqueName();
        register(name);
        assertThat(post("/api/auth/login", null, "{\"username\":\"%s\",\"password\":\"nope1234\"}".formatted(name)))
                .hasStatus(HttpStatus.UNAUTHORIZED);
    }

    @Test
    void gamePageIsPublic() {
        // "/" encaminha para o index.html (o MockMvc nao segue o forward, entao conferimos as duas etapas).
        assertThat(mvc.get().uri("/").exchange()).hasStatusOk().hasForwardedUrl("index.html");
        MvcTestResult page = mvc.get().uri("/index.html").exchange();
        assertThat(page).hasStatusOk();
        assertThat(page).bodyText().contains("CLONEMON test page");
    }

    @Test
    void protectedEndpointsRequireToken() {
        assertThat(mvc.get().uri("/api/team")).hasStatus(HttpStatus.UNAUTHORIZED);
        assertThat(mvc.post().uri("/api/battles")).hasStatus(HttpStatus.UNAUTHORIZED);
        assertThat(get("/api/team", "not-a-jwt")).hasStatus(HttpStatus.UNAUTHORIZED);
    }

    // --- Species ---

    @Test
    void speciesArePublic() {
        MvcTestResult r = mvc.get().uri("/api/species").exchange();
        assertThat(r).hasStatusOk();
        List<String> names = read(r, "$[*].name");
        assertThat(names).containsExactly("Lindoya", "Coiso", "Lucifer", "Olaf", "Groot", "EletroPaulo",
                "Boto", "PaoDeAcucar", "Pimentinha", "Pinguim", "Abacaxi", "Gatonet");
        List<Object> moves = read(r, "$[0].moves");
        assertThat(moves).hasSize(4);
    }

    @Test
    void speciesMovesExposeLearnLevelAndEffect() {
        MvcTestResult r = mvc.get().uri("/api/species").exchange();
        List<Integer> levels = read(r, "$[2].moves[*].learnLevel");
        assertThat(levels).containsExactly(1, 1, 7, 12);
        Map<String, Object> churrasco = read(r, "$[2].moves[2]");
        assertThat(churrasco).containsEntry("name", "Churrasco grego").containsEntry("effect", "BURN")
                .containsEntry("effectChance", 30).containsEntry("effectStat", null).containsEntry("ppLeft", null);
        Map<String, Object> sangue = read(r, "$[2].moves[3]");
        assertThat(sangue).containsEntry("power", 0).containsEntry("effect", "RAISE")
                .containsEntry("effectStat", "ATK").containsEntry("effectStages", 2);
        assertThat((String) read(r, "$[0].moves[0].effect")).isEqualTo("NONE");
    }

    // --- Team ---

    @Test
    void starterFlow() {
        String token = register(uniqueName());
        MvcTestResult starter = post("/api/team/starter", token, "{\"speciesId\":3}");
        assertThat(starter).hasStatus(HttpStatus.CREATED);
        assertThat(starter).bodyJson().extractingPath("$.level").isEqualTo(5);
        assertThat(starter).bodyJson().extractingPath("$.teamSlot").isEqualTo(0);

        assertThat(post("/api/team/starter", token, "{\"speciesId\":1}")).hasStatus(HttpStatus.CONFLICT);
        assertThat(post("/api/team/starter", register(uniqueName()), "{\"speciesId\":99}")).hasStatus(HttpStatus.NOT_FOUND);

        MvcTestResult roster = get("/api/team", token);
        assertThat(roster).hasStatusOk();
        List<String> team = read(roster, "$.team[*].species");
        assertThat(team).containsExactly("Lucifer");
    }

    @Test
    void invalidTeamUpdates() {
        String token = trainerWithStarter(1);
        String other = trainerWithStarter(2);
        Integer foreignId = read(get("/api/team", other), "$.team[0].id");

        var empty = mvc.put().uri("/api/team").header(HttpHeaders.AUTHORIZATION, "Bearer " + token)
                .contentType(MediaType.APPLICATION_JSON).content("{\"monsterIds\":[]}");
        assertThat(empty).hasStatus(HttpStatus.BAD_REQUEST);

        var foreign = mvc.put().uri("/api/team").header(HttpHeaders.AUTHORIZATION, "Bearer " + token)
                .contentType(MediaType.APPLICATION_JSON).content("{\"monsterIds\":[" + foreignId + "]}");
        assertThat(foreign).hasStatus(HttpStatus.NOT_FOUND);
    }

    // --- Battle ---

    @Test
    void fullBattleFlowSavesProgress() {
        String token = trainerWithStarter(1);
        String intruder = trainerWithStarter(2);

        MvcTestResult started = post("/api/battles", token, "");
        assertThat(started).hasStatus(HttpStatus.CREATED);
        Integer battleId = read(started, "$.id");
        String base = "/api/battles/" + battleId;

        assertThat(post("/api/battles", token, "")).hasStatus(HttpStatus.CONFLICT);
        assertThat(get("/api/battles/active", token)).bodyJson().extractingPath("$.id").isEqualTo(battleId);
        assertThat(get(base, intruder)).hasStatus(HttpStatus.NOT_FOUND);
        assertThat(post(base + "/turns", token, "{\"action\":\"MOVE\"}")).hasStatus(HttpStatus.BAD_REQUEST);
        assertThat(post(base + "/turns", token, "{\"action\":\"DANCE\"}")).hasStatus(HttpStatus.BAD_REQUEST);

        MvcTestResult turn = null;
        String status = "AWAITING_ACTION";
        for (int i = 0; i < 60 && status.equals("AWAITING_ACTION"); i++) {
            String body = nextAction(turn == null ? started : turn, turn == null ? "$" : "$.battle");
            turn = post(base + "/turns", token, body);
            assertThat(turn).hasStatusOk();
            List<String> events = read(turn, "$.events[*].text");
            assertThat(events).isNotEmpty();
            status = read(turn, "$.battle.status");
        }
        assertThat(status).isIn("PLAYER_WON", "PLAYER_LOST", "FLED");
        assertThat(post(base + "/turns", token, "{\"action\":\"RUN\"}")).hasStatus(HttpStatus.CONFLICT);
        assertThat(get("/api/battles/active", token)).hasStatus(HttpStatus.NOT_FOUND);

        // O progresso da batalha esta salvo no time.
        MvcTestResult roster = get("/api/team", token);
        Integer hpInBattle = read(turn, "$.battle.playerTeam[0].currentHp");
        Integer levelInBattle = read(turn, "$.battle.playerTeam[0].level");
        assertThat(roster).bodyJson().extractingPath("$.team[0].currentHp").isEqualTo(hpInBattle);
        assertThat(roster).bodyJson().extractingPath("$.team[0].level").isEqualTo(levelInBattle);
        List<Object> team = read(roster, "$.team");
        assertThat(team).hasSize(status.equals("PLAYER_WON") ? 2 : 1);

        // Centro Clonemon.
        MvcTestResult healed = post("/api/team/heal", token, "");
        Integer maxHp = read(healed, "$.team[0].maxHp");
        assertThat(healed).bodyJson().extractingPath("$.team[0].currentHp").isEqualTo(maxHp);
    }

    @Test
    void battleExposesStatusOfEachCombatantAndEvent() {
        String token = trainerWithStarter(3);
        MvcTestResult started = post("/api/battles", token, "");
        assertThat(started).hasStatus(HttpStatus.CREATED);
        assertThat(started).bodyJson().extractingPath("$.enemy.status").isEqualTo("NONE");
        assertThat(started).bodyJson().extractingPath("$.playerTeam[0].status").isEqualTo("NONE");
        List<String> effects = read(started, "$.playerTeam[0].moves[*].effect");
        assertThat(effects).containsExactly("NONE", "NONE");

        Integer battleId = read(started, "$.id");
        String turns = "/api/battles/" + battleId + "/turns";
        assertThat(post(turns, token, "{\"action\":\"MOVE\",\"moveIndex\":2}"))
                .as("o inicial no nivel 5 ainda nao aprendeu o terceiro golpe").hasStatus(HttpStatus.BAD_REQUEST);

        MvcTestResult turn = post(turns, token, "{\"action\":\"MOVE\",\"moveIndex\":0}");
        assertThat(turn).hasStatusOk();
        List<String> playerStatuses = read(turn, "$.events[*].playerStatus");
        List<String> enemyStatuses = read(turn, "$.events[*].enemyStatus");
        assertThat(playerStatuses).isNotEmpty().allMatch(s -> List.of("NONE", "BURN", "FREEZE", "PARALYSIS", "SLEEP").contains(s));
        assertThat(enemyStatuses).hasSameSizeAs(playerStatuses);
        assertThat((String) read(turn, "$.battle.enemy.status")).isNotNull();
    }

    /** Usa o primeiro golpe com PP do monstro ativo; foge se nao houver nenhum. */
    private static String nextAction(MvcTestResult r, String battlePath) {
        Integer active = read(r, battlePath + ".playerActive");
        List<Map<String, Object>> moves = read(r, battlePath + ".playerTeam[" + active + "].moves");
        for (int i = 0; i < moves.size(); i++)
            if (((Number) moves.get(i).get("ppLeft")).intValue() > 0) return "{\"action\":\"MOVE\",\"moveIndex\":" + i + "}";
        return "{\"action\":\"RUN\"}";
    }
}
