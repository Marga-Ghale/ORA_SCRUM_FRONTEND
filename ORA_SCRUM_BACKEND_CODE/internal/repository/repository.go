package repository

import (
	"context"

	"github.com/Marga-Ghale/ORA_SCRUM_BACKEND/internal/db"
	"github.com/Marga-Ghale/ORA_SCRUM_BACKEND/internal/models"
)

type Repositories struct {
	User       UserRepository
	Workspace  WorkspaceRepository
	Space      SpaceRepository
	Project    ProjectRepository
	Sprint     SprintRepository
	Task       TaskRepository
	Label      LabelRepository
	Comment    CommentRepository
	Attachment AttachmentRepository
}

func NewRepositories(client *db.PrismaClient) *Repositories {
	return &Repositories{
		User:       NewUserRepository(client),
		Workspace:  NewWorkspaceRepository(client),
		Space:      NewSpaceRepository(client),
		Project:    NewProjectRepository(client),
		Sprint:     NewSprintRepository(client),
		Task:       NewTaskRepository(client),
		Label:      NewLabelRepository(client),
		Comment:    NewCommentRepository(client),
		Attachment: NewAttachmentRepository(client),
	}
}

// ==================== USER REPOSITORY ====================

type UserRepository interface {
	Create(ctx context.Context, email, password, name string) (*db.UserModel, error)
	FindByID(ctx context.Context, id string) (*db.UserModel, error)
	FindByEmail(ctx context.Context, email string) (*db.UserModel, error)
	Update(ctx context.Context, id string, data *models.UpdateUserRequest) (*db.UserModel, error)
	List(ctx context.Context, params models.ListParams) ([]db.UserModel, int, error)
}

type userRepository struct {
	client *db.PrismaClient
}

func NewUserRepository(client *db.PrismaClient) UserRepository {
	return &userRepository{client: client}
}

func (r *userRepository) Create(ctx context.Context, email, password, name string) (*db.UserModel, error) {
	return r.client.User.CreateOne(
		db.User.Email.Set(email),
		db.User.Password.Set(password),
		db.User.Name.Set(name),
	).Exec(ctx)
}

func (r *userRepository) FindByID(ctx context.Context, id string) (*db.UserModel, error) {
	return r.client.User.FindUnique(db.User.ID.Equals(id)).Exec(ctx)
}

func (r *userRepository) FindByEmail(ctx context.Context, email string) (*db.UserModel, error) {
	return r.client.User.FindUnique(db.User.Email.Equals(email)).Exec(ctx)
}

func (r *userRepository) Update(ctx context.Context, id string, data *models.UpdateUserRequest) (*db.UserModel, error) {
	params := []db.UserSetParam{}
	if data.Name != nil {
		params = append(params, db.User.Name.Set(*data.Name))
	}
	if data.Avatar != nil {
		params = append(params, db.User.Avatar.Set(*data.Avatar))
	}
	if data.Status != nil {
		params = append(params, db.User.Status.Set(db.UserStatus(*data.Status)))
	}
	return r.client.User.FindUnique(db.User.ID.Equals(id)).Update(params...).Exec(ctx)
}

func (r *userRepository) List(ctx context.Context, params models.ListParams) ([]db.UserModel, int, error) {
	offset := (params.Page - 1) * params.PageSize

	users, err := r.client.User.FindMany().
		Skip(offset).
		Take(params.PageSize).
		Exec(ctx)
	if err != nil {
		return nil, 0, err
	}

	count, err := r.client.User.FindMany().Exec(ctx)
	if err != nil {
		return nil, 0, err
	}

	return users, len(count), nil
}

// ==================== WORKSPACE REPOSITORY ====================

type WorkspaceRepository interface {
	Create(ctx context.Context, name string, logo *string) (*db.WorkspaceModel, error)
	FindByID(ctx context.Context, id string) (*db.WorkspaceModel, error)
	FindByUserID(ctx context.Context, userID string) ([]db.WorkspaceModel, error)
	Update(ctx context.Context, id string, data *models.UpdateWorkspaceRequest) (*db.WorkspaceModel, error)
	Delete(ctx context.Context, id string) error
	AddMember(ctx context.Context, workspaceID, userID, role string) error
	RemoveMember(ctx context.Context, workspaceID, userID string) error
	UpdateMemberRole(ctx context.Context, workspaceID, userID, role string) error
}

