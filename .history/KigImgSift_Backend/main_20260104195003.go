package main

import (
	"fmt"
	"io"
	"net/http"
	"os"
	"path/filepath"
	"strings"

	"github.com/gin-contrib/cors"
	"github.com/gin-gonic/gin"
	"github.com/spf13/viper"
)

const (
	defaultPort = ":12346"
)

// Category represents a classification category
type Category struct {
	ID       string `json:"id" yaml:"id"`
	Name     string `json:"name" yaml:"name"`
	Path     string `json:"path" yaml:"path"`
	Shortcut string `json:"shortcut" yaml:"shortcut"`
}

// Config represents the application configuration
type Config struct {
	SourceDir   string     `json:"sourceDir" yaml:"sourceDir"`
	Categories  []Category `json:"categories" yaml:"categories"`
	SkipShortcut string    `json:"skipShortcut" yaml:"skipShortcut"`
}

// MoveRequest represents the request payload for moving files
type MoveRequest struct {
	Filename   string `json:"filename"`
	CategoryID string `json:"categoryId"`
}

// MoveResponse represents the response for move operations
type MoveResponse struct {
	Success bool   `json:"success"`
	Message string `json:"message"`
}

// UndoRequest represents the request payload for undo operations
type UndoRequest struct {
	Filename string `json:"filename"`
	FromPath string `json:"fromPath"`
	ToPath   string `json:"toPath"`
}

// UndoResponse represents the response for undo operations
type UndoResponse struct {
	Success bool   `json:"success"`
	Message string `json:"message"`
}

//	@title			KigImgSift API
//	@version		1.0
//	@description	A powerful image classification tool
//	@host			localhost:12346
//	@BasePath		/api
func main() {
	// Initialize configuration
	initConfig()

	// Create output directories if they don't exist
	createOutputDirs()

	r := gin.Default()

	// Enable CORS for frontend communication
	r.Use(cors.Default())

	// Swagger documentation
	r.GET("/swagger/*any", ginSwagger.WrapHandler(swaggerFiles.Handler))

	// API routes
	v1 := r.Group("/api")
	{
		// Configuration endpoints
		v1.GET("/config", getConfig)
		v1.POST("/config", updateConfig)

		// File operations
		v1.GET("/files/list", getImages)
		v1.GET("/files/image", getImage)

		// Actions
		v1.POST("/action/move", moveImage)
		v1.POST("/action/undo", undoImage)
	}

	port := viper.GetString("port")
	if port == "" {
		port = defaultPort
	}

	fmt.Printf("KigImgSift Backend running on http://localhost%s\n", port)
	fmt.Printf("Swagger documentation available at http://localhost%s/swagger/index.html\n", port)
	r.Run(port)
}

// initConfig initializes the configuration system
func initConfig() {
	viper.SetConfigName("config")
	viper.SetConfigType("yaml")
	viper.AddConfigPath(".")
	viper.AddConfigPath("./config")

	// Set defaults
	viper.SetDefault("port", defaultPort)
	viper.SetDefault("sourceDir", "../source_images")
	viper.SetDefault("categories", []Category{
		{ID: "frontal", Name: "正脸", Path: "../output/frontal", Shortcut: "1"},
		{ID: "side", Name: "侧脸", Path: "../output/side", Shortcut: "2"},
	})
	viper.SetDefault("skipShortcut", " ")

	// Read config
	if err := viper.ReadInConfig(); err != nil {
		if _, ok := err.(viper.ConfigFileNotFoundError); ok {
			fmt.Println("Config file not found, using defaults")
			// Create default config file
			saveConfig()
		} else {
			fmt.Printf("Error reading config file: %v\n", err)
		}
	}
}

// saveConfig saves the current configuration to file
func saveConfig() {
	if err := viper.WriteConfigAs("config.yaml"); err != nil {
		fmt.Printf("Warning: Failed to save config: %v\n", err)
	}
}

// createOutputDirs creates the necessary output directories
func createOutputDirs() {
	categories := viper.Get("categories").([]Category)
	for _, category := range categories {
		if err := os.MkdirAll(category.Path, 0755); err != nil {
			fmt.Printf("Warning: Failed to create directory %s: %v\n", category.Path, err)
		}
	}
}

