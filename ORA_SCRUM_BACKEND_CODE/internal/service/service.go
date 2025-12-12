package service

import (
	"context"
	"errors"
	"fmt"
	"time"

	"github.com/Marga-Ghale/ORA_SCRUM_BACKEND/internal/config"
	"github.com/Marga-Ghale/ORA_SCRUM_BACKEND/internal/db"
	"github.com/Marga-Ghale/ORA_SCRUM_BACKEND/internal/models"
	"github.com/Marga-Ghale/ORA_SCRUM_BACKEND/internal/repository"
	"github.com/golang-jwt/jwt/v5"
	"golang.org/x/crypto/bcrypt"
)

var (
	ErrUserExists      = errors.New("user already exists")
	ErrInvalidCreds    = errors.New("invalid credentials")
	ErrNotFound        = errors.New("resource not found")
	ErrUnauthorized    = errors.New("unauthorized")
	ErrInvalidToken    = errors.New("invalid token")
)

type Services struct {
	Auth       AuthService
	User       UserService
	Workspace  WorkspaceService
	Space      SpaceService
	Project    ProjectService
	Sprint     SprintService
	Task       TaskService
	Label      LabelService
	Comment    CommentService
	Attachment AttachmentService
}

func NewServices(repos *repository.Repositories, cfg *config.Config) *Services {
	return &Services{
		Auth:       NewAuthService(repos.User, cfg),
		User:       NewUserService(repos.User),
		Workspace:  NewWorkspaceService(repos.Workspace, repos.User),
		Space:      NewSpaceService(repos.Space),
		Project:    NewProjectService(repos.Project),
		Sprint:     NewSprintService(repos.Sprint),
		Task:       NewTaskService(repos.Task, repos.Project),
		Label:      NewLabelService(repos.Label),
		Comment:    NewCommentService(repos.Comment),
		Attachment: NewAttachmentService(repos.Attachment),
	}
}

// ==================== AUTH SERVICE ====================

type AuthService interface {
	Register(ctx context.Context, req *models.RegisterRequest) (*models.AuthResponse, error)
	Login(ctx context.Context, req *models.LoginRequest) (*models.AuthResponse, error)
	RefreshToken(ctx context.Context, refreshToken string) (*models.AuthResponse, error)
	ValidateToken(tokenString string) (*jwt.MapClaims, error)
}

type authService struct {
	userRepo repository.UserRepository
	cfg      *config.Config
}

func NewAuthService(userRepo repository.UserRepository, cfg *config.Config) AuthService {
	return &authService{userRepo: userRepo, cfg: cfg}
}

func (s *authService) Register(ctx context.Context, req *models.RegisterRequest) (*models.AuthResponse, error) {
	// Check if user exists
	existing, _ := s.userRepo.FindByEmail(ctx, req.Email)
	if existing != nil {
		return nil, ErrUserExists
	}

	// Hash password
	hashedPassword, err := bcrypt.GenerateFromPassword([]byte(req.Password), bcrypt.DefaultCost)
	if err != nil {
		return nil, err
	}

	// Create user
	user, err := s.userRepo.Create(ctx, req.Email, string(hashedPassword), req.Name)
	if err != nil {
		return nil, err
	}

	// Generate tokens
	accessToken, err := s.generateAccessToken(user.ID)
	if err != nil {
		return nil, err
	}

	refreshToken, err := s.generateRefreshToken(user.ID)
	if err != nil {
		return nil, err
	}

	return &models.AuthResponse{
		User:         userToResponse(user),
		AccessToken:  accessToken,
		RefreshToken: refreshToken,
	}, nil
}