type workspaceRepository struct {
	client *db.PrismaClient
}

func NewWorkspaceRepository(client *db.PrismaClient) WorkspaceRepository {
	return &workspaceRepository{client: client}
}

func (r *workspaceRepository) Create(ctx context.Context, name string, logo *string) (*db.WorkspaceModel, error) {
	params := []db.WorkspaceSetParam{db.Workspace.Name.Set(name)}
	if logo != nil {
		params = append(params, db.Workspace.Logo.Set(*logo))
	}
	return r.client.Workspace.CreateOne(params...).Exec(ctx)
}

func (r *workspaceRepository) FindByID(ctx context.Context, id string) (*db.WorkspaceModel, error) {
	return r.client.Workspace.FindUnique(db.Workspace.ID.Equals(id)).
		With(db.Workspace.Members.Fetch().With(db.WorkspaceMember.User.Fetch())).
		With(db.Workspace.Spaces.Fetch()).
		Exec(ctx)
}

func (r *workspaceRepository) FindByUserID(ctx context.Context, userID string) ([]db.WorkspaceModel, error) {
	members, err := r.client.WorkspaceMember.FindMany(
		db.WorkspaceMember.UserID.Equals(userID),
	).With(db.WorkspaceMember.Workspace.Fetch()).Exec(ctx)
	if err != nil {
		return nil, err
	}

	workspaces := make([]db.WorkspaceModel, len(members))
	for i, m := range members {
		w := m.Workspace()
		workspaces[i] = *w
	}
	return workspaces, nil
}

func (r *workspaceRepository) Update(ctx context.Context, id string, data *models.UpdateWorkspaceRequest) (*db.WorkspaceModel, error) {
	params := []db.WorkspaceSetParam{}
	if data.Name != nil {
		params = append(params, db.Workspace.Name.Set(*data.Name))
	}
	if data.Logo != nil {
		params = append(params, db.Workspace.Logo.Set(*data.Logo))
	}
	return r.client.Workspace.FindUnique(db.Workspace.ID.Equals(id)).Update(params...).Exec(ctx)
}

func (r *workspaceRepository) Delete(ctx context.Context, id string) error {
	_, err := r.client.Workspace.FindUnique(db.Workspace.ID.Equals(id)).Delete().Exec(ctx)
	return err
}

func (r *workspaceRepository) AddMember(ctx context.Context, workspaceID, userID, role string) error {
	_, err := r.client.WorkspaceMember.CreateOne(
		db.WorkspaceMember.Workspace.Link(db.Workspace.ID.Equals(workspaceID)),
		db.WorkspaceMember.User.Link(db.User.ID.Equals(userID)),
		db.WorkspaceMember.Role.Set(db.MemberRole(role)),
	).Exec(ctx)
	return err
}

func (r *workspaceRepository) RemoveMember(ctx context.Context, workspaceID, userID string) error {
	_, err := r.client.WorkspaceMember.FindMany(
		db.WorkspaceMember.WorkspaceID.Equals(workspaceID),
		db.WorkspaceMember.UserID.Equals(userID),
	).Delete().Exec(ctx)
	return err
}

func (r *workspaceRepository) UpdateMemberRole(ctx context.Context, workspaceID, userID, role string) error {
	_, err := r.client.WorkspaceMember.FindMany(
		db.WorkspaceMember.WorkspaceID.Equals(workspaceID),
		db.WorkspaceMember.UserID.Equals(userID),
	).Update(db.WorkspaceMember.Role.Set(db.MemberRole(role))).Exec(ctx)
	return err
}

// ==================== SPACE REPOSITORY ====================

