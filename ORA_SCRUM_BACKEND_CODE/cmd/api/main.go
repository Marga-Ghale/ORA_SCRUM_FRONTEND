package main

import (
	"log"
	"os"

	"github.com/Marga-Ghale/ORA_SCRUM_BACKEND/internal/api/handlers"
	"github.com/Marga-Ghale/ORA_SCRUM_BACKEND/internal/api/middleware"
	"github.com/Marga-Ghale/ORA_SCRUM_BACKEND/internal/config"
	"github.com/Marga-Ghale/ORA_SCRUM_BACKEND/internal/db"
	"github.com/Marga-Ghale/ORA_SCRUM_BACKEND/internal/repository"
	"github.com/Marga-Ghale/ORA_SCRUM_BACKEND/internal/service"
	"github.com/gin-contrib/cors"
	"github.com/gin-gonic/gin"
	"github.com/joho/godotenv"
)

func main() {
	// Load environment variables
	if err := godotenv.Load(); err != nil {
		log.Println("No .env file found, using environment variables")
	}

	// Load configuration
	cfg := config.Load()

	// Initialize database client
	client := db.NewClient()
	if err := client.Prisma.Connect(); err != nil {
		log.Fatalf("Failed to connect to database: %v", err)
	}
	defer func() {
		if err := client.Prisma.Disconnect(); err != nil {
			log.Printf("Failed to disconnect from database: %v", err)
		}
	}()

	// Initialize repositories
	repos := repository.NewRepositories(client)

	// Initialize services
	services := service.NewServices(repos, cfg)

	// Initialize handlers
	h := handlers.NewHandlers(services)

	// Setup Gin router
	if cfg.Environment == "production" {
		gin.SetMode(gin.ReleaseMode)
	}

	router := gin.Default()

	// CORS configuration
	router.Use(cors.New(cors.Config{
		AllowOrigins:     []string{"http://localhost:3000", "http://localhost:5173", "*"},
		AllowMethods:     []string{"GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"},
		AllowHeaders:     []string{"Origin", "Content-Type", "Accept", "Authorization"},
		ExposeHeaders:    []string{"Content-Length"},
		AllowCredentials: true,
	}))

	// Health check
	router.GET("/health", func(c *gin.Context) {
		c.JSON(200, gin.H{"status": "ok", "version": "1.0.0"})
	})

	// API routes
	api := router.Group("/api/v1")
	{
		// Auth routes (public)
		auth := api.Group("/auth")
		{
			auth.POST("/register", h.Auth.Register)
			auth.POST("/login", h.Auth.Login)
			auth.POST("/refresh", h.Auth.RefreshToken)
		}

		// Protected routes
		protected := api.Group("")
		protected.Use(middleware.AuthMiddleware(cfg.JWTSecret))
		{
			// User routes
			users := protected.Group("/users")
			{
				users.GET("/me", h.User.GetCurrentUser)
				users.PUT("/me", h.User.UpdateCurrentUser)
				users.GET("/:id", h.User.GetUser)
				users.GET("", h.User.ListUsers)
			}

			// Workspace routes
			workspaces := protected.Group("/workspaces")
			{
				workspaces.POST("", h.Workspace.Create)
				workspaces.GET("", h.Workspace.List)
				workspaces.GET("/:id", h.Workspace.Get)
				workspaces.PUT("/:id", h.Workspace.Update)
				workspaces.DELETE("/:id", h.Workspace.Delete)
				workspaces.POST("/:id/members", h.Workspace.AddMember)
				workspaces.DELETE("/:id/members/:userId", h.Workspace.RemoveMember)
				workspaces.PUT("/:id/members/:userId", h.Workspace.UpdateMemberRole)
			}

			// Space routes
			spaces := protected.Group("/spaces")
			{
				spaces.POST("", h.Space.Create)
				spaces.GET("", h.Space.List)
				spaces.GET("/:id", h.Space.Get)
				spaces.PUT("/:id", h.Space.Update)
				spaces.DELETE("/:id", h.Space.Delete)
			}

			// Project routes
			projects := protected.Group("/projects")
			{
				projects.POST("", h.Project.Create)
				projects.GET("", h.Project.List)
				projects.GET("/:id", h.Project.Get)
				projects.PUT("/:id", h.Project.Update)
				projects.DELETE("/:id", h.Project.Delete)
				projects.POST("/:id/members", h.Project.AddMember)
				projects.DELETE("/:id/members/:userId", h.Project.RemoveMember)
			}

			// Sprint routes
			sprints := protected.Group("/sprints")
			{
				sprints.POST("", h.Sprint.Create)
				sprints.GET("", h.Sprint.List)
				sprints.GET("/:id", h.Sprint.Get)
				sprints.PUT("/:id", h.Sprint.Update)
				sprints.DELETE("/:id", h.Sprint.Delete)
				sprints.POST("/:id/start", h.Sprint.Start)
				sprints.POST("/:id/complete", h.Sprint.Complete)
			}

			// Task routes
			tasks := protected.Group("/tasks")
			{
				tasks.POST("", h.Task.Create)
				tasks.GET("", h.Task.List)
				tasks.GET("/:id", h.Task.Get)
				tasks.PUT("/:id", h.Task.Update)
				tasks.DELETE("/:id", h.Task.Delete)
				tasks.PUT("/:id/status", h.Task.UpdateStatus)
				tasks.PUT("/:id/assignee", h.Task.UpdateAssignee)
				tasks.POST("/:id/reorder", h.Task.Reorder)
			}

			// Label routes
			labels := protected.Group("/labels")
			{
				labels.POST("", h.Label.Create)
				labels.GET("", h.Label.List)
				labels.PUT("/:id", h.Label.Update)
				labels.DELETE("/:id", h.Label.Delete)
			}

			// Comment routes
			comments := protected.Group("/comments")
			{
				comments.POST("", h.Comment.Create)
				comments.GET("", h.Comment.List)
				comments.PUT("/:id", h.Comment.Update)
				comments.DELETE("/:id", h.Comment.Delete)
			}

			// Attachment routes
			attachments := protected.Group("/attachments")
			{
				attachments.POST("", h.Attachment.Upload)
				attachments.GET("", h.Attachment.List)
				attachments.DELETE("/:id", h.Attachment.Delete)
			}
		}
	}

	// Start server
	port := os.Getenv("PORT")
	if port == "" {
		port = "8080"
	}

	log.Printf("Server starting on port %s", port)
	if err := router.Run(":" + port); err != nil {
		log.Fatalf("Failed to start server: %v", err)
	}
}