func (s *authService) Login(ctx context.Context, req *models.LoginRequest) (*models.AuthResponse, error) {
	user, err := s.userRepo.FindByEmail(ctx, req.Email)
	if err != nil {
		return nil, ErrInvalidCreds
	}

	if err := bcrypt.CompareHashAndPassword([]byte(user.Password), []byte(req.Password)); err != nil {
		return nil, ErrInvalidCreds
	}

	// Generate tokens
	accessToken, err := s.generateAccessToken(user.ID)
	if err != nil {
		return nil, err
	}

	refreshToken, err := s.generateRefreshToken(user.ID)
	if err != nil {
		return nil, err
	}

	return &models.AuthResponse{
		User:         userToResponse(user),
		AccessToken:  accessToken,
		RefreshToken: refreshToken,
	}, nil
}

func (s *authService) RefreshToken(ctx context.Context, refreshToken string) (*models.AuthResponse, error) {
	claims, err := s.ValidateToken(refreshToken)
	if err != nil {
		return nil, ErrInvalidToken
	}

	userID := (*claims)["sub"].(string)
	user, err := s.userRepo.FindByID(ctx, userID)
	if err != nil {
		return nil, ErrNotFound
	}

	// Generate new tokens
	accessToken, err := s.generateAccessToken(user.ID)
	if err != nil {
		return nil, err
	}

	newRefreshToken, err := s.generateRefreshToken(user.ID)
	if err != nil {
		return nil, err
	}

	return &models.AuthResponse{
		User:         userToResponse(user),
		AccessToken:  accessToken,
		RefreshToken: newRefreshToken,
	}, nil
}

func (s *authService) ValidateToken(tokenString string) (*jwt.MapClaims, error) {
	token, err := jwt.Parse(tokenString, func(token *jwt.Token) (interface{}, error) {
		if _, ok := token.Method.(*jwt.SigningMethodHMAC); !ok {
			return nil, fmt.Errorf("unexpected signing method: %v", token.Header["alg"])
		}
		return []byte(s.cfg.JWTSecret), nil
	})

	if err != nil {
		return nil, err
	}

	if claims, ok := token.Claims.(jwt.MapClaims); ok && token.Valid {
		return &claims, nil
	}

	return nil, ErrInvalidToken
}

func (s *authService) generateAccessToken(userID string) (string, error) {
	claims := jwt.MapClaims{
		"sub":  userID,
		"type": "access",
		"exp":  time.Now().Add(time.Hour * time.Duration(s.cfg.JWTExpiry)).Unix(),
		"iat":  time.Now().Unix(),
	}

	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
	return token.SignedString([]byte(s.cfg.JWTSecret))
}

func (s *authService) generateRefreshToken(userID string) (string, error) {
	claims := jwt.MapClaims{
		"sub":  userID,
		"type": "refresh",
		"exp":  time.Now().Add(time.Hour * 24 * time.Duration(s.cfg.RefreshExpiry)).Unix(),
		"iat":  time.Now().Unix(),
	}

	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
	return token.SignedString([]byte(s.cfg.JWTSecret))
}

// ==================== USER SERVICE ====================

type UserService interface {
	GetByID(ctx context.Context, id string) (*models.UserResponse, error)
	Update(ctx context.Context, id string, req *models.UpdateUserRequest) (*models.UserResponse, error)
	List(ctx context.Context, params models.ListParams) (*models.PaginatedResponse, error)
}

type userService struct {
	repo repository.UserRepository
}

func NewUserService(repo repository.UserRepository) UserService {
	return &userService{repo: repo}
}

func (s *userService) GetByID(ctx context.Context, id string) (*models.UserResponse, error) {
	user, err := s.repo.FindByID(ctx, id)
	if err != nil {
		return nil, ErrNotFound
	}
	resp := userToResponse(user)
	return &resp, nil
}

func (s *userService) Update(ctx context.Context, id string, req *models.UpdateUserRequest) (*models.UserResponse, error) {
	user, err := s.repo.Update(ctx, id, req)
	if err != nil {
		return nil, err
	}
	resp := userToResponse(user)
	return &resp, nil
}

func (s *userService) List(ctx context.Context, params models.ListParams) (*models.PaginatedResponse, error) {
	users, total, err := s.repo.List(ctx, params)
	if err != nil {
		return nil, err
	}

	responses := make([]models.UserResponse, len(users))
	for i, u := range users {
		responses[i] = userToResponse(&u)
	}

	return &models.PaginatedResponse{
		Data:       responses,
		Total:      total,
		Page:       params.Page,
		PageSize:   params.PageSize,
		TotalPages: (total + params.PageSize - 1) / params.PageSize,
	}, nil
}