type SpaceRepository interface {
	Create(ctx context.Context, req *models.CreateSpaceRequest) (*db.SpaceModel, error)
	FindByID(ctx context.Context, id string) (*db.SpaceModel, error)
	FindByWorkspaceID(ctx context.Context, workspaceID string) ([]db.SpaceModel, error)
	Update(ctx context.Context, id string, data *models.UpdateSpaceRequest) (*db.SpaceModel, error)
	Delete(ctx context.Context, id string) error
}

type spaceRepository struct {
	client *db.PrismaClient
}

func NewSpaceRepository(client *db.PrismaClient) SpaceRepository {
	return &spaceRepository{client: client}
}

func (r *spaceRepository) Create(ctx context.Context, req *models.CreateSpaceRequest) (*db.SpaceModel, error) {
	params := []db.SpaceSetParam{
		db.Space.Name.Set(req.Name),
		db.Space.Workspace.Link(db.Workspace.ID.Equals(req.WorkspaceID)),
	}
	if req.Icon != nil {
		params = append(params, db.Space.Icon.Set(*req.Icon))
	}
	if req.Color != nil {
		params = append(params, db.Space.Color.Set(*req.Color))
	}
	return r.client.Space.CreateOne(params...).Exec(ctx)
}

func (r *spaceRepository) FindByID(ctx context.Context, id string) (*db.SpaceModel, error) {
	return r.client.Space.FindUnique(db.Space.ID.Equals(id)).
		With(db.Space.Projects.Fetch()).
		Exec(ctx)
}

func (r *spaceRepository) FindByWorkspaceID(ctx context.Context, workspaceID string) ([]db.SpaceModel, error) {
	return r.client.Space.FindMany(db.Space.WorkspaceID.Equals(workspaceID)).
		With(db.Space.Projects.Fetch()).
		Exec(ctx)
}

func (r *spaceRepository) Update(ctx context.Context, id string, data *models.UpdateSpaceRequest) (*db.SpaceModel, error) {
	params := []db.SpaceSetParam{}
	if data.Name != nil {
		params = append(params, db.Space.Name.Set(*data.Name))
	}
	if data.Icon != nil {
		params = append(params, db.Space.Icon.Set(*data.Icon))
	}
	if data.Color != nil {
		params = append(params, db.Space.Color.Set(*data.Color))
	}
	return r.client.Space.FindUnique(db.Space.ID.Equals(id)).Update(params...).Exec(ctx)
}

func (r *spaceRepository) Delete(ctx context.Context, id string) error {
	_, err := r.client.Space.FindUnique(db.Space.ID.Equals(id)).Delete().Exec(ctx)
	return err
}

// ==================== PROJECT REPOSITORY ====================

type ProjectRepository interface {
	Create(ctx context.Context, req *models.CreateProjectRequest, leadID string) (*db.ProjectModel, error)
	FindByID(ctx context.Context, id string) (*db.ProjectModel, error)
	FindBySpaceID(ctx context.Context, spaceID string) ([]db.ProjectModel, error)
	Update(ctx context.Context, id string, data *models.UpdateProjectRequest) (*db.ProjectModel, error)
	Delete(ctx context.Context, id string) error
	AddMember(ctx context.Context, projectID, userID, role string) error
	RemoveMember(ctx context.Context, projectID, userID string) error
	GetNextTaskNumber(ctx context.Context, projectID string) (int, error)
}

type projectRepository struct {
	client *db.PrismaClient
}

func NewProjectRepository(client *db.PrismaClient) ProjectRepository {
	return &projectRepository{client: client}
}

func (r *projectRepository) Create(ctx context.Context, req *models.CreateProjectRequest, leadID string) (*db.ProjectModel, error) {
	params := []db.ProjectSetParam{
		db.Project.Name.Set(req.Name),
		db.Project.Key.Set(req.Key),
		db.Project.Space.Link(db.Space.ID.Equals(req.SpaceID)),
		db.Project.Lead.Link(db.User.ID.Equals(leadID)),
	}
	if req.Description != nil {
		params = append(params, db.Project.Description.Set(*req.Description))
	}
	if req.Icon != nil {
		params = append(params, db.Project.Icon.Set(*req.Icon))
	}
	if req.Color != nil {
		params = append(params, db.Project.Color.Set(*req.Color))
	}
	return r.client.Project.CreateOne(params...).Exec(ctx)
}

