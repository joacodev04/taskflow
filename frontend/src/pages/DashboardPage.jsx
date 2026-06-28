import { useEffect } from "react";
import DashboardHeader from "../components/dashboard/DashboardHeader";
import DeleteTaskModal from "../components/dashboard/DeleteTaskModal";
import MetricsGrid from "../components/dashboard/MetricsGrid";
import TaskCreateCard from "../components/dashboard/TaskCreateCard";
import TaskEditCard from "../components/dashboard/TaskEditCard";
import TaskTableSection from "../components/dashboard/TaskTableSection";
import InlineMessage from "../components/common/InlineMessage";
import ToastStack from "../components/common/ToastStack";
import { useAuth } from "../contexts/AuthContext";
import useTaskDashboard from "../hooks/useTaskDashboard";

function DashboardPage() {
  const { token, logout } = useAuth();
  const dashboard = useTaskDashboard(token, logout);

  useEffect(() => {
    document.title = "Taskflow | Panel Admin";
  }, []);

  return (
    <main className="dashboard">
      <ToastStack toasts={dashboard.toasts} />
      <DeleteTaskModal
        taskName={dashboard.deleteTarget?.tarea || ""}
        isOpen={Boolean(dashboard.deleteTarget)}
        onCancel={dashboard.cancelDelete}
        onConfirm={dashboard.confirmDeleteTask}
      />

      <DashboardHeader onRefresh={() => void dashboard.loadTasks()} onLogout={logout} />
      <MetricsGrid metrics={dashboard.metrics} />
      <InlineMessage message={dashboard.message} />

      <section className="row g-4">
        <TaskCreateCard
          form={dashboard.createForm}
          onFieldChange={dashboard.updateCreateField}
          onSubmit={() => void dashboard.submitCreateTask()}
        />
        <TaskEditCard
          form={dashboard.editForm}
          onFieldChange={dashboard.updateEditField}
          onSubmit={() => void dashboard.submitUpdateTask()}
          onDeleteRequest={() =>
            dashboard.editForm.id
              ? dashboard.requestDelete({
                  id: dashboard.editForm.id,
                  tarea: dashboard.editForm.tareaActual
                })
              : null
          }
        />
      </section>

      <TaskTableSection
        tasks={dashboard.tasks}
        tableStatus={dashboard.tableStatus}
        onEdit={dashboard.selectTask}
        onDelete={dashboard.requestDelete}
      />
    </main>
  );
}

export default DashboardPage;