// ==================== WORKSPACE SERVICE ====================

type WorkspaceService interface {
	Create(ctx context.Context, req *models.CreateWorkspaceRequest, userID string) (*models.WorkspaceResponse, error)
	GetByID(ctx context.Context, id string) (*models.WorkspaceResponse, error)
	ListByUser(ctx context.Context, userID string) ([]models.WorkspaceResponse, error)
	Update(ctx context.Context, id string, req *models.UpdateWorkspaceRequest) (*models.WorkspaceResponse, error)
	Delete(ctx context.Context, id string) error
	AddMember(ctx context.Context, workspaceID string, req *models.AddMemberRequest) error
	RemoveMember(ctx context.Context, workspaceID, userID string) error
	UpdateMemberRole(ctx context.Context, workspaceID, userID string, req *models.UpdateMemberRoleRequest) error
}

type workspaceService struct {
	repo     repository.WorkspaceRepository
	userRepo repository.UserRepository
}

func NewWorkspaceService(repo repository.WorkspaceRepository, userRepo repository.UserRepository) WorkspaceService {
	return &workspaceService{repo: repo, userRepo: userRepo}
}

func (s *workspaceService) Create(ctx context.Context, req *models.CreateWorkspaceRequest, userID string) (*models.WorkspaceResponse, error) {
	ws, err := s.repo.Create(ctx, req.Name, req.Logo)
	if err != nil {
		return nil, err
	}

	// Add creator as admin
	if err := s.repo.AddMember(ctx, ws.ID, userID, "ADMIN"); err != nil {
		return nil, err
	}

	return s.GetByID(ctx, ws.ID)
}

func (s *workspaceService) GetByID(ctx context.Context, id string) (*models.WorkspaceResponse, error) {
	ws, err := s.repo.FindByID(ctx, id)
	if err != nil {
		return nil, ErrNotFound
	}
	return workspaceToResponse(ws), nil
}

func (s *workspaceService) ListByUser(ctx context.Context, userID string) ([]models.WorkspaceResponse, error) {
	workspaces, err := s.repo.FindByUserID(ctx, userID)
	if err != nil {
		return nil, err
	}

	responses := make([]models.WorkspaceResponse, len(workspaces))
	for i, ws := range workspaces {
		responses[i] = *workspaceToResponse(&ws)
	}
	return responses, nil
}

func (s *workspaceService) Update(ctx context.Context, id string, req *models.UpdateWorkspaceRequest) (*models.WorkspaceResponse, error) {
	ws, err := s.repo.Update(ctx, id, req)
	if err != nil {
		return nil, err
	}
	return workspaceToResponse(ws), nil
}

func (s *workspaceService) Delete(ctx context.Context, id string) error {
	return s.repo.Delete(ctx, id)
}

func (s *workspaceService) AddMember(ctx context.Context, workspaceID string, req *models.AddMemberRequest) error {
	user, err := s.userRepo.FindByEmail(ctx, req.Email)
	if err != nil {
		return ErrNotFound
	}
	return s.repo.AddMember(ctx, workspaceID, user.ID, req.Role)
}

func (s *workspaceService) RemoveMember(ctx context.Context, workspaceID, userID string) error {
	return s.repo.RemoveMember(ctx, workspaceID, userID)
}

func (s *workspaceService) UpdateMemberRole(ctx context.Context, workspaceID, userID string, req *models.UpdateMemberRoleRequest) error {
	return s.repo.UpdateMemberRole(ctx, workspaceID, userID, req.Role)
}

// ==================== SPACE SERVICE ====================