func (r *projectRepository) FindByID(ctx context.Context, id string) (*db.ProjectModel, error) {
	return r.client.Project.FindUnique(db.Project.ID.Equals(id)).
		With(db.Project.Lead.Fetch()).
		With(db.Project.Members.Fetch().With(db.ProjectMember.User.Fetch())).
		With(db.Project.Sprints.Fetch()).
		With(db.Project.Labels.Fetch()).
		Exec(ctx)
}

func (r *projectRepository) FindBySpaceID(ctx context.Context, spaceID string) ([]db.ProjectModel, error) {
	return r.client.Project.FindMany(db.Project.SpaceID.Equals(spaceID)).
		With(db.Project.Lead.Fetch()).
		Exec(ctx)
}

func (r *projectRepository) Update(ctx context.Context, id string, data *models.UpdateProjectRequest) (*db.ProjectModel, error) {
	params := []db.ProjectSetParam{}
	if data.Name != nil {
		params = append(params, db.Project.Name.Set(*data.Name))
	}
	if data.Key != nil {
		params = append(params, db.Project.Key.Set(*data.Key))
	}
	if data.Description != nil {
		params = append(params, db.Project.Description.Set(*data.Description))
	}
	if data.Icon != nil {
		params = append(params, db.Project.Icon.Set(*data.Icon))
	}
	if data.Color != nil {
		params = append(params, db.Project.Color.Set(*data.Color))
	}
	return r.client.Project.FindUnique(db.Project.ID.Equals(id)).Update(params...).Exec(ctx)
}

func (r *projectRepository) Delete(ctx context.Context, id string) error {
	_, err := r.client.Project.FindUnique(db.Project.ID.Equals(id)).Delete().Exec(ctx)
	return err
}

func (r *projectRepository) AddMember(ctx context.Context, projectID, userID, role string) error {
	_, err := r.client.ProjectMember.CreateOne(
		db.ProjectMember.Project.Link(db.Project.ID.Equals(projectID)),
		db.ProjectMember.User.Link(db.User.ID.Equals(userID)),
		db.ProjectMember.Role.Set(db.MemberRole(role)),
	).Exec(ctx)
	return err
}

func (r *projectRepository) RemoveMember(ctx context.Context, projectID, userID string) error {
	_, err := r.client.ProjectMember.FindMany(
		db.ProjectMember.ProjectID.Equals(projectID),
		db.ProjectMember.UserID.Equals(userID),
	).Delete().Exec(ctx)
	return err
}

func (r *projectRepository) GetNextTaskNumber(ctx context.Context, projectID string) (int, error) {
	tasks, err := r.client.Task.FindMany(db.Task.ProjectID.Equals(projectID)).Exec(ctx)
	if err != nil {
		return 1, err
	}
	return len(tasks) + 1, nil
}

// ==================== SPRINT REPOSITORY ====================

type SprintRepository interface {
	Create(ctx context.Context, req *models.CreateSprintRequest) (*db.SprintModel, error)
	FindByID(ctx context.Context, id string) (*db.SprintModel, error)
	FindByProjectID(ctx context.Context, projectID string) ([]db.SprintModel, error)
	Update(ctx context.Context, id string, data *models.UpdateSprintRequest) (*db.SprintModel, error)
	UpdateStatus(ctx context.Context, id string, status string) (*db.SprintModel, error)
	Delete(ctx context.Context, id string) error
}

type sprintRepository struct {
	client *db.PrismaClient
}

func NewSprintRepository(client *db.PrismaClient) SprintRepository {
	return &sprintRepository{client: client}
}

func (r *sprintRepository) Create(ctx context.Context, req *models.CreateSprintRequest) (*db.SprintModel, error) {
	params := []db.SprintSetParam{
		db.Sprint.Name.Set(req.Name),
		db.Sprint.StartDate.Set(req.StartDate),
		db.Sprint.EndDate.Set(req.EndDate),
		db.Sprint.Project.Link(db.Project.ID.Equals(req.ProjectID)),
	}
	if req.Goal != nil {
		params = append(params, db.Sprint.Goal.Set(*req.Goal))
	}
	return r.client.Sprint.CreateOne(params...).Exec(ctx)
}

