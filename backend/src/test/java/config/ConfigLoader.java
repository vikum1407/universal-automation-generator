package config;

import com.fasterxml.jackson.databind.ObjectMapper;

import java.io.File;
import java.io.IOException;

public class ConfigLoader {

    private static final ObjectMapper mapper = new ObjectMapper();

    public static Config load(String env) {
        try {
            File file = new File("config/" + env + ".json");
            return mapper.readValue(file, Config.class);
        } catch (IOException e) {
            throw new RuntimeException("Failed to load environment config: " + env, e);
        }
    }
}