type SpaceService interface {
	Create(ctx context.Context, req *models.CreateSpaceRequest) (*models.SpaceResponse, error)
	GetByID(ctx context.Context, id string) (*models.SpaceResponse, error)
	ListByWorkspace(ctx context.Context, workspaceID string) ([]models.SpaceResponse, error)
	Update(ctx context.Context, id string, req *models.UpdateSpaceRequest) (*models.SpaceResponse, error)
	Delete(ctx context.Context, id string) error
}

type spaceService struct {
	repo repository.SpaceRepository
}

func NewSpaceService(repo repository.SpaceRepository) SpaceService {
	return &spaceService{repo: repo}
}

func (s *spaceService) Create(ctx context.Context, req *models.CreateSpaceRequest) (*models.SpaceResponse, error) {
	space, err := s.repo.Create(ctx, req)
	if err != nil {
		return nil, err
	}
	return spaceToResponse(space), nil
}

func (s *spaceService) GetByID(ctx context.Context, id string) (*models.SpaceResponse, error) {
	space, err := s.repo.FindByID(ctx, id)
	if err != nil {
		return nil, ErrNotFound
	}
	return spaceToResponse(space), nil
}

func (s *spaceService) ListByWorkspace(ctx context.Context, workspaceID string) ([]models.SpaceResponse, error) {
	spaces, err := s.repo.FindByWorkspaceID(ctx, workspaceID)
	if err != nil {
		return nil, err
	}

	responses := make([]models.SpaceResponse, len(spaces))
	for i, sp := range spaces {
		responses[i] = *spaceToResponse(&sp)
	}
	return responses, nil
}

func (s *spaceService) Update(ctx context.Context, id string, req *models.UpdateSpaceRequest) (*models.SpaceResponse, error) {
	space, err := s.repo.Update(ctx, id, req)
	if err != nil {
		return nil, err
	}
	return spaceToResponse(space), nil
}

func (s *spaceService) Delete(ctx context.Context, id string) error {
	return s.repo.Delete(ctx, id)
}

// ==================== PROJECT SERVICE ====================

type ProjectService interface {
	Create(ctx context.Context, req *models.CreateProjectRequest, leadID string) (*models.ProjectResponse, error)
	GetByID(ctx context.Context, id string) (*models.ProjectResponse, error)
	ListBySpace(ctx context.Context, spaceID string) ([]models.ProjectResponse, error)
	Update(ctx context.Context, id string, req *models.UpdateProjectRequest) (*models.ProjectResponse, error)
	Delete(ctx context.Context, id string) error
	AddMember(ctx context.Context, projectID string, req *models.AddMemberRequest, userRepo repository.UserRepository) error
	RemoveMember(ctx context.Context, projectID, userID string) error
}

type projectService struct {
	repo repository.ProjectRepository
}

func NewProjectService(repo repository.ProjectRepository) ProjectService {
	return &projectService{repo: repo}
}

func (s *projectService) Create(ctx context.Context, req *models.CreateProjectRequest, leadID string) (*models.ProjectResponse, error) {
	project, err := s.repo.Create(ctx, req, leadID)
	if err != nil {
		return nil, err
	}

	// Add lead as member
	if err := s.repo.AddMember(ctx, project.ID, leadID, "ADMIN"); err != nil {
		return nil, err
	}

	return s.GetByID(ctx, project.ID)
}

func (s *projectService) GetByID(ctx context.Context, id string) (*models.ProjectResponse, error) {
	project, err := s.repo.FindByID(ctx, id)
	if err != nil {
		return nil, ErrNotFound
	}
	return projectToResponse(project), nil
}

func (s *projectService) ListBySpace(ctx context.Context, spaceID string) ([]models.ProjectResponse, error) {
	projects, err := s.repo.FindBySpaceID(ctx, spaceID)
	if err != nil {
		return nil, err
	}

	responses := make([]models.ProjectResponse, len(projects))
	for i, p := range projects {
		responses[i] = *projectToResponse(&p)
	}
	return responses, nil
}

func (s *projectService) Update(ctx context.Context, id string, req *models.UpdateProjectRequest) (*models.ProjectResponse, error) {
	project, err := s.repo.Update(ctx, id, req)
	if err != nil {
		return nil, err
	}
	return projectToResponse(project), nil
}