func (r *sprintRepository) FindByID(ctx context.Context, id string) (*db.SprintModel, error) {
	return r.client.Sprint.FindUnique(db.Sprint.ID.Equals(id)).
		With(db.Sprint.Tasks.Fetch()).
		Exec(ctx)
}

func (r *sprintRepository) FindByProjectID(ctx context.Context, projectID string) ([]db.SprintModel, error) {
	return r.client.Sprint.FindMany(db.Sprint.ProjectID.Equals(projectID)).
		With(db.Sprint.Tasks.Fetch()).
		OrderBy(db.Sprint.StartDate.Order(db.ASC)).
		Exec(ctx)
}

func (r *sprintRepository) Update(ctx context.Context, id string, data *models.UpdateSprintRequest) (*db.SprintModel, error) {
	params := []db.SprintSetParam{}
	if data.Name != nil {
		params = append(params, db.Sprint.Name.Set(*data.Name))
	}
	if data.Goal != nil {
		params = append(params, db.Sprint.Goal.Set(*data.Goal))
	}
	if data.StartDate != nil {
		params = append(params, db.Sprint.StartDate.Set(*data.StartDate))
	}
	if data.EndDate != nil {
		params = append(params, db.Sprint.EndDate.Set(*data.EndDate))
	}
	return r.client.Sprint.FindUnique(db.Sprint.ID.Equals(id)).Update(params...).Exec(ctx)
}

func (r *sprintRepository) UpdateStatus(ctx context.Context, id string, status string) (*db.SprintModel, error) {
	return r.client.Sprint.FindUnique(db.Sprint.ID.Equals(id)).
		Update(db.Sprint.Status.Set(db.SprintStatus(status))).
		Exec(ctx)
}

func (r *sprintRepository) Delete(ctx context.Context, id string) error {
	_, err := r.client.Sprint.FindUnique(db.Sprint.ID.Equals(id)).Delete().Exec(ctx)
	return err
}

// ==================== TASK REPOSITORY ====================

type TaskRepository interface {
	Create(ctx context.Context, req *models.CreateTaskRequest, key string, reporterID string) (*db.TaskModel, error)
	FindByID(ctx context.Context, id string) (*db.TaskModel, error)
	FindByProjectID(ctx context.Context, projectID string, params models.ListParams) ([]db.TaskModel, int, error)
	FindBySprintID(ctx context.Context, sprintID string) ([]db.TaskModel, error)
	Update(ctx context.Context, id string, data *models.UpdateTaskRequest) (*db.TaskModel, error)
	UpdateStatus(ctx context.Context, id, status string) (*db.TaskModel, error)
	UpdateAssignee(ctx context.Context, id string, assigneeID *string) (*db.TaskModel, error)
	UpdateOrder(ctx context.Context, id string, order int) error
	Delete(ctx context.Context, id string) error
}

type taskRepository struct {
	client *db.PrismaClient
}

func NewTaskRepository(client *db.PrismaClient) TaskRepository {
	return &taskRepository{client: client}
}

func (r *taskRepository) Create(ctx context.Context, req *models.CreateTaskRequest, key string, reporterID string) (*db.TaskModel, error) {
	params := []db.TaskSetParam{
		db.Task.Key.Set(key),
		db.Task.Title.Set(req.Title),
		db.Task.Project.Link(db.Project.ID.Equals(req.ProjectID)),
		db.Task.Reporter.Link(db.User.ID.Equals(reporterID)),
	}

	if req.Description != nil {
		params = append(params, db.Task.Description.Set(*req.Description))
	}
	if req.Status != nil {
		params = append(params, db.Task.Status.Set(db.TaskStatus(*req.Status)))
	}
	if req.Priority != nil {
		params = append(params, db.Task.Priority.Set(db.Priority(*req.Priority)))
	}
	if req.Type != nil {
		params = append(params, db.Task.Type.Set(db.TaskType(*req.Type)))
	}
	if req.StoryPoints != nil {
		params = append(params, db.Task.StoryPoints.Set(*req.StoryPoints))
	}
	if req.SprintID != nil {
		params = append(params, db.Task.Sprint.Link(db.Sprint.ID.Equals(*req.SprintID)))
	}
	if req.AssigneeID != nil {
		params = append(params, db.Task.Assignee.Link(db.User.ID.Equals(*req.AssigneeID)))
	}
	if req.ParentID != nil {
		params = append(params, db.Task.Parent.Link(db.Task.ID.Equals(*req.ParentID)))
	}

	return r.client.Task.CreateOne(params...).Exec(ctx)
}