// getImages scans the source directory and returns a list of image files
//	@Summary		List images
//	@Description	Get list of image files in the source directory
//	@Tags			files
//	@Accept			json
//	@Produce		json
//	@Param			dir	query	string	false	"Directory to scan (optional, uses config default)"
//	@Success		200	{object}	map[string]interface{}
//	@Router			/files/list [get]
func getImages(c *gin.Context) {
	dir := c.Query("dir")
	if dir == "" {
		dir = viper.GetString("sourceDir")
	}

	files, err := scanImageFiles(dir)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"images": files})
}

// scanImageFiles scans the directory for image files
func scanImageFiles(dir string) ([]string, error) {
	images := make([]string, 0) // Initialize with empty slice instead of nil

	files, err := os.ReadDir(dir)
	if err != nil {
		if os.IsNotExist(err) {
			return images, nil // Return empty list if directory doesn't exist
		}
		return nil, err
	}

	for _, file := range files {
		if !file.IsDir() {
			ext := strings.ToLower(filepath.Ext(file.Name()))
			if ext == ".jpg" || ext == ".jpeg" || ext == ".png" || ext == ".webp" {
				images = append(images, file.Name())
			}
		}
	}

	return images, nil
}

// getImage serves an image file by path
func getImage(c *gin.Context) {
	path := c.Query("path")
	if path == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "path parameter is required"})
		return
	}

	fullPath := filepath.Join(sourceDir, path)

	// Check if file exists
	if _, err := os.Stat(fullPath); os.IsNotExist(err) {
		c.JSON(http.StatusNotFound, gin.H{"error": "Image not found"})
		return
	}

	// Open and serve the file
	file, err := os.Open(fullPath)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to open image"})
		return
	}
	defer file.Close()

	// Get file info for content type detection
	stat, err := file.Stat()
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to get file info"})
		return
	}

	// Set appropriate content type based on file extension
	ext := strings.ToLower(filepath.Ext(path))
	contentType := "application/octet-stream"
	switch ext {
	case ".jpg", ".jpeg":
		contentType = "image/jpeg"
	case ".png":
		contentType = "image/png"
	case ".webp":
		contentType = "image/webp"
	}

	c.Header("Content-Type", contentType)
	c.Header("Content-Length", fmt.Sprintf("%d", stat.Size()))
	io.Copy(c.Writer, file)
}

// getConfig returns the current configuration
//	@Summary		Get configuration
//	@Description	Get the current application configuration
//	@Tags			config
//	@Accept			json
//	@Produce		json
//	@Success		200	{object}	Config
//	@Router			/config [get]
func getConfig(c *gin.Context) {
	config := Config{
		SourceDir:    viper.GetString("sourceDir"),
		Categories:   viper.Get("categories").([]Category),
		SkipShortcut: viper.GetString("skipShortcut"),
	}
	c.JSON(http.StatusOK, config)
}

// updateConfig updates the configuration
//	@Summary		Update configuration
//	@Description	Update the application configuration
//	@Tags			config
//	@Accept			json
//	@Produce		json
//	@Param			config	body	Config	true	"Configuration"
//	@Success		200
//	@Router			/config [post]
func updateConfig(c *gin.Context) {
	var config Config
	if err := c.ShouldBindJSON(&config); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// Update viper config
	viper.Set("sourceDir", config.SourceDir)
	viper.Set("categories", config.Categories)
	viper.Set("skipShortcut", config.SkipShortcut)

	// Save to file
	saveConfig()

	// Recreate output directories
	createOutputDirs()

	c.JSON(http.StatusOK, gin.H{"message": "Configuration updated successfully"})
}

// moveFile handles file moving with cross-filesystem support
func moveFile(sourcePath, targetPath string) error {
	// First try os.Rename (works within same filesystem)
	err := os.Rename(sourcePath, targetPath)
	if err == nil {
		return nil
	}

	// If rename failed, try copy + delete (cross-filesystem)
	sourceFile, err := os.Open(sourcePath)
	if err != nil {
		return fmt.Errorf("failed to open source file: %v", err)
	}
	defer sourceFile.Close()

	targetFile, err := os.Create(targetPath)
	if err != nil {
		return fmt.Errorf("failed to create target file: %v", err)
	}
	defer targetFile.Close()

	_, err = io.Copy(targetFile, sourceFile)
	if err != nil {
		return fmt.Errorf("failed to copy file: %v", err)
	}

	// Close files before removing
	sourceFile.Close()
	targetFile.Close()

	// Remove source file
	err = os.Remove(sourcePath)
	if err != nil {
		return fmt.Errorf("failed to remove source file after copy: %v", err)
	}

	return nil
}