func (s *projectService) Delete(ctx context.Context, id string) error {
	return s.repo.Delete(ctx, id)
}

func (s *projectService) AddMember(ctx context.Context, projectID string, req *models.AddMemberRequest, userRepo repository.UserRepository) error {
	user, err := userRepo.FindByEmail(ctx, req.Email)
	if err != nil {
		return ErrNotFound
	}
	return s.repo.AddMember(ctx, projectID, user.ID, req.Role)
}

func (s *projectService) RemoveMember(ctx context.Context, projectID, userID string) error {
	return s.repo.RemoveMember(ctx, projectID, userID)
}

// ==================== SPRINT SERVICE ====================

type SprintService interface {
	Create(ctx context.Context, req *models.CreateSprintRequest) (*models.SprintResponse, error)
	GetByID(ctx context.Context, id string) (*models.SprintResponse, error)
	ListByProject(ctx context.Context, projectID string) ([]models.SprintResponse, error)
	Update(ctx context.Context, id string, req *models.UpdateSprintRequest) (*models.SprintResponse, error)
	Delete(ctx context.Context, id string) error
	Start(ctx context.Context, id string) (*models.SprintResponse, error)
	Complete(ctx context.Context, id string) (*models.SprintResponse, error)
}

type sprintService struct {
	repo repository.SprintRepository
}

func NewSprintService(repo repository.SprintRepository) SprintService {
	return &sprintService{repo: repo}
}

func (s *sprintService) Create(ctx context.Context, req *models.CreateSprintRequest) (*models.SprintResponse, error) {
	sprint, err := s.repo.Create(ctx, req)
	if err != nil {
		return nil, err
	}
	return sprintToResponse(sprint), nil
}

func (s *sprintService) GetByID(ctx context.Context, id string) (*models.SprintResponse, error) {
	sprint, err := s.repo.FindByID(ctx, id)
	if err != nil {
		return nil, ErrNotFound
	}
	return sprintToResponse(sprint), nil
}

func (s *sprintService) ListByProject(ctx context.Context, projectID string) ([]models.SprintResponse, error) {
	sprints, err := s.repo.FindByProjectID(ctx, projectID)
	if err != nil {
		return nil, err
	}

	responses := make([]models.SprintResponse, len(sprints))
	for i, sp := range sprints {
		responses[i] = *sprintToResponse(&sp)
	}
	return responses, nil
}

func (s *sprintService) Update(ctx context.Context, id string, req *models.UpdateSprintRequest) (*models.SprintResponse, error) {
	sprint, err := s.repo.Update(ctx, id, req)
	if err != nil {
		return nil, err
	}
	return sprintToResponse(sprint), nil
}

func (s *sprintService) Delete(ctx context.Context, id string) error {
	return s.repo.Delete(ctx, id)
}

func (s *sprintService) Start(ctx context.Context, id string) (*models.SprintResponse, error) {
	sprint, err := s.repo.UpdateStatus(ctx, id, "ACTIVE")
	if err != nil {
		return nil, err
	}
	return sprintToResponse(sprint), nil
}

func (s *sprintService) Complete(ctx context.Context, id string) (*models.SprintResponse, error) {
	sprint, err := s.repo.UpdateStatus(ctx, id, "COMPLETED")
	if err != nil {
		return nil, err
	}
	return sprintToResponse(sprint), nil
}

// ==================== TASK SERVICE ====================

type TaskService interface {
	Create(ctx context.Context, req *models.CreateTaskRequest, reporterID string) (*models.TaskResponse, error)
	GetByID(ctx context.Context, id string) (*models.TaskResponse, error)
	ListByProject(ctx context.Context, projectID string, params models.ListParams) (*models.PaginatedResponse, error)
	Update(ctx context.Context, id string, req *models.UpdateTaskRequest) (*models.TaskResponse, error)
	UpdateStatus(ctx context.Context, id string, req *models.UpdateTaskStatusRequest) (*models.TaskResponse, error)
	UpdateAssignee(ctx context.Context, id string, req *models.UpdateTaskAssigneeRequest) (*models.TaskResponse, error)
	Reorder(ctx context.Context, req *models.ReorderTasksRequest) error
	Delete(ctx context.Context, id string) error
}