func (r *taskRepository) FindByID(ctx context.Context, id string) (*db.TaskModel, error) {
	return r.client.Task.FindUnique(db.Task.ID.Equals(id)).
		With(db.Task.Assignee.Fetch()).
		With(db.Task.Reporter.Fetch()).
		With(db.Task.Labels.Fetch().With(db.TaskLabel.Label.Fetch())).
		With(db.Task.Subtasks.Fetch()).
		With(db.Task.Comments.Fetch().With(db.Comment.Author.Fetch())).
		Exec(ctx)
}

func (r *taskRepository) FindByProjectID(ctx context.Context, projectID string, params models.ListParams) ([]db.TaskModel, int, error) {
	offset := (params.Page - 1) * params.PageSize

	tasks, err := r.client.Task.FindMany(db.Task.ProjectID.Equals(projectID)).
		With(db.Task.Assignee.Fetch()).
		With(db.Task.Reporter.Fetch()).
		With(db.Task.Labels.Fetch().With(db.TaskLabel.Label.Fetch())).
		OrderBy(db.Task.Order.Order(db.ASC)).
		Skip(offset).
		Take(params.PageSize).
		Exec(ctx)
	if err != nil {
		return nil, 0, err
	}

	all, err := r.client.Task.FindMany(db.Task.ProjectID.Equals(projectID)).Exec(ctx)
	if err != nil {
		return nil, 0, err
	}

	return tasks, len(all), nil
}

func (r *taskRepository) FindBySprintID(ctx context.Context, sprintID string) ([]db.TaskModel, error) {
	return r.client.Task.FindMany(db.Task.SprintID.Equals(sprintID)).
		With(db.Task.Assignee.Fetch()).
		With(db.Task.Labels.Fetch().With(db.TaskLabel.Label.Fetch())).
		OrderBy(db.Task.Order.Order(db.ASC)).
		Exec(ctx)
}

func (r *taskRepository) Update(ctx context.Context, id string, data *models.UpdateTaskRequest) (*db.TaskModel, error) {
	params := []db.TaskSetParam{}
	if data.Title != nil {
		params = append(params, db.Task.Title.Set(*data.Title))
	}
	if data.Description != nil {
		params = append(params, db.Task.Description.Set(*data.Description))
	}
	if data.Status != nil {
		params = append(params, db.Task.Status.Set(db.TaskStatus(*data.Status)))
	}
	if data.Priority != nil {
		params = append(params, db.Task.Priority.Set(db.Priority(*data.Priority)))
	}
	if data.Type != nil {
		params = append(params, db.Task.Type.Set(db.TaskType(*data.Type)))
	}
	if data.StoryPoints != nil {
		params = append(params, db.Task.StoryPoints.Set(*data.StoryPoints))
	}
	return r.client.Task.FindUnique(db.Task.ID.Equals(id)).Update(params...).Exec(ctx)
}

func (r *taskRepository) UpdateStatus(ctx context.Context, id, status string) (*db.TaskModel, error) {
	return r.client.Task.FindUnique(db.Task.ID.Equals(id)).
		Update(db.Task.Status.Set(db.TaskStatus(status))).
		Exec(ctx)
}

