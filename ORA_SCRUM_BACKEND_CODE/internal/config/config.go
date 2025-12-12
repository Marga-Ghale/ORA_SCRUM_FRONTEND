package config

import (
	"os"
	"strconv"
)

type Config struct {
	Environment     string
	DatabaseURL     string
	JWTSecret       string
	JWTExpiry       int // in hours
	RefreshExpiry   int // in days
	Port            string
	AllowedOrigins  []string
}

func Load() *Config {
	jwtExpiry, _ := strconv.Atoi(getEnv("JWT_EXPIRY", "24"))
	refreshExpiry, _ := strconv.Atoi(getEnv("REFRESH_EXPIRY", "7"))

	return &Config{
		Environment:    getEnv("ENVIRONMENT", "development"),
		DatabaseURL:    getEnv("DATABASE_URL", "postgresql://postgres:postgres@localhost:5432/ora_scrum?schema=public"),
		JWTSecret:      getEnv("JWT_SECRET", "your-super-secret-jwt-key-change-in-production"),
		JWTExpiry:      jwtExpiry,
		RefreshExpiry:  refreshExpiry,
		Port:           getEnv("PORT", "8080"),
		AllowedOrigins: []string{"http://localhost:3000", "http://localhost:5173"},
	}
}

func getEnv(key, defaultValue string) string {
	if value := os.Getenv(key); value != "" {
		return value
	}
	return defaultValue
}
