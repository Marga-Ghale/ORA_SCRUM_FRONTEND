package models

import "time"

// Request/Response DTOs

// ==================== AUTH ====================

type RegisterRequest struct {
	Email    string `json:"email" binding:"required,email"`
	Password string `json:"password" binding:"required,min=6"`
	Name     string `json:"name" binding:"required"`
}

type LoginRequest struct {
	Email    string `json:"email" binding:"required,email"`
	Password string `json:"password" binding:"required"`
}

type AuthResponse struct {
	User         UserResponse `json:"user"`
	AccessToken  string       `json:"accessToken"`
	RefreshToken string       `json:"refreshToken"`
}

type RefreshTokenRequest struct {
	RefreshToken string `json:"refreshToken" binding:"required"`
}

// ==================== USER ====================

type UserResponse struct {
	ID        string     `json:"id"`
	Email     string     `json:"email"`
	Name      string     `json:"name"`
	Avatar    *string    `json:"avatar,omitempty"`
	Status    string     `json:"status"`
	Role      *string    `json:"role,omitempty"` // Context-dependent (workspace/project role)
	CreatedAt time.Time  `json:"createdAt"`
}

type UpdateUserRequest struct {
	Name   *string `json:"name,omitempty"`
	Avatar *string `json:"avatar,omitempty"`
	Status *string `json:"status,omitempty"`
}

// ==================== WORKSPACE ====================

type CreateWorkspaceRequest struct {
	Name string  `json:"name" binding:"required"`
	Logo *string `json:"logo,omitempty"`
}

type UpdateWorkspaceRequest struct {
	Name *string `json:"name,omitempty"`
	Logo *string `json:"logo,omitempty"`
}

type WorkspaceResponse struct {
	ID        string            `json:"id"`
	Name      string            `json:"name"`
	Logo      *string           `json:"logo,omitempty"`
	Members   []UserResponse    `json:"members,omitempty"`
	Spaces    []SpaceResponse   `json:"spaces,omitempty"`
	CreatedAt time.Time         `json:"createdAt"`
}

type AddMemberRequest struct {
	Email string `json:"email" binding:"required,email"`
	Role  string `json:"role" binding:"required,oneof=ADMIN MEMBER VIEWER"`
}

type UpdateMemberRoleRequest struct {
	Role string `json:"role" binding:"required,oneof=ADMIN MEMBER VIEWER"`
}

// ==================== SPACE ====================

type CreateSpaceRequest struct {
	Name        string  `json:"name" binding:"required"`
	Icon        *string `json:"icon,omitempty"`
	Color       *string `json:"color,omitempty"`
	WorkspaceID string  `json:"workspaceId" binding:"required"`
}

type UpdateSpaceRequest struct {
	Name  *string `json:"name,omitempty"`
	Icon  *string `json:"icon,omitempty"`
	Color *string `json:"color,omitempty"`
}

type SpaceResponse struct {
	ID        string            `json:"id"`
	Name      string            `json:"name"`
	Icon      *string           `json:"icon,omitempty"`
	Color     string            `json:"color"`
	Projects  []ProjectResponse `json:"projects,omitempty"`
	CreatedAt time.Time         `json:"createdAt"`
}

// ==================== PROJECT ====================

type CreateProjectRequest struct {
	Name        string  `json:"name" binding:"required"`
	Key         string  `json:"key" binding:"required,max=10"`
	Description *string `json:"description,omitempty"`
	Icon        *string `json:"icon,omitempty"`
	Color       *string `json:"color,omitempty"`
	SpaceID     string  `json:"spaceId" binding:"required"`
}

type UpdateProjectRequest struct {
	Name        *string `json:"name,omitempty"`
	Key         *string `json:"key,omitempty"`
	Description *string `json:"description,omitempty"`
	Icon        *string `json:"icon,omitempty"`
	Color       *string `json:"color,omitempty"`
}

type ProjectResponse struct {
	ID          string           `json:"id"`
	Name        string           `json:"name"`
	Key         string           `json:"key"`
	Description *string          `json:"description,omitempty"`
	Icon        *string          `json:"icon,omitempty"`
	Color       string           `json:"color"`
	Lead        *UserResponse    `json:"lead,omitempty"`
	Members     []UserResponse   `json:"members,omitempty"`
	Sprints     []SprintResponse `json:"sprints,omitempty"`
	Backlog     []TaskResponse   `json:"backlog,omitempty"`
	CreatedAt   time.Time        `json:"createdAt"`
}

// ==================== SPRINT ====================

type CreateSprintRequest struct {
	Name      string    `json:"name" binding:"required"`
	Goal      *string   `json:"goal,omitempty"`
	StartDate time.Time `json:"startDate" binding:"required"`
	EndDate   time.Time `json:"endDate" binding:"required"`
	ProjectID string    `json:"projectId" binding:"required"`
}

type UpdateSprintRequest struct {
	Name      *string    `json:"name,omitempty"`
	Goal      *string    `json:"goal,omitempty"`
	StartDate *time.Time `json:"startDate,omitempty"`
	EndDate   *time.Time `json:"endDate,omitempty"`
}