func (r *taskRepository) UpdateAssignee(ctx context.Context, id string, assigneeID *string) (*db.TaskModel, error) {
	if assigneeID == nil {
		return r.client.Task.FindUnique(db.Task.ID.Equals(id)).
			Update(db.Task.Assignee.Unlink()).
			Exec(ctx)
	}
	return r.client.Task.FindUnique(db.Task.ID.Equals(id)).
		Update(db.Task.Assignee.Link(db.User.ID.Equals(*assigneeID))).
		Exec(ctx)
}

func (r *taskRepository) UpdateOrder(ctx context.Context, id string, order int) error {
	_, err := r.client.Task.FindUnique(db.Task.ID.Equals(id)).
		Update(db.Task.Order.Set(order)).
		Exec(ctx)
	return err
}

func (r *taskRepository) Delete(ctx context.Context, id string) error {
	_, err := r.client.Task.FindUnique(db.Task.ID.Equals(id)).Delete().Exec(ctx)
	return err
}

// ==================== LABEL REPOSITORY ====================

type LabelRepository interface {
	Create(ctx context.Context, req *models.CreateLabelRequest) (*db.LabelModel, error)
	FindByID(ctx context.Context, id string) (*db.LabelModel, error)
	FindByProjectID(ctx context.Context, projectID string) ([]db.LabelModel, error)
	Update(ctx context.Context, id string, data *models.UpdateLabelRequest) (*db.LabelModel, error)
	Delete(ctx context.Context, id string) error
	AddToTask(ctx context.Context, taskID, labelID string) error
	RemoveFromTask(ctx context.Context, taskID, labelID string) error
}

type labelRepository struct {
	client *db.PrismaClient
}

func NewLabelRepository(client *db.PrismaClient) LabelRepository {
	return &labelRepository{client: client}
}

func (r *labelRepository) Create(ctx context.Context, req *models.CreateLabelRequest) (*db.LabelModel, error) {
	params := []db.LabelSetParam{
		db.Label.Name.Set(req.Name),
		db.Label.Project.Link(db.Project.ID.Equals(req.ProjectID)),
	}
	if req.Color != nil {
		params = append(params, db.Label.Color.Set(*req.Color))
	}
	return r.client.Label.CreateOne(params...).Exec(ctx)
}

func (r *labelRepository) FindByID(ctx context.Context, id string) (*db.LabelModel, error) {
	return r.client.Label.FindUnique(db.Label.ID.Equals(id)).Exec(ctx)
}

func (r *labelRepository) FindByProjectID(ctx context.Context, projectID string) ([]db.LabelModel, error) {
	return r.client.Label.FindMany(db.Label.ProjectID.Equals(projectID)).Exec(ctx)
}

func (r *labelRepository) Update(ctx context.Context, id string, data *models.UpdateLabelRequest) (*db.LabelModel, error) {
	params := []db.LabelSetParam{}
	if data.Name != nil {
		params = append(params, db.Label.Name.Set(*data.Name))
	}
	if data.Color != nil {
		params = append(params, db.Label.Color.Set(*data.Color))
	}
	return r.client.Label.FindUnique(db.Label.ID.Equals(id)).Update(params...).Exec(ctx)
}

func (r *labelRepository) Delete(ctx context.Context, id string) error {
	_, err := r.client.Label.FindUnique(db.Label.ID.Equals(id)).Delete().Exec(ctx)
	return err
}

func (r *labelRepository) AddToTask(ctx context.Context, taskID, labelID string) error {
	_, err := r.client.TaskLabel.CreateOne(
		db.TaskLabel.Task.Link(db.Task.ID.Equals(taskID)),
		db.TaskLabel.Label.Link(db.Label.ID.Equals(labelID)),
	).Exec(ctx)
	return err
}

func (r *labelRepository) RemoveFromTask(ctx context.Context, taskID, labelID string) error {
	_, err := r.client.TaskLabel.FindMany(
		db.TaskLabel.TaskID.Equals(taskID),
		db.TaskLabel.LabelID.Equals(labelID),
	).Delete().Exec(ctx)
	return err
}

// ==================== COMMENT REPOSITORY ====================