type taskService struct {
	repo        repository.TaskRepository
	projectRepo repository.ProjectRepository
}

func NewTaskService(repo repository.TaskRepository, projectRepo repository.ProjectRepository) TaskService {
	return &taskService{repo: repo, projectRepo: projectRepo}
}

func (s *taskService) Create(ctx context.Context, req *models.CreateTaskRequest, reporterID string) (*models.TaskResponse, error) {
	// Get project to generate task key
	project, err := s.projectRepo.FindByID(ctx, req.ProjectID)
	if err != nil {
		return nil, ErrNotFound
	}

	nextNum, _ := s.projectRepo.GetNextTaskNumber(ctx, req.ProjectID)
	key := fmt.Sprintf("%s-%d", project.Key, nextNum)

	task, err := s.repo.Create(ctx, req, key, reporterID)
	if err != nil {
		return nil, err
	}

	return s.GetByID(ctx, task.ID)
}

func (s *taskService) GetByID(ctx context.Context, id string) (*models.TaskResponse, error) {
	task, err := s.repo.FindByID(ctx, id)
	if err != nil {
		return nil, ErrNotFound
	}
	return taskToResponse(task), nil
}

func (s *taskService) ListByProject(ctx context.Context, projectID string, params models.ListParams) (*models.PaginatedResponse, error) {
	tasks, total, err := s.repo.FindByProjectID(ctx, projectID, params)
	if err != nil {
		return nil, err
	}

	responses := make([]models.TaskResponse, len(tasks))
	for i, t := range tasks {
		responses[i] = *taskToResponse(&t)
	}

	return &models.PaginatedResponse{
		Data:       responses,
		Total:      total,
		Page:       params.Page,
		PageSize:   params.PageSize,
		TotalPages: (total + params.PageSize - 1) / params.PageSize,
	}, nil
}

func (s *taskService) Update(ctx context.Context, id string, req *models.UpdateTaskRequest) (*models.TaskResponse, error) {
	task, err := s.repo.Update(ctx, id, req)
	if err != nil {
		return nil, err
	}
	return taskToResponse(task), nil
}

func (s *taskService) UpdateStatus(ctx context.Context, id string, req *models.UpdateTaskStatusRequest) (*models.TaskResponse, error) {
	task, err := s.repo.UpdateStatus(ctx, id, req.Status)
	if err != nil {
		return nil, err
	}
	return taskToResponse(task), nil
}

func (s *taskService) UpdateAssignee(ctx context.Context, id string, req *models.UpdateTaskAssigneeRequest) (*models.TaskResponse, error) {
	task, err := s.repo.UpdateAssignee(ctx, id, req.AssigneeID)
	if err != nil {
		return nil, err
	}
	return taskToResponse(task), nil
}

func (s *taskService) Reorder(ctx context.Context, req *models.ReorderTasksRequest) error {
	for i, taskID := range req.TaskIDs {
		if err := s.repo.UpdateOrder(ctx, taskID, i); err != nil {
			return err
		}
	}
	return nil
}

func (s *taskService) Delete(ctx context.Context, id string) error {
	return s.repo.Delete(ctx, id)
}

// ==================== LABEL SERVICE ====================

type LabelService interface {
	Create(ctx context.Context, req *models.CreateLabelRequest) (*models.LabelResponse, error)
	ListByProject(ctx context.Context, projectID string) ([]models.LabelResponse, error)
	Update(ctx context.Context, id string, req *models.UpdateLabelRequest) (*models.LabelResponse, error)
	Delete(ctx context.Context, id string) error
}

type labelService struct {
	repo repository.LabelRepository
}

func NewLabelService(repo repository.LabelRepository) LabelService {
	return &labelService{repo: repo}
}