// moveImage moves an image file to the specified category directory
//	@Summary		Move image
//	@Description	Move an image file to a specified category
//	@Tags			actions
//	@Accept			json
//	@Produce		json
//	@Param			request	body	MoveRequest	true	"Move request"
//	@Success		200	{object}	MoveResponse
//	@Router			/action/move [post]
func moveImage(c *gin.Context) {
	var req MoveRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, MoveResponse{
			Success: false,
			Message: "Invalid request payload",
		})
		return
	}

	// Find the category
	categories := viper.Get("categories").([]Category)
	var targetCategory *Category
	for _, category := range categories {
		if category.ID == req.CategoryID {
			targetCategory = &category
			break
		}
	}

	if targetCategory == nil {
		c.JSON(http.StatusBadRequest, MoveResponse{
			Success: false,
			Message: "Invalid category ID",
		})
		return
	}

	sourceDir := viper.GetString("sourceDir")
	sourcePath := filepath.Join(sourceDir, req.Filename)
	targetPath := filepath.Join(targetCategory.Path, req.Filename)

	// Check if source file exists
	if _, err := os.Stat(sourcePath); os.IsNotExist(err) {
		c.JSON(http.StatusNotFound, MoveResponse{
			Success: false,
			Message: "Source file not found",
		})
		return
	}

	// Ensure target directory exists
	targetDir := filepath.Dir(targetPath)
	if err := os.MkdirAll(targetDir, 0755); err != nil {
		c.JSON(http.StatusInternalServerError, MoveResponse{
			Success: false,
			Message: fmt.Sprintf("Failed to create target directory: %v", err),
		})
		return
	}

	// Handle file conflicts by creating unique names
	finalTargetPath := targetPath
	if _, err := os.Stat(targetPath); err == nil {
		// File exists, create a unique name
		ext := filepath.Ext(req.Filename)
		name := strings.TrimSuffix(req.Filename, ext)
		counter := 1
		for {
			newName := fmt.Sprintf("%s_%d%s", name, counter, ext)
			newPath := filepath.Join(targetDir, newName)
			if _, err := os.Stat(newPath); os.IsNotExist(err) {
				finalTargetPath = newPath
				break
			}
			counter++
			if counter > 1000 { // Prevent infinite loop
				c.JSON(http.StatusInternalServerError, MoveResponse{
					Success: false,
					Message: "Too many conflicting files",
				})
				return
			}
		}
	}

	// Move the file
	err := moveFile(sourcePath, finalTargetPath)
	if err != nil {
		c.JSON(http.StatusInternalServerError, MoveResponse{
			Success: false,
			Message: fmt.Sprintf("Failed to move file: %v", err),
		})
		return
	}

	c.JSON(http.StatusOK, MoveResponse{
		Success: true,
		Message: fmt.Sprintf("File moved to %s", targetCategory.Name),
	})
}

// undoImage undoes the last move operation
//	@Summary		Undo move
//	@Description	Undo the last move operation by moving file back
//	@Tags			actions
//	@Accept			json
//	@Produce		json
//	@Param			request	body	UndoRequest	true	"Undo request"
//	@Success		200	{object}	UndoResponse
//	@Router			/action/undo [post]
func undoImage(c *gin.Context) {
	var req UndoRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, UndoResponse{
			Success: false,
			Message: "Invalid request payload",
		})
		return
	}

	// Check if target file exists
	if _, err := os.Stat(req.ToPath); os.IsNotExist(err) {
		c.JSON(http.StatusNotFound, UndoResponse{
			Success: false,
			Message: "Target file not found",
		})
		return
	}

	// Check if destination already exists
	if _, err := os.Stat(req.FromPath); err == nil {
		c.JSON(http.StatusConflict, UndoResponse{
			Success: false,
			Message: "Original file location already occupied",
		})
		return
	}

	// Move the file back
	err := os.Rename(req.ToPath, req.FromPath)
	if err != nil {
		c.JSON(http.StatusInternalServerError, UndoResponse{
			Success: false,
			Message: fmt.Sprintf("Failed to undo move: %v", err),
		})
		return
	}

	c.JSON(http.StatusOK, UndoResponse{
		Success: true,
		Message: "Move operation undone successfully",
	})
}