type CommentRepository interface {
	Create(ctx context.Context, req *models.CreateCommentRequest, authorID string) (*db.CommentModel, error)
	FindByID(ctx context.Context, id string) (*db.CommentModel, error)
	FindByTaskID(ctx context.Context, taskID string) ([]db.CommentModel, error)
	Update(ctx context.Context, id string, content string) (*db.CommentModel, error)
	Delete(ctx context.Context, id string) error
}

type commentRepository struct {
	client *db.PrismaClient
}

func NewCommentRepository(client *db.PrismaClient) CommentRepository {
	return &commentRepository{client: client}
}

func (r *commentRepository) Create(ctx context.Context, req *models.CreateCommentRequest, authorID string) (*db.CommentModel, error) {
	return r.client.Comment.CreateOne(
		db.Comment.Content.Set(req.Content),
		db.Comment.Task.Link(db.Task.ID.Equals(req.TaskID)),
		db.Comment.Author.Link(db.User.ID.Equals(authorID)),
	).Exec(ctx)
}

func (r *commentRepository) FindByID(ctx context.Context, id string) (*db.CommentModel, error) {
	return r.client.Comment.FindUnique(db.Comment.ID.Equals(id)).
		With(db.Comment.Author.Fetch()).
		Exec(ctx)
}

func (r *commentRepository) FindByTaskID(ctx context.Context, taskID string) ([]db.CommentModel, error) {
	return r.client.Comment.FindMany(db.Comment.TaskID.Equals(taskID)).
		With(db.Comment.Author.Fetch()).
		OrderBy(db.Comment.CreatedAt.Order(db.DESC)).
		Exec(ctx)
}

func (r *commentRepository) Update(ctx context.Context, id string, content string) (*db.CommentModel, error) {
	return r.client.Comment.FindUnique(db.Comment.ID.Equals(id)).
		Update(db.Comment.Content.Set(content)).
		Exec(ctx)
}

func (r *commentRepository) Delete(ctx context.Context, id string) error {
	_, err := r.client.Comment.FindUnique(db.Comment.ID.Equals(id)).Delete().Exec(ctx)
	return err
}

// ==================== ATTACHMENT REPOSITORY ====================

type AttachmentRepository interface {
	Create(ctx context.Context, name, url, mimeType string, size int, taskID, uploaderID string) (*db.AttachmentModel, error)
	FindByID(ctx context.Context, id string) (*db.AttachmentModel, error)
	FindByTaskID(ctx context.Context, taskID string) ([]db.AttachmentModel, error)
	Delete(ctx context.Context, id string) error
}

type attachmentRepository struct {
	client *db.PrismaClient
}

func NewAttachmentRepository(client *db.PrismaClient) AttachmentRepository {
	return &attachmentRepository{client: client}
}

func (r *attachmentRepository) Create(ctx context.Context, name, url, mimeType string, size int, taskID, uploaderID string) (*db.AttachmentModel, error) {
	return r.client.Attachment.CreateOne(
		db.Attachment.Name.Set(name),
		db.Attachment.URL.Set(url),
		db.Attachment.Type.Set(mimeType),
		db.Attachment.Size.Set(size),
		db.Attachment.Task.Link(db.Task.ID.Equals(taskID)),
		db.Attachment.Uploader.Link(db.User.ID.Equals(uploaderID)),
	).Exec(ctx)
}

func (r *attachmentRepository) FindByID(ctx context.Context, id string) (*db.AttachmentModel, error) {
	return r.client.Attachment.FindUnique(db.Attachment.ID.Equals(id)).
		With(db.Attachment.Uploader.Fetch()).
		Exec(ctx)
}

func (r *attachmentRepository) FindByTaskID(ctx context.Context, taskID string) ([]db.AttachmentModel, error) {
	return r.client.Attachment.FindMany(db.Attachment.TaskID.Equals(taskID)).
		With(db.Attachment.Uploader.Fetch()).
		Exec(ctx)
}

func (r *attachmentRepository) Delete(ctx context.Context, id string) error {
	_, err := r.client.Attachment.FindUnique(db.Attachment.ID.Equals(id)).Delete().Exec(ctx)
	return err
}