func (s *labelService) Create(ctx context.Context, req *models.CreateLabelRequest) (*models.LabelResponse, error) {
	label, err := s.repo.Create(ctx, req)
	if err != nil {
		return nil, err
	}
	return labelToResponse(label), nil
}

func (s *labelService) ListByProject(ctx context.Context, projectID string) ([]models.LabelResponse, error) {
	labels, err := s.repo.FindByProjectID(ctx, projectID)
	if err != nil {
		return nil, err
	}

	responses := make([]models.LabelResponse, len(labels))
	for i, l := range labels {
		responses[i] = *labelToResponse(&l)
	}
	return responses, nil
}

func (s *labelService) Update(ctx context.Context, id string, req *models.UpdateLabelRequest) (*models.LabelResponse, error) {
	label, err := s.repo.Update(ctx, id, req)
	if err != nil {
		return nil, err
	}
	return labelToResponse(label), nil
}

func (s *labelService) Delete(ctx context.Context, id string) error {
	return s.repo.Delete(ctx, id)
}

// ==================== COMMENT SERVICE ====================

type CommentService interface {
	Create(ctx context.Context, req *models.CreateCommentRequest, authorID string) (*models.CommentResponse, error)
	ListByTask(ctx context.Context, taskID string) ([]models.CommentResponse, error)
	Update(ctx context.Context, id string, req *models.UpdateCommentRequest) (*models.CommentResponse, error)
	Delete(ctx context.Context, id string) error
}

type commentService struct {
	repo repository.CommentRepository
}

func NewCommentService(repo repository.CommentRepository) CommentService {
	return &commentService{repo: repo}
}

func (s *commentService) Create(ctx context.Context, req *models.CreateCommentRequest, authorID string) (*models.CommentResponse, error) {
	comment, err := s.repo.Create(ctx, req, authorID)
	if err != nil {
		return nil, err
	}
	return commentToResponse(comment), nil
}

func (s *commentService) ListByTask(ctx context.Context, taskID string) ([]models.CommentResponse, error) {
	comments, err := s.repo.FindByTaskID(ctx, taskID)
	if err != nil {
		return nil, err
	}

	responses := make([]models.CommentResponse, len(comments))
	for i, c := range comments {
		responses[i] = *commentToResponse(&c)
	}
	return responses, nil
}

func (s *commentService) Update(ctx context.Context, id string, req *models.UpdateCommentRequest) (*models.CommentResponse, error) {
	comment, err := s.repo.Update(ctx, id, req.Content)
	if err != nil {
		return nil, err
	}
	return commentToResponse(comment), nil
}

func (s *commentService) Delete(ctx context.Context, id string) error {
	return s.repo.Delete(ctx, id)
}

// ==================== ATTACHMENT SERVICE ====================

type AttachmentService interface {
	Create(ctx context.Context, name, url, mimeType string, size int, taskID, uploaderID string) (*models.AttachmentResponse, error)
	ListByTask(ctx context.Context, taskID string) ([]models.AttachmentResponse, error)
	Delete(ctx context.Context, id string) error
}

type attachmentService struct {
	repo repository.AttachmentRepository
}

func NewAttachmentService(repo repository.AttachmentRepository) AttachmentService {
	return &attachmentService{repo: repo}
}

func (s *attachmentService) Create(ctx context.Context, name, url, mimeType string, size int, taskID, uploaderID string) (*models.AttachmentResponse, error) {
	attachment, err := s.repo.Create(ctx, name, url, mimeType, size, taskID, uploaderID)
	if err != nil {
		return nil, err
	}
	return attachmentToResponse(attachment), nil
}

func (s *attachmentService) ListByTask(ctx context.Context, taskID string) ([]models.AttachmentResponse, error) {
	attachments, err := s.repo.FindByTaskID(ctx, taskID)
	if err != nil {
		return nil, err
	}

	responses := make([]models.AttachmentResponse, len(attachments))
	for i, a := range attachments {
		responses[i] = *attachmentToResponse(&a)
	}
	return responses, nil
}

