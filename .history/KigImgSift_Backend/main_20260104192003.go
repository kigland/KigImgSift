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
)

const (
	sourceDir = "./source_images"
	outputDir = "./output"
	port      = ":12345"
)

// ImageInfo represents an image file
type ImageInfo struct {
	Filename string `json:"filename"`
}

// MoveRequest represents the request payload for moving files
type MoveRequest struct {
	Filename  string `json:"filename"`
	TargetType string `json:"targetType"`
}

// MoveResponse represents the response for move operations
type MoveResponse struct {
	Success bool   `json:"success"`
	Message string `json:"message"`
}

func main() {
	// Create output directories if they don't exist
	createOutputDirs()

	r := gin.Default()

	// Enable CORS for frontend communication
	r.Use(cors.Default())

	// API routes
	r.GET("/api/images", getImages)
	r.GET("/api/image", getImage)
	r.POST("/api/move", moveImage)

	fmt.Printf("KigImgSift Backend running on http://localhost%s\n", port)
	r.Run(port)
}

// createOutputDirs creates the necessary output directories
func createOutputDirs() {
	dirs := []string{
		filepath.Join(outputDir, "frontal"),
		filepath.Join(outputDir, "side"),
	}

	for _, dir := range dirs {
		if err := os.MkdirAll(dir, 0755); err != nil {
			fmt.Printf("Warning: Failed to create directory %s: %v\n", dir, err)
		}
	}
}

// getImages scans the source directory and returns a list of image files
func getImages(c *gin.Context) {
	files, err := scanImageFiles(sourceDir)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"images": files})
}

// scanImageFiles scans the directory for image files
func scanImageFiles(dir string) ([]string, error) {
	var images []string

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

// moveImage moves an image file to the specified category directory
func moveImage(c *gin.Context) {
	var req MoveRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, MoveResponse{
			Success: false,
			Message: "Invalid request payload",
		})
		return
	}

	// Validate target type
	if req.TargetType != "frontal" && req.TargetType != "side" {
		c.JSON(http.StatusBadRequest, MoveResponse{
			Success: false,
			Message: "Invalid target type. Must be 'frontal' or 'side'",
		})
		return
	}

	sourcePath := filepath.Join(sourceDir, req.Filename)
	targetDir := filepath.Join(outputDir, req.TargetType)
	targetPath := filepath.Join(targetDir, req.Filename)

	// Check if source file exists
	if _, err := os.Stat(sourcePath); os.IsNotExist(err) {
		c.JSON(http.StatusNotFound, MoveResponse{
			Success: false,
			Message: "Source file not found",
		})
		return
	}

	// Move the file
	err := os.Rename(sourcePath, targetPath)
	if err != nil {
		c.JSON(http.StatusInternalServerError, MoveResponse{
			Success: false,
			Message: fmt.Sprintf("Failed to move file: %v", err),
		})
		return
	}

	c.JSON(http.StatusOK, MoveResponse{
		Success: true,
		Message: fmt.Sprintf("File moved to %s", req.TargetType),
	})
}
