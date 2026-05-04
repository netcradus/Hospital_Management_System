import { useEffect, useState } from "react";
import Badge from "../../components/common/Badge";
import Card from "../../components/common/Card";
import EmptyState from "../../components/common/EmptyState";
import PageHeader from "../../components/common/PageHeader";
import { createEntityService } from "../../services/entityService";

const departmentService = createEntityService("departments");
const doctorService = createEntityService("doctors");

function DepartmentsPage() {
  const [departments, setDepartments] = useState([]);
  const [doctors, setDoctors] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      setIsLoading(true);
      try {
        const [departmentResponse, doctorResponse] = await Promise.all([
          departmentService.list({ limit: 100 }, { force: true }),
          doctorService.list({ limit: 100 }, { force: true }),
        ]);
        setDepartments(departmentResponse.items);
        setDoctors(doctorResponse.items);
      } finally {
        setIsLoading(false);
      }
    };

    load();
  }, []);

  if (isLoading) {
    return <div className="min-h-[40vh]" />;
  }

  return (
    <div className="space-y-6">
      <PageHeader eyebrow="Departments" title="Department Management" description="Department heads, doctors by department, and direct operational contact details." />
      {departments.length ? (
        <div className="grid gap-6 lg:grid-cols-2">
          {departments.map((department) => {
            const departmentDoctors = doctors.filter((doctor) => String(doctor.departmentId?._id || doctor.departmentId) === String(department._id));
            const head = departmentDoctors[0];
            return (
              <Card key={department._id} title={department.name} subtitle={department.description || "Department details"}>
                <div className="space-y-4">
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge variant="info">Head</Badge>
                    <span className="text-sm">{head ? `Dr. ${head.firstName} ${head.lastName}` : "Head not assigned"}</span>
                  </div>
                  <div className="rounded-[24px] bg-[var(--panel-muted)] p-4">
                    <p className="text-sm text-[var(--text-muted)]">Contact</p>
                    <p className="mt-2 font-medium">{department.phone || "No phone"}</p>
                    <p className="text-sm text-[var(--text-muted)]">{department.email || "No email"}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-[var(--field-label)]">Doctors in Department</p>
                    <div className="mt-3 flex flex-wrap gap-2">
                      {departmentDoctors.length ? departmentDoctors.map((doctor) => (
                        <span key={doctor._id} className="rounded-full bg-[var(--panel-muted)] px-4 py-2 text-sm">
                          Dr. {doctor.firstName} {doctor.lastName}
                        </span>
                      )) : <span className="text-sm text-[var(--text-muted)]">No doctors assigned yet.</span>}
                    </div>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      ) : (
        <EmptyState title="No departments found" description="Department records will appear here when available." />
      )}
    </div>
  );
}

export default DepartmentsPage;