func (s *attachmentService) Delete(ctx context.Context, id string) error {
	return s.repo.Delete(ctx, id)
}

// ==================== HELPERS ====================

func userToResponse(u *db.UserModel) models.UserResponse {
	var avatar *string
	if a, ok := u.Avatar(); ok {
		avatar = &a
	}
	return models.UserResponse{
		ID:        u.ID,
		Email:     u.Email,
		Name:      u.Name,
		Avatar:    avatar,
		Status:    string(u.Status),
		CreatedAt: u.CreatedAt,
	}
}

func workspaceToResponse(w *db.WorkspaceModel) *models.WorkspaceResponse {
	var logo *string
	if l, ok := w.Logo(); ok {
		logo = &l
	}
	return &models.WorkspaceResponse{
		ID:        w.ID,
		Name:      w.Name,
		Logo:      logo,
		CreatedAt: w.CreatedAt,
	}
}

func spaceToResponse(s *db.SpaceModel) *models.SpaceResponse {
	var icon *string
	if i, ok := s.Icon(); ok {
		icon = &i
	}
	return &models.SpaceResponse{
		ID:        s.ID,
		Name:      s.Name,
		Icon:      icon,
		Color:     s.Color,
		CreatedAt: s.CreatedAt,
	}
}

func projectToResponse(p *db.ProjectModel) *models.ProjectResponse {
	var desc, icon *string
	if d, ok := p.Description(); ok {
		desc = &d
	}
	if i, ok := p.Icon(); ok {
		icon = &i
	}
	return &models.ProjectResponse{
		ID:          p.ID,
		Name:        p.Name,
		Key:         p.Key,
		Description: desc,
		Icon:        icon,
		Color:       p.Color,
		CreatedAt:   p.CreatedAt,
	}
}

func sprintToResponse(s *db.SprintModel) *models.SprintResponse {
	var goal *string
	if g, ok := s.Goal(); ok {
		goal = &g
	}
	return &models.SprintResponse{
		ID:        s.ID,
		Name:      s.Name,
		Goal:      goal,
		StartDate: s.StartDate,
		EndDate:   s.EndDate,
		Status:    string(s.Status),
		CreatedAt: s.CreatedAt,
	}
}

func taskToResponse(t *db.TaskModel) *models.TaskResponse {
	var desc *string
	var storyPoints *int
	var dueDate, startDate *time.Time

	if d, ok := t.Description(); ok {
		desc = &d
	}
	if sp, ok := t.StoryPoints(); ok {
		storyPoints = &sp
	}
	if dd, ok := t.DueDate(); ok {
		dueDate = &dd
	}
	if sd, ok := t.StartDate(); ok {
		startDate = &sd
	}

	return &models.TaskResponse{
		ID:          t.ID,
		Key:         t.Key,
		Title:       t.Title,
		Description: desc,
		Status:      string(t.Status),
		Priority:    string(t.Priority),
		Type:        string(t.Type),
		StoryPoints: storyPoints,
		DueDate:     dueDate,
		StartDate:   startDate,
		Order:       t.Order,
		CreatedAt:   t.CreatedAt,
		UpdatedAt:   t.UpdatedAt,
	}
}

func labelToResponse(l *db.LabelModel) *models.LabelResponse {
	return &models.LabelResponse{
		ID:    l.ID,
		Name:  l.Name,
		Color: l.Color,
	}
}

func commentToResponse(c *db.CommentModel) *models.CommentResponse {
	return &models.CommentResponse{
		ID:        c.ID,
		Content:   c.Content,
		CreatedAt: c.CreatedAt,
		UpdatedAt: c.UpdatedAt,
	}
}

func attachmentToResponse(a *db.AttachmentModel) *models.AttachmentResponse {
	return &models.AttachmentResponse{
		ID:         a.ID,
		Name:       a.Name,
		URL:        a.URL,
		Type:       a.Type,
		Size:       a.Size,
		UploadedAt: a.UploadedAt,
	}
}