type SprintResponse struct {
	ID        string         `json:"id"`
	Name      string         `json:"name"`
	Goal      *string        `json:"goal,omitempty"`
	StartDate time.Time      `json:"startDate"`
	EndDate   time.Time      `json:"endDate"`
	Status    string         `json:"status"`
	Tasks     []TaskResponse `json:"tasks,omitempty"`
	CreatedAt time.Time      `json:"createdAt"`
}

// ==================== TASK ====================

type CreateTaskRequest struct {
	Title       string   `json:"title" binding:"required"`
	Description *string  `json:"description,omitempty"`
	Status      *string  `json:"status,omitempty"`
	Priority    *string  `json:"priority,omitempty"`
	Type        *string  `json:"type,omitempty"`
	StoryPoints *int     `json:"storyPoints,omitempty"`
	DueDate     *string  `json:"dueDate,omitempty"`
	ProjectID   string   `json:"projectId" binding:"required"`
	SprintID    *string  `json:"sprintId,omitempty"`
	AssigneeID  *string  `json:"assigneeId,omitempty"`
	ParentID    *string  `json:"parentId,omitempty"`
	LabelIDs    []string `json:"labelIds,omitempty"`
}

type UpdateTaskRequest struct {
	Title       *string  `json:"title,omitempty"`
	Description *string  `json:"description,omitempty"`
	Status      *string  `json:"status,omitempty"`
	Priority    *string  `json:"priority,omitempty"`
	Type        *string  `json:"type,omitempty"`
	StoryPoints *int     `json:"storyPoints,omitempty"`
	DueDate     *string  `json:"dueDate,omitempty"`
	SprintID    *string  `json:"sprintId,omitempty"`
	AssigneeID  *string  `json:"assigneeId,omitempty"`
	LabelIDs    []string `json:"labelIds,omitempty"`
}

type UpdateTaskStatusRequest struct {
	Status string `json:"status" binding:"required,oneof=BACKLOG TODO IN_PROGRESS IN_REVIEW DONE CANCELLED"`
}

type UpdateTaskAssigneeRequest struct {
	AssigneeID *string `json:"assigneeId"`
}

type ReorderTasksRequest struct {
	TaskIDs []string `json:"taskIds" binding:"required"`
}

type TaskResponse struct {
	ID          string            `json:"id"`
	Key         string            `json:"key"`
	Title       string            `json:"title"`
	Description *string           `json:"description,omitempty"`
	Status      string            `json:"status"`
	Priority    string            `json:"priority"`
	Type        string            `json:"type"`
	StoryPoints *int              `json:"storyPoints,omitempty"`
	DueDate     *time.Time        `json:"dueDate,omitempty"`
	StartDate   *time.Time        `json:"startDate,omitempty"`
	Order       int               `json:"order"`
	Assignee    *UserResponse     `json:"assignee,omitempty"`
	Reporter    *UserResponse     `json:"reporter,omitempty"`
	Labels      []LabelResponse   `json:"labels,omitempty"`
	Subtasks    []TaskResponse    `json:"subtasks,omitempty"`
	Comments    []CommentResponse `json:"comments,omitempty"`
	CreatedAt   time.Time         `json:"createdAt"`
	UpdatedAt   time.Time         `json:"updatedAt"`
}

// ==================== LABEL ====================

type CreateLabelRequest struct {
	Name      string  `json:"name" binding:"required"`
	Color     *string `json:"color,omitempty"`
	ProjectID string  `json:"projectId" binding:"required"`
}

type UpdateLabelRequest struct {
	Name  *string `json:"name,omitempty"`
	Color *string `json:"color,omitempty"`
}

type LabelResponse struct {
	ID    string `json:"id"`
	Name  string `json:"name"`
	Color string `json:"color"`
}

// ==================== COMMENT ====================

type CreateCommentRequest struct {
	Content string `json:"content" binding:"required"`
	TaskID  string `json:"taskId" binding:"required"`
}

type UpdateCommentRequest struct {
	Content string `json:"content" binding:"required"`
}

type CommentResponse struct {
	ID        string        `json:"id"`
	Content   string        `json:"content"`
	Author    *UserResponse `json:"author,omitempty"`
	CreatedAt time.Time     `json:"createdAt"`
	UpdatedAt time.Time     `json:"updatedAt"`
}

// ==================== ATTACHMENT ====================

type AttachmentResponse struct {
	ID         string        `json:"id"`
	Name       string        `json:"name"`
	URL        string        `json:"url"`
	Type       string        `json:"type"`
	Size       int           `json:"size"`
	Uploader   *UserResponse `json:"uploader,omitempty"`
	UploadedAt time.Time     `json:"uploadedAt"`
}

// ==================== COMMON ====================

type PaginatedResponse struct {
	Data       interface{} `json:"data"`
	Total      int         `json:"total"`
	Page       int         `json:"page"`
	PageSize   int         `json:"pageSize"`
	TotalPages int         `json:"totalPages"`
}

type ErrorResponse struct {
	Error   string `json:"error"`
	Message string `json:"message"`
}

type ListParams struct {
	Page       int
	PageSize   int
	Search     string
	SortBy     string
	SortOrder  string
	Filters    map[string]string
}

func NewListParams() ListParams {
	return ListParams{
		Page:      1,
		PageSize:  20,
		SortBy:    "createdAt",
		SortOrder: "desc",
		Filters:   make(map[string]string),
	}
}
